terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "app_name" {
  type    = string
  default = "fusion-electronics"
}

locals {
  cluster_name  = "${var.app_name}-ecs-cluster"
  backend_image = "${data.aws_ecr_repository.backend.repository_url}:1.1.0"
  frontend_image = "${data.aws_ecr_repository.frontend.repository_url}:1.1.0"
}

data "aws_caller_identity" "current" {}

data "aws_ecr_repository" "backend" {
  name = "${var.app_name}-backend"
}

data "aws_ecr_repository" "frontend" {
  name = "${var.app_name}-frontend"
}

# VPC & Networking (uses default VPC for brevity)
data "aws_vpc" "default" {
  default = true
}
data "aws_subnets" "default" {
  filter { name = "vpc-id", values = [data.aws_vpc.default.id] }
}

resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  vpc_id      = data.aws_vpc.default.id
  description = "Allow HTTP inbound"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "app" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.app_name}-backend-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"
  health_check {
    path                = "/health"
    interval            = 30
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_ecs_cluster" "main" {
  name = local.cluster_name
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  container_definitions    = jsonencode([
    {
      name      = "backend"
      image     = local.backend_image
      portMappings = [{ containerPort = 5000, protocol = "tcp" }]
      environment = [
        { name = "MONGODB_URI", value = var.mongodb_uri },
        { name = "JWT_SECRET",   value = var.jwt_secret },
      ]
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend-svc"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  launch_type     = "FARGATE"
  desired_count   = 2
  network_configuration {
    subnets         = data.aws_subnets.default.ids
    security_groups = [aws_security_group.alb.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 5000
  }
  depends_on = [aws_lb_listener.http]
}

resource "aws_rds_cluster" "postgres" {
  cluster_identifier      = "${var.app_name}-db"
  engine                  = "aurora-postgresql"
  master_username         = var.db_username
  master_password         = var.db_password
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.alb.id]
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  description = "Subnet group for RDS"
}

# Variables for secrets (should be provided via terraform.tfvars or ENV)
variable "mongodb_uri" { type = string }
variable "jwt_secret"   { type = string }
variable "db_username"  { type = string }
variable "db_password"  { type = string }

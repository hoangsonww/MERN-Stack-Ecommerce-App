#!/bin/bash

################################################################################
# Blue-Green Deployment Script for Fusion Electronics
#
# This script implements blue-green deployment strategy for zero-downtime
# deployments. It maintains two identical production environments (blue and green)
# and switches traffic between them.
#
# Usage:
#   ./blue-green-deploy.sh [deploy-green|switch-to-green|switch-to-blue|cleanup-blue|cleanup-green]
#
# @author Fusion Electronics DevOps Team
# @version 2.0.0
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${K8S_NAMESPACE:-fusion-ecommerce}"
APP_NAME="${APP_NAME:-fusion-electronics}"
BUILD_TAG="${BUILD_TAG:-latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-}:${BUILD_TAG}"
BACKEND_IMAGE="${BACKEND_IMAGE:-}:${BUILD_TAG}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Get current active environment
get_active_environment() {
    local service_selector=$(kubectl get service ${APP_NAME} -n ${NAMESPACE} -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "")

    if [ -z "$service_selector" ]; then
        echo "blue"  # Default to blue
    else
        echo "$service_selector"
    fi
}

# Deploy to green environment
deploy_green() {
    log_info "Deploying to GREEN environment..."

    # Apply green deployment manifests
    kubectl apply -f deployment/k8s/blue-green/frontend-green-deployment.yaml -n ${NAMESPACE}
    kubectl apply -f deployment/k8s/blue-green/backend-green-deployment.yaml -n ${NAMESPACE}

    # Update image tags
    kubectl set image deployment/${APP_NAME}-frontend-green \
        frontend=${FRONTEND_IMAGE} \
        -n ${NAMESPACE}

    kubectl set image deployment/${APP_NAME}-backend-green \
        backend=${BACKEND_IMAGE} \
        -n ${NAMESPACE}

    log_info "Waiting for green deployments to be ready..."
    kubectl rollout status deployment/${APP_NAME}-frontend-green -n ${NAMESPACE} --timeout=10m
    kubectl rollout status deployment/${APP_NAME}-backend-green -n ${NAMESPACE} --timeout=10m

    log_success "GREEN environment deployed successfully"
}

# Deploy to blue environment
deploy_blue() {
    log_info "Deploying to BLUE environment..."

    # Apply blue deployment manifests
    kubectl apply -f deployment/k8s/blue-green/frontend-blue-deployment.yaml -n ${NAMESPACE}
    kubectl apply -f deployment/k8s/blue-green/backend-blue-deployment.yaml -n ${NAMESPACE}

    # Update image tags
    kubectl set image deployment/${APP_NAME}-frontend-blue \
        frontend=${FRONTEND_IMAGE} \
        -n ${NAMESPACE}

    kubectl set image deployment/${APP_NAME}-backend-blue \
        backend=${BACKEND_IMAGE} \
        -n ${NAMESPACE}

    log_info "Waiting for blue deployments to be ready..."
    kubectl rollout status deployment/${APP_NAME}-frontend-blue -n ${NAMESPACE} --timeout=10m
    kubectl rollout status deployment/${APP_NAME}-backend-blue -n ${NAMESPACE} --timeout=10m

    log_success "BLUE environment deployed successfully"
}

# Switch traffic to green environment
switch_to_green() {
    local current_env=$(get_active_environment)
    log_info "Current active environment: ${current_env}"

    if [ "$current_env" == "green" ]; then
        log_warning "Already pointing to GREEN environment"
        return 0
    fi

    log_info "Switching traffic to GREEN environment..."

    # Update service selector to point to green
    kubectl patch service ${APP_NAME}-frontend -n ${NAMESPACE} -p '{"spec":{"selector":{"version":"green"}}}'
    kubectl patch service ${APP_NAME}-backend -n ${NAMESPACE} -p '{"spec":{"selector":{"version":"green"}}}'

    # Verify the switch
    sleep 5
    local new_env=$(get_active_environment)

    if [ "$new_env" == "green" ]; then
        log_success "Traffic successfully switched to GREEN environment"
    else
        log_error "Failed to switch traffic to GREEN environment"
        return 1
    fi
}

# Switch traffic to blue environment
switch_to_blue() {
    local current_env=$(get_active_environment)
    log_info "Current active environment: ${current_env}"

    if [ "$current_env" == "blue" ]; then
        log_warning "Already pointing to BLUE environment"
        return 0
    fi

    log_info "Switching traffic to BLUE environment..."

    # Update service selector to point to blue
    kubectl patch service ${APP_NAME}-frontend -n ${NAMESPACE} -p '{"spec":{"selector":{"version":"blue"}}}'
    kubectl patch service ${APP_NAME}-backend -n ${NAMESPACE} -p '{"spec":{"selector":{"version":"blue"}}}'

    # Verify the switch
    sleep 5
    local new_env=$(get_active_environment)

    if [ "$new_env" == "blue" ]; then
        log_success "Traffic successfully switched to BLUE environment"
    else
        log_error "Failed to switch traffic to BLUE environment"
        return 1
    fi
}

# Cleanup blue environment
cleanup_blue() {
    log_warning "Cleaning up BLUE environment..."

    local current_env=$(get_active_environment)
    if [ "$current_env" == "blue" ]; then
        log_error "Cannot cleanup BLUE environment while it's active"
        exit 1
    fi

    # Scale down blue deployments
    kubectl scale deployment ${APP_NAME}-frontend-blue --replicas=0 -n ${NAMESPACE} || true
    kubectl scale deployment ${APP_NAME}-backend-blue --replicas=0 -n ${NAMESPACE} || true

    log_success "BLUE environment cleaned up"
}

# Cleanup green environment
cleanup_green() {
    log_warning "Cleaning up GREEN environment..."

    local current_env=$(get_active_environment)
    if [ "$current_env" == "green" ]; then
        log_error "Cannot cleanup GREEN environment while it's active"
        exit 1
    fi

    # Scale down green deployments
    kubectl scale deployment ${APP_NAME}-frontend-green --replicas=0 -n ${NAMESPACE} || true
    kubectl scale deployment ${APP_NAME}-backend-green --replicas=0 -n ${NAMESPACE} || true

    log_success "GREEN environment cleaned up"
}

# Get deployment status
get_status() {
    log_info "Deployment Status:"
    echo ""

    local current_env=$(get_active_environment)
    log_info "Active Environment: ${current_env^^}"
    echo ""

    log_info "BLUE Environment:"
    kubectl get deployments -n ${NAMESPACE} -l version=blue -o wide || log_warning "No blue deployments found"
    echo ""

    log_info "GREEN Environment:"
    kubectl get deployments -n ${NAMESPACE} -l version=green -o wide || log_warning "No green deployments found"
    echo ""

    log_info "Services:"
    kubectl get services -n ${NAMESPACE} -l app=${APP_NAME} -o wide
}

# Main function
main() {
    local command=${1:-}

    if [ -z "$command" ]; then
        log_error "Usage: $0 [deploy-green|deploy-blue|switch-to-green|switch-to-blue|cleanup-blue|cleanup-green|status]"
        exit 1
    fi

    check_prerequisites

    case "$command" in
        deploy-green)
            deploy_green
            ;;
        deploy-blue)
            deploy_blue
            ;;
        switch-to-green)
            switch_to_green
            ;;
        switch-to-blue)
            switch_to_blue
            ;;
        cleanup-blue)
            cleanup_blue
            ;;
        cleanup-green)
            cleanup_green
            ;;
        status)
            get_status
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Available commands: deploy-green, deploy-blue, switch-to-green, switch-to-blue, cleanup-blue, cleanup-green, status"
            exit 1
            ;;
    esac

    log_success "Operation completed successfully"
}

# Execute main function
main "$@"

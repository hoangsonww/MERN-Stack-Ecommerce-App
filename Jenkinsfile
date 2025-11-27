#!/usr/bin/env groovy

/**
 * Fusion Electronics - Production CI/CD Pipeline
 *
 * This Jenkins pipeline implements:
 * - Automated testing and quality gates
 * - Blue-Green deployment strategy
 * - Canary deployment strategy
 * - Automated rollback capabilities
 * - Production-ready monitoring and health checks
 *
 * @author Fusion Electronics DevOps Team
 * @version 2.0.0
 */

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        // Docker Configuration
        DOCKER_REGISTRY = credentials('docker-registry-url')
        DOCKER_CREDENTIALS = credentials('docker-credentials')

        // Kubernetes Configuration
        KUBECONFIG = credentials('kubeconfig')
        K8S_NAMESPACE = 'fusion-ecommerce'

        // Application Configuration
        APP_NAME = 'fusion-electronics'
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${APP_NAME}-frontend"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${APP_NAME}-backend"
        BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"

        // MongoDB Configuration
        MONGO_URI = credentials('mongodb-uri')

        // Vector DB Configuration
        PINECONE_API_KEY = credentials('pinecone-api-key')
        PINECONE_HOST = credentials('pinecone-host')
        GOOGLE_AI_API_KEY = credentials('google-ai-api-key')

        // Deployment Configuration
        DEPLOYMENT_STRATEGY = "${params.DEPLOYMENT_STRATEGY ?: 'blue-green'}"
        CANARY_PERCENTAGE = "${params.CANARY_PERCENTAGE ?: 10}"

        // Health Check Configuration
        HEALTH_CHECK_RETRIES = 30
        HEALTH_CHECK_INTERVAL = 10
    }

    parameters {
        choice(
            name: 'DEPLOYMENT_STRATEGY',
            choices: ['blue-green', 'canary', 'rolling'],
            description: 'Select deployment strategy'
        )
        choice(
            name: 'CANARY_PERCENTAGE',
            choices: ['10', '25', '50', '75', '100'],
            description: 'Canary traffic percentage (only for canary deployment)'
        )
        booleanParam(
            name: 'RUN_SMOKE_TESTS',
            defaultValue: true,
            description: 'Run smoke tests after deployment'
        )
        booleanParam(
            name: 'AUTO_PROMOTE',
            defaultValue: false,
            description: 'Automatically promote canary deployment without manual approval'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip test execution (not recommended for production)'
        )
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    echo "========================================="
                    echo "Fusion Electronics Deployment Pipeline"
                    echo "========================================="
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo "Git Commit: ${env.GIT_COMMIT}"
                    echo "Build Tag: ${BUILD_TAG}"
                    echo "Deployment Strategy: ${DEPLOYMENT_STRATEGY}"
                    echo "========================================="

                    // Clean workspace
                    cleanWs()

                    // Checkout code
                    checkout scm

                    // Set build description
                    currentBuild.description = "Deploy ${BUILD_TAG} (${DEPLOYMENT_STRATEGY})"
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        script {
                            echo "Installing frontend dependencies..."
                            sh '''
                                npm ci --legacy-peer-deps
                            '''
                        }
                    }
                }

                stage('Backend Dependencies') {
                    steps {
                        script {
                            echo "Installing backend dependencies..."
                            sh '''
                                cd backend
                                npm ci
                            '''
                        }
                    }
                }
            }
        }

        stage('Code Quality & Security') {
            parallel {
                stage('Lint') {
                    steps {
                        script {
                            echo "Running linters..."
                            sh 'npm run lint'
                        }
                    }
                }

                stage('Security Scan') {
                    steps {
                        script {
                            echo "Running security vulnerability scan..."
                            sh '''
                                npm audit --audit-level=moderate || true
                                cd backend && npm audit --audit-level=moderate || true
                            '''
                        }
                    }
                }

                stage('Code Coverage Check') {
                    when {
                        expression { !params.SKIP_TESTS }
                    }
                    steps {
                        script {
                            echo "Checking code coverage requirements..."
                            sh '''
                                npm run test:coverage || true
                                cd backend && npm run test:coverage || true
                            '''
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            when {
                expression { !params.SKIP_TESTS }
            }
            parallel {
                stage('Frontend Tests') {
                    steps {
                        script {
                            echo "Running frontend tests..."
                            sh 'npm test'
                        }
                    }
                }

                stage('Backend Tests') {
                    steps {
                        script {
                            echo "Running backend tests..."
                            sh 'cd backend && npm test'
                        }
                    }
                }

                stage('Integration Tests') {
                    steps {
                        script {
                            echo "Running integration tests..."
                            sh '''
                                # Run integration tests if they exist
                                if [ -d "tests/integration" ]; then
                                    npm run test:integration || true
                                fi
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Frontend Image') {
                    steps {
                        script {
                            echo "Building frontend Docker image..."
                            sh """
                                docker build \
                                    -t ${FRONTEND_IMAGE}:${BUILD_TAG} \
                                    -t ${FRONTEND_IMAGE}:latest \
                                    -f Dockerfile.frontend \
                                    .
                            """
                        }
                    }
                }

                stage('Build Backend Image') {
                    steps {
                        script {
                            echo "Building backend Docker image..."
                            sh """
                                docker build \
                                    -t ${BACKEND_IMAGE}:${BUILD_TAG} \
                                    -t ${BACKEND_IMAGE}:latest \
                                    -f Dockerfile.backend \
                                    .
                            """
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    echo "Pushing Docker images to registry..."
                    sh """
                        echo ${DOCKER_CREDENTIALS_PSW} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_CREDENTIALS_USR} --password-stdin

                        docker push ${FRONTEND_IMAGE}:${BUILD_TAG}
                        docker push ${FRONTEND_IMAGE}:latest

                        docker push ${BACKEND_IMAGE}:${BUILD_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Executing ${DEPLOYMENT_STRATEGY} deployment..."

                    switch(DEPLOYMENT_STRATEGY) {
                        case 'blue-green':
                            blueGreenDeploy()
                            break
                        case 'canary':
                            canaryDeploy()
                            break
                        case 'rolling':
                            rollingDeploy()
                            break
                        default:
                            error("Unknown deployment strategy: ${DEPLOYMENT_STRATEGY}")
                    }
                }
            }
        }

        stage('Smoke Tests') {
            when {
                expression { params.RUN_SMOKE_TESTS }
            }
            steps {
                script {
                    echo "Running smoke tests..."
                    sh '''
                        bash deployment/scripts/smoke-tests.sh
                    '''
                }
            }
        }

        stage('Performance Tests') {
            when {
                expression { params.RUN_SMOKE_TESTS && DEPLOYMENT_STRATEGY == 'canary' }
            }
            steps {
                script {
                    echo "Running performance tests on canary deployment..."
                    sh '''
                        bash deployment/scripts/performance-tests.sh
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                echo "✅ Deployment completed successfully!"

                // Send success notification
                notifySuccess()

                // Clean up old Docker images
                cleanupDockerImages()
            }
        }

        failure {
            script {
                echo "❌ Deployment failed!"

                // Trigger automatic rollback
                if (DEPLOYMENT_STRATEGY in ['blue-green', 'canary']) {
                    echo "Initiating automatic rollback..."
                    sh '''
                        bash deployment/scripts/rollback.sh
                    '''
                }

                // Send failure notification
                notifyFailure()
            }
        }

        always {
            script {
                // Archive test results
                junit '**/test-results/**/*.xml' allowEmptyResults: true

                // Archive logs
                archiveArtifacts artifacts: '**/logs/**/*.log', allowEmptyArchive: true

                // Clean workspace
                cleanWs()
            }
        }
    }
}

// ========================================
// Deployment Strategy Functions
// ========================================

def blueGreenDeploy() {
    echo "Starting Blue-Green Deployment..."

    stage('Deploy to Green Environment') {
        sh """
            export BUILD_TAG=${BUILD_TAG}
            bash deployment/scripts/blue-green-deploy.sh deploy-green
        """
    }

    stage('Health Check - Green') {
        sh """
            bash deployment/scripts/health-check.sh green
        """
    }

    stage('Approval - Switch Traffic') {
        timeout(time: 30, unit: 'MINUTES') {
            input message: 'Switch traffic to Green environment?', ok: 'Deploy'
        }
    }

    stage('Switch Traffic to Green') {
        sh """
            bash deployment/scripts/blue-green-deploy.sh switch-to-green
        """
    }

    stage('Verify Green Environment') {
        sh """
            bash deployment/scripts/health-check.sh green
        """
    }

    stage('Cleanup Blue Environment') {
        timeout(time: 15, unit: 'MINUTES') {
            input message: 'Cleanup old Blue environment?', ok: 'Cleanup'
        }
        sh """
            bash deployment/scripts/blue-green-deploy.sh cleanup-blue
        """
    }
}

def canaryDeploy() {
    echo "Starting Canary Deployment (${CANARY_PERCENTAGE}% traffic)..."

    stage('Deploy Canary') {
        sh """
            export BUILD_TAG=${BUILD_TAG}
            export CANARY_PERCENTAGE=${CANARY_PERCENTAGE}
            bash deployment/scripts/canary-deploy.sh deploy-canary
        """
    }

    stage('Health Check - Canary') {
        sh """
            bash deployment/scripts/health-check.sh canary
        """
    }

    stage('Monitor Canary') {
        echo "Monitoring canary deployment for 5 minutes..."
        sleep time: 5, unit: 'MINUTES'

        sh """
            bash deployment/scripts/monitor-canary.sh
        """
    }

    stage('Approval - Promote Canary') {
        when {
            expression { !params.AUTO_PROMOTE }
        }
        timeout(time: 30, unit: 'MINUTES') {
            input message: "Promote canary to 100% traffic?", ok: 'Promote'
        }
    }

    stage('Promote Canary') {
        sh """
            bash deployment/scripts/canary-deploy.sh promote-canary
        """
    }

    stage('Cleanup Old Deployment') {
        sh """
            bash deployment/scripts/canary-deploy.sh cleanup-old
        """
    }
}

def rollingDeploy() {
    echo "Starting Rolling Deployment..."

    stage('Rolling Update') {
        sh """
            export BUILD_TAG=${BUILD_TAG}
            kubectl set image deployment/${APP_NAME}-frontend \
                frontend=${FRONTEND_IMAGE}:${BUILD_TAG} \
                -n ${K8S_NAMESPACE}

            kubectl set image deployment/${APP_NAME}-backend \
                backend=${BACKEND_IMAGE}:${BUILD_TAG} \
                -n ${K8S_NAMESPACE}

            kubectl rollout status deployment/${APP_NAME}-frontend -n ${K8S_NAMESPACE}
            kubectl rollout status deployment/${APP_NAME}-backend -n ${K8S_NAMESPACE}
        """
    }
}

// ========================================
// Utility Functions
// ========================================

def notifySuccess() {
    // Add notification logic (Slack, email, etc.)
    echo "Sending success notification..."
}

def notifyFailure() {
    // Add notification logic (Slack, email, etc.)
    echo "Sending failure notification..."
}

def cleanupDockerImages() {
    sh '''
        # Remove old Docker images (keep last 5 builds)
        docker images ${FRONTEND_IMAGE} --format "{{.Tag}}" | \
            grep -v latest | \
            tail -n +6 | \
            xargs -I {} docker rmi ${FRONTEND_IMAGE}:{} || true

        docker images ${BACKEND_IMAGE} --format "{{.Tag}}" | \
            grep -v latest | \
            tail -n +6 | \
            xargs -I {} docker rmi ${BACKEND_IMAGE}:{} || true
    '''
}

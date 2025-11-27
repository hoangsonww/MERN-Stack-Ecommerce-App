#!/bin/bash

################################################################################
# Canary Deployment Script for Fusion Electronics
#
# This script implements canary deployment strategy for gradual rollouts.
# It allows you to test new versions with a small percentage of traffic
# before promoting to full production.
#
# Usage:
#   ./canary-deploy.sh [deploy-canary|increase-traffic|promote-canary|rollback|cleanup-old]
#
# Environment Variables:
#   CANARY_PERCENTAGE - Percentage of traffic to route to canary (default: 10)
#   BUILD_TAG - Docker image tag for the new version
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
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${K8S_NAMESPACE:-fusion-ecommerce}"
APP_NAME="${APP_NAME:-fusion-electronics}"
BUILD_TAG="${BUILD_TAG:-latest}"
CANARY_PERCENTAGE="${CANARY_PERCENTAGE:-10}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-}:${BUILD_TAG}"
BACKEND_IMAGE="${BACKEND_IMAGE:-}:${BUILD_TAG}"

# Traffic distribution increments
TRAFFIC_INCREMENTS=(10 25 50 75 100)

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

log_canary() {
    echo -e "${MAGENTA}[CANARY]${NC} $1"
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

    # Check if Istio is installed (optional, for advanced traffic management)
    if kubectl get namespace istio-system &> /dev/null; then
        log_info "Istio detected - will use VirtualService for traffic splitting"
        export USE_ISTIO=true
    else
        log_info "Using native Kubernetes services for traffic splitting"
        export USE_ISTIO=false
    fi

    log_success "Prerequisites check passed"
}

# Get current canary traffic percentage
get_current_canary_traffic() {
    if [ "$USE_ISTIO" == "true" ]; then
        # Get from Istio VirtualService
        kubectl get virtualservice ${APP_NAME}-frontend -n ${NAMESPACE} \
            -o jsonpath='{.spec.http[0].route[?(@.destination.subset=="canary")].weight}' 2>/dev/null || echo "0"
    else
        # Calculate from replica counts
        local stable_replicas=$(kubectl get deployment ${APP_NAME}-frontend -n ${NAMESPACE} \
            -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        local canary_replicas=$(kubectl get deployment ${APP_NAME}-frontend-canary -n ${NAMESPACE} \
            -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

        if [ "$stable_replicas" -eq 0 ] && [ "$canary_replicas" -eq 0 ]; then
            echo "0"
        else
            echo $(( canary_replicas * 100 / (stable_replicas + canary_replicas) ))
        fi
    fi
}

# Deploy canary version
deploy_canary() {
    log_canary "Deploying CANARY version (${CANARY_PERCENTAGE}% traffic)..."

    # Apply canary deployment manifests
    kubectl apply -f deployment/k8s/canary/frontend-canary-deployment.yaml -n ${NAMESPACE}
    kubectl apply -f deployment/k8s/canary/backend-canary-deployment.yaml -n ${NAMESPACE}

    # Update image tags
    kubectl set image deployment/${APP_NAME}-frontend-canary \
        frontend=${FRONTEND_IMAGE} \
        -n ${NAMESPACE}

    kubectl set image deployment/${APP_NAME}-backend-canary \
        backend=${BACKEND_IMAGE} \
        -n ${NAMESPACE}

    log_info "Waiting for canary deployments to be ready..."
    kubectl rollout status deployment/${APP_NAME}-frontend-canary -n ${NAMESPACE} --timeout=10m
    kubectl rollout status deployment/${APP_NAME}-backend-canary -n ${NAMESPACE} --timeout=10m

    # Set initial traffic split
    set_traffic_split ${CANARY_PERCENTAGE}

    log_success "CANARY deployment completed with ${CANARY_PERCENTAGE}% traffic"
}

# Set traffic split between stable and canary
set_traffic_split() {
    local canary_weight=${1:-10}
    local stable_weight=$((100 - canary_weight))

    log_info "Setting traffic split: Stable ${stable_weight}% | Canary ${canary_weight}%"

    if [ "$USE_ISTIO" == "true" ]; then
        # Use Istio VirtualService for traffic splitting
        cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${APP_NAME}-frontend
  namespace: ${NAMESPACE}
spec:
  hosts:
  - ${APP_NAME}-frontend
  http:
  - match:
    - headers:
        x-version:
          exact: canary
    route:
    - destination:
        host: ${APP_NAME}-frontend-canary
        subset: canary
  - route:
    - destination:
        host: ${APP_NAME}-frontend
        subset: stable
      weight: ${stable_weight}
    - destination:
        host: ${APP_NAME}-frontend-canary
        subset: canary
      weight: ${canary_weight}
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${APP_NAME}-backend
  namespace: ${NAMESPACE}
spec:
  hosts:
  - ${APP_NAME}-backend
  http:
  - route:
    - destination:
        host: ${APP_NAME}-backend
        subset: stable
      weight: ${stable_weight}
    - destination:
        host: ${APP_NAME}-backend-canary
        subset: canary
      weight: ${canary_weight}
EOF
    else
        # Use replica count for traffic splitting (less precise)
        local total_replicas=10
        local canary_replicas=$(( total_replicas * canary_weight / 100 ))
        local stable_replicas=$(( total_replicas - canary_replicas ))

        kubectl scale deployment ${APP_NAME}-frontend --replicas=${stable_replicas} -n ${NAMESPACE}
        kubectl scale deployment ${APP_NAME}-frontend-canary --replicas=${canary_replicas} -n ${NAMESPACE}
        kubectl scale deployment ${APP_NAME}-backend --replicas=${stable_replicas} -n ${NAMESPACE}
        kubectl scale deployment ${APP_NAME}-backend-canary --replicas=${canary_replicas} -n ${NAMESPACE}
    fi

    log_success "Traffic split configured"
}

# Gradually increase canary traffic
increase_traffic() {
    local current_traffic=$(get_current_canary_traffic)
    log_info "Current canary traffic: ${current_traffic}%"

    # Find next increment
    local next_traffic=0
    for increment in "${TRAFFIC_INCREMENTS[@]}"; do
        if [ $increment -gt $current_traffic ]; then
            next_traffic=$increment
            break
        fi
    done

    if [ $next_traffic -eq 0 ]; then
        log_warning "Already at maximum traffic (100%)"
        return 0
    fi

    log_canary "Increasing canary traffic to ${next_traffic}%..."
    set_traffic_split ${next_traffic}

    log_success "Canary traffic increased to ${next_traffic}%"
    log_info "Monitor metrics and errors before further increasing traffic"
}

# Promote canary to stable (100% traffic)
promote_canary() {
    log_canary "Promoting canary to stable (100% traffic)..."

    # Set traffic to 100% canary
    set_traffic_split 100

    # Wait for traffic to settle
    log_info "Waiting for traffic to stabilize..."
    sleep 30

    # Update stable deployment with canary image
    kubectl set image deployment/${APP_NAME}-frontend \
        frontend=${FRONTEND_IMAGE} \
        -n ${NAMESPACE}

    kubectl set image deployment/${APP_NAME}-backend \
        backend=${BACKEND_IMAGE} \
        -n ${NAMESPACE}

    log_info "Waiting for stable deployments to update..."
    kubectl rollout status deployment/${APP_NAME}-frontend -n ${NAMESPACE} --timeout=10m
    kubectl rollout status deployment/${APP_NAME}-backend -n ${NAMESPACE} --timeout=10m

    # Switch traffic back to stable (which now has the new version)
    set_traffic_split 0

    log_success "Canary promoted to stable successfully"
}

# Rollback canary deployment
rollback_canary() {
    log_warning "Rolling back canary deployment..."

    # Set traffic to 0% canary
    set_traffic_split 0

    # Scale down canary deployments
    kubectl scale deployment ${APP_NAME}-frontend-canary --replicas=0 -n ${NAMESPACE}
    kubectl scale deployment ${APP_NAME}-backend-canary --replicas=0 -n ${NAMESPACE}

    log_success "Canary deployment rolled back"
}

# Cleanup old canary deployment
cleanup_old() {
    log_info "Cleaning up old canary deployment..."

    local current_traffic=$(get_current_canary_traffic)
    if [ $current_traffic -gt 0 ]; then
        log_error "Cannot cleanup canary while it's receiving traffic (${current_traffic}%)"
        exit 1
    fi

    # Delete canary deployments
    kubectl delete deployment ${APP_NAME}-frontend-canary -n ${NAMESPACE} --ignore-not-found=true
    kubectl delete deployment ${APP_NAME}-backend-canary -n ${NAMESPACE} --ignore-not-found=true

    # Cleanup VirtualServices if using Istio
    if [ "$USE_ISTIO" == "true" ]; then
        kubectl delete virtualservice ${APP_NAME}-frontend -n ${NAMESPACE} --ignore-not-found=true
        kubectl delete virtualservice ${APP_NAME}-backend -n ${NAMESPACE} --ignore-not-found=true
    fi

    log_success "Old canary deployment cleaned up"
}

# Get deployment status
get_status() {
    log_info "Canary Deployment Status:"
    echo ""

    local current_traffic=$(get_current_canary_traffic)
    log_canary "Current Canary Traffic: ${current_traffic}%"
    echo ""

    log_info "Stable Deployment:"
    kubectl get deployments -n ${NAMESPACE} -l app=${APP_NAME},version=stable -o wide || log_warning "No stable deployments found"
    echo ""

    log_info "Canary Deployment:"
    kubectl get deployments -n ${NAMESPACE} -l app=${APP_NAME},version=canary -o wide || log_warning "No canary deployments found"
    echo ""

    log_info "Services:"
    kubectl get services -n ${NAMESPACE} -l app=${APP_NAME} -o wide
    echo ""

    if [ "$USE_ISTIO" == "true" ]; then
        log_info "Istio VirtualServices:"
        kubectl get virtualservices -n ${NAMESPACE} -l app=${APP_NAME} -o wide
    fi
}

# Main function
main() {
    local command=${1:-}

    if [ -z "$command" ]; then
        log_error "Usage: $0 [deploy-canary|increase-traffic|promote-canary|rollback|cleanup-old|status]"
        exit 1
    fi

    check_prerequisites

    case "$command" in
        deploy-canary)
            deploy_canary
            ;;
        increase-traffic)
            increase_traffic
            ;;
        promote-canary)
            promote_canary
            ;;
        rollback)
            rollback_canary
            ;;
        cleanup-old)
            cleanup_old
            ;;
        status)
            get_status
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Available commands: deploy-canary, increase-traffic, promote-canary, rollback, cleanup-old, status"
            exit 1
            ;;
    esac

    log_success "Operation completed successfully"
}

# Execute main function
main "$@"

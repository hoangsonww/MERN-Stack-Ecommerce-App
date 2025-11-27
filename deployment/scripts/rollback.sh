#!/bin/bash

################################################################################
# Rollback Script for Fusion Electronics
#
# This script handles automatic rollback for failed deployments.
# Supports both blue-green and canary deployment strategies.
#
# Usage:
#   ./rollback.sh [blue-green|canary|auto]
#
# @author Fusion Electronics DevOps Team
# @version 2.0.0
################################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="${K8S_NAMESPACE:-fusion-ecommerce}"
APP_NAME="${APP_NAME:-fusion-electronics}"
ROLLBACK_TIMEOUT=300  # 5 minutes

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Detect deployment strategy
detect_deployment_strategy() {
    log_info "Detecting deployment strategy..."

    # Check for canary deployments
    if kubectl get deployment ${APP_NAME}-frontend-canary -n ${NAMESPACE} &> /dev/null; then
        echo "canary"
        return 0
    fi

    # Check for blue-green deployments
    if kubectl get deployment ${APP_NAME}-frontend-blue -n ${NAMESPACE} &> /dev/null && \
       kubectl get deployment ${APP_NAME}-frontend-green -n ${NAMESPACE} &> /dev/null; then
        echo "blue-green"
        return 0
    fi

    # Default to rolling update
    echo "rolling"
    return 0
}

# Rollback blue-green deployment
rollback_blue_green() {
    log_warning "Rolling back blue-green deployment..."

    # Determine current active environment
    local active_env=$(kubectl get service ${APP_NAME}-frontend -n ${NAMESPACE} \
        -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "")

    if [ -z "$active_env" ]; then
        log_error "Cannot determine active environment"
        return 1
    fi

    log_info "Current active environment: ${active_env}"

    # Switch to the other environment
    if [ "$active_env" == "blue" ]; then
        log_info "Switching back to GREEN environment..."
        bash deployment/scripts/blue-green-deploy.sh switch-to-green
    else
        log_info "Switching back to BLUE environment..."
        bash deployment/scripts/blue-green-deploy.sh switch-to-blue
    fi

    # Verify rollback
    sleep 5
    local new_env=$(kubectl get service ${APP_NAME}-frontend -n ${NAMESPACE} \
        -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "")

    if [ "$new_env" != "$active_env" ]; then
        log_success "Successfully rolled back from ${active_env} to ${new_env}"
        return 0
    else
        log_error "Rollback failed - still on ${active_env} environment"
        return 1
    fi
}

# Rollback canary deployment
rollback_canary() {
    log_warning "Rolling back canary deployment..."

    # Set traffic to 0% canary
    bash deployment/scripts/canary-deploy.sh rollback

    # Verify rollback
    sleep 5

    # Check if canary is scaled down
    local canary_replicas=$(kubectl get deployment ${APP_NAME}-frontend-canary -n ${NAMESPACE} \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    if [ "$canary_replicas" -eq 0 ]; then
        log_success "Successfully rolled back canary deployment"
        return 0
    else
        log_error "Canary rollback failed - canary still has ${canary_replicas} replicas"
        return 1
    fi
}

# Rollback standard rolling deployment
rollback_rolling() {
    log_warning "Rolling back standard deployment..."

    # Rollback frontend
    log_info "Rolling back frontend deployment..."
    kubectl rollout undo deployment/${APP_NAME}-frontend -n ${NAMESPACE}

    # Rollback backend
    log_info "Rolling back backend deployment..."
    kubectl rollout undo deployment/${APP_NAME}-backend -n ${NAMESPACE}

    # Wait for rollback to complete
    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/${APP_NAME}-frontend -n ${NAMESPACE} --timeout=${ROLLBACK_TIMEOUT}s
    kubectl rollout status deployment/${APP_NAME}-backend -n ${NAMESPACE} --timeout=${ROLLBACK_TIMEOUT}s

    log_success "Rolling deployment rollback completed"
    return 0
}

# Automatic rollback detection
auto_rollback() {
    local strategy=$(detect_deployment_strategy)
    log_info "Detected deployment strategy: ${strategy}"

    case "$strategy" in
        blue-green)
            rollback_blue_green
            ;;
        canary)
            rollback_canary
            ;;
        rolling)
            rollback_rolling
            ;;
        *)
            log_error "Unknown deployment strategy: $strategy"
            return 1
            ;;
    esac
}

# Get rollback history
get_rollback_history() {
    echo ""
    log_info "========================================="
    log_info "Deployment Rollback History"
    log_info "========================================="
    echo ""

    log_info "Frontend Deployment History:"
    kubectl rollout history deployment/${APP_NAME}-frontend -n ${NAMESPACE}
    echo ""

    log_info "Backend Deployment History:"
    kubectl rollout history deployment/${APP_NAME}-backend -n ${NAMESPACE}
    echo ""
}

# Verify rollback success
verify_rollback() {
    log_info "Verifying rollback success..."

    # Run health checks
    if bash deployment/scripts/health-check.sh stable; then
        log_success "Rollback verified - system is healthy"
        return 0
    else
        log_error "Rollback verification failed - system still unhealthy"
        return 1
    fi
}

# Save rollback event
log_rollback_event() {
    local strategy=$1
    local reason=${2:-"Manual rollback"}

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local log_file="deployment/logs/rollback-events.log"

    mkdir -p "$(dirname "$log_file")"

    cat >> "$log_file" <<EOF
---
Timestamp: ${timestamp}
Strategy: ${strategy}
Reason: ${reason}
Namespace: ${NAMESPACE}
Performed by: ${USER:-unknown}
Jenkins Build: ${BUILD_NUMBER:-manual}
Git Commit: ${GIT_COMMIT:-unknown}
---
EOF

    log_info "Rollback event logged to ${log_file}"
}

# Send rollback notification
send_rollback_notification() {
    local strategy=$1
    local success=$2

    # This is a placeholder for notification logic
    # Implement integration with Slack, email, PagerDuty, etc.

    if [ "$success" == "true" ]; then
        log_info "Would send success notification: Rollback of ${strategy} deployment completed successfully"
    else
        log_error "Would send failure notification: Rollback of ${strategy} deployment failed"
    fi
}

# Main function
main() {
    local command=${1:-"auto"}

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi

    echo ""
    log_warning "========================================="
    log_warning "INITIATING ROLLBACK"
    log_warning "========================================="
    echo ""

    local strategy
    local success=false

    case "$command" in
        blue-green)
            strategy="blue-green"
            if rollback_blue_green && verify_rollback; then
                success=true
            fi
            ;;
        canary)
            strategy="canary"
            if rollback_canary && verify_rollback; then
                success=true
            fi
            ;;
        rolling)
            strategy="rolling"
            if rollback_rolling && verify_rollback; then
                success=true
            fi
            ;;
        auto)
            strategy=$(detect_deployment_strategy)
            if auto_rollback && verify_rollback; then
                success=true
            fi
            ;;
        history)
            get_rollback_history
            exit 0
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Usage: $0 [blue-green|canary|rolling|auto|history]"
            exit 1
            ;;
    esac

    # Log event
    if [ "$success" == "true" ]; then
        log_rollback_event "$strategy" "Automated rollback - deployment failure detected"
        send_rollback_notification "$strategy" "true"
        echo ""
        log_success "========================================="
        log_success "ROLLBACK COMPLETED SUCCESSFULLY"
        log_success "========================================="
        echo ""
        exit 0
    else
        log_rollback_event "$strategy" "Automated rollback - FAILED"
        send_rollback_notification "$strategy" "false"
        echo ""
        log_error "========================================="
        log_error "ROLLBACK FAILED"
        log_error "========================================="
        echo ""
        log_error "Manual intervention required!"
        exit 1
    fi
}

# Execute main function
main "$@"

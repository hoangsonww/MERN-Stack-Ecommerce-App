#!/bin/bash

################################################################################
# Health Check Script for Fusion Electronics
#
# This script performs comprehensive health checks on deployed environments
# including application health, database connectivity, vector DB availability,
# and API endpoint responsiveness.
#
# Usage:
#   ./health-check.sh [blue|green|canary|stable|all]
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
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
HEALTH_CHECK_TIMEOUT=5

# Counters
PASSED_CHECKS=0
FAILED_CHECKS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Get service endpoint
get_service_endpoint() {
    local service_name=$1
    local env=${2:-""}

    if [ -n "$env" ]; then
        service_name="${APP_NAME}-${service_name}-${env}"
    else
        service_name="${APP_NAME}-${service_name}"
    fi

    # Try to get LoadBalancer IP
    local lb_ip=$(kubectl get service ${service_name} -n ${NAMESPACE} \
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [ -n "$lb_ip" ]; then
        echo "http://${lb_ip}"
        return 0
    fi

    # Try to get LoadBalancer hostname
    local lb_hostname=$(kubectl get service ${service_name} -n ${NAMESPACE} \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

    if [ -n "$lb_hostname" ]; then
        echo "http://${lb_hostname}"
        return 0
    fi

    # Fallback to ClusterIP
    local cluster_ip=$(kubectl get service ${service_name} -n ${NAMESPACE} \
        -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")

    if [ -n "$cluster_ip" ]; then
        echo "http://${cluster_ip}"
        return 0
    fi

    echo ""
    return 1
}

# Check Kubernetes pod health
check_pod_health() {
    local deployment=$1
    local env=${2:-""}

    log_info "Checking pod health for ${deployment} ${env}..."

    local deployment_name="${APP_NAME}-${deployment}"
    if [ -n "$env" ]; then
        deployment_name="${deployment_name}-${env}"
    fi

    # Check if deployment exists
    if ! kubectl get deployment ${deployment_name} -n ${NAMESPACE} &> /dev/null; then
        log_error "Deployment ${deployment_name} not found"
        return 1
    fi

    # Get desired replicas
    local desired=$(kubectl get deployment ${deployment_name} -n ${NAMESPACE} \
        -o jsonpath='{.spec.replicas}')

    # Get ready replicas
    local ready=$(kubectl get deployment ${deployment_name} -n ${NAMESPACE} \
        -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

    if [ "$ready" -eq "$desired" ] && [ "$desired" -gt 0 ]; then
        log_success "${deployment_name}: ${ready}/${desired} pods ready"
        return 0
    else
        log_error "${deployment_name}: ${ready}/${desired} pods ready"
        return 1
    fi
}

# Check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=${3:-"Endpoint"}

    log_info "Checking ${description}: ${url}"

    local status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout ${HEALTH_CHECK_TIMEOUT} \
        --max-time ${HEALTH_CHECK_TIMEOUT} \
        "${url}" 2>/dev/null || echo "000")

    if [ "$status_code" -eq "$expected_status" ]; then
        log_success "${description} returned HTTP ${status_code}"
        return 0
    else
        log_error "${description} returned HTTP ${status_code} (expected ${expected_status})"
        return 1
    fi
}

# Check API health endpoint
check_api_health() {
    local env=${1:-""}

    local backend_endpoint=$(get_service_endpoint "backend" "$env")

    if [ -z "$backend_endpoint" ]; then
        log_error "Could not get backend endpoint for env: ${env}"
        return 1
    fi

    check_http_endpoint "${backend_endpoint}/health" 200 "Backend Health ${env}"
}

# Check frontend availability
check_frontend() {
    local env=${1:-""}

    local frontend_endpoint=$(get_service_endpoint "frontend" "$env")

    if [ -z "$frontend_endpoint" ]; then
        log_error "Could not get frontend endpoint for env: ${env}"
        return 1
    fi

    check_http_endpoint "${frontend_endpoint}/" 200 "Frontend ${env}"
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."

    # Run a test query via backend health endpoint
    local backend_endpoint=$(get_service_endpoint "backend")

    if [ -z "$backend_endpoint" ]; then
        log_warning "Could not get backend endpoint"
        return 1
    fi

    local db_status=$(curl -s "${backend_endpoint}/health/db" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "error")

    if [ "$db_status" == "connected" ]; then
        log_success "Database connection healthy"
        return 0
    else
        log_error "Database connection failed: ${db_status}"
        return 1
    fi
}

# Check vector database connectivity
check_vector_db() {
    log_info "Checking vector database connectivity..."

    local backend_endpoint=$(get_service_endpoint "backend")

    if [ -z "$backend_endpoint" ]; then
        log_warning "Could not get backend endpoint"
        return 1
    fi

    local pinecone_status=$(curl -s "${backend_endpoint}/health/pinecone" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "error")

    if [ "$pinecone_status" == "connected" ]; then
        log_success "Pinecone connection healthy"
        return 0
    else
        log_warning "Pinecone connection check failed (may be optional): ${pinecone_status}"
        return 0  # Don't fail deployment if vector DB is down
    fi
}

# Check API endpoints
check_api_endpoints() {
    local env=${1:-""}

    local backend_endpoint=$(get_service_endpoint "backend" "$env")

    if [ -z "$backend_endpoint" ]; then
        log_error "Could not get backend endpoint"
        return 1
    fi

    # Test critical endpoints
    check_http_endpoint "${backend_endpoint}/api/products" 200 "Products API ${env}" || true
    check_http_endpoint "${backend_endpoint}/api/search?q=test" 200 "Search API ${env}" || true
}

# Comprehensive health check for an environment
check_environment_health() {
    local env=$1

    echo ""
    log_info "========================================="
    log_info "Health Check for ${env^^} Environment"
    log_info "========================================="
    echo ""

    # Reset counters
    PASSED_CHECKS=0
    FAILED_CHECKS=0

    # Pod health checks
    check_pod_health "frontend" "$env" || true
    check_pod_health "backend" "$env" || true

    # Application health checks
    check_frontend "$env" || true
    check_api_health "$env" || true

    # Only check DB and vector DB for primary environment
    if [ "$env" == "blue" ] || [ "$env" == "green" ] || [ "$env" == "stable" ]; then
        check_database || true
        check_vector_db || true
    fi

    # API endpoint checks
    check_api_endpoints "$env" || true

    # Summary
    echo ""
    log_info "========================================="
    log_info "Health Check Summary for ${env^^}"
    log_info "========================================="
    log_success "Passed: ${PASSED_CHECKS}"
    log_error "Failed: ${FAILED_CHECKS}"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        log_success "${env^^} environment is healthy"
        return 0
    else
        log_error "${env^^} environment has ${FAILED_CHECKS} failed checks"
        return 1
    fi
}

# Wait for environment to become healthy
wait_for_healthy() {
    local env=$1
    local max_retries=${HEALTH_CHECK_RETRIES}
    local interval=${HEALTH_CHECK_INTERVAL}

    log_info "Waiting for ${env} environment to become healthy (max ${max_retries} retries, ${interval}s interval)..."

    for i in $(seq 1 $max_retries); do
        log_info "Attempt $i/${max_retries}..."

        if check_environment_health "$env"; then
            log_success "${env} environment is healthy"
            return 0
        fi

        if [ $i -lt $max_retries ]; then
            log_info "Waiting ${interval} seconds before next check..."
            sleep $interval
        fi
    done

    log_error "${env} environment failed to become healthy after ${max_retries} attempts"
    return 1
}

# Main function
main() {
    local env=${1:-"all"}

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl not found"
        exit 1
    fi

    case "$env" in
        blue|green|canary|stable)
            wait_for_healthy "$env"
            ;;
        all)
            # Check all environments
            local exit_code=0
            check_environment_health "blue" || exit_code=1
            check_environment_health "green" || exit_code=1
            check_environment_health "canary" || exit_code=1
            exit $exit_code
            ;;
        *)
            log_error "Unknown environment: $env"
            log_info "Usage: $0 [blue|green|canary|stable|all]"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"

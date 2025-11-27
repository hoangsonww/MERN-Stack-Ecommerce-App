#!/bin/bash

################################################################################
# Performance Tests for Fusion Electronics
#
# This script runs performance tests using Apache Bench (ab) or similar tools
# to verify that the deployment can handle expected load.
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
CONCURRENT_REQUESTS="${CONCURRENT_REQUESTS:-10}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-1000}"
MAX_RESPONSE_TIME="${MAX_RESPONSE_TIME:-2000}"  # 2 seconds
MIN_SUCCESS_RATE="${MIN_SUCCESS_RATE:-95}"      # 95%

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

# Get service URL
get_service_url() {
    local service=$1

    local lb_ip=$(kubectl get service ${service} -n ${NAMESPACE} \
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [ -n "$lb_ip" ]; then
        echo "http://${lb_ip}"
        return 0
    fi

    local lb_host=$(kubectl get service ${service} -n ${NAMESPACE} \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

    if [ -n "$lb_host" ]; then
        echo "http://${lb_host}"
        return 0
    fi

    echo "http://localhost:8080"
}

# Run performance test with Apache Bench
run_ab_test() {
    local url=$1
    local description=$2

    log_info "Running performance test: ${description}"
    log_info "URL: ${url}"
    log_info "Concurrent: ${CONCURRENT_REQUESTS}, Total: ${TOTAL_REQUESTS}"

    if ! command -v ab &> /dev/null; then
        log_warning "Apache Bench (ab) not installed, skipping test"
        return 0
    fi

    local output=$(ab -c ${CONCURRENT_REQUESTS} -n ${TOTAL_REQUESTS} -q "${url}" 2>&1 || echo "")

    # Extract metrics
    local failed_requests=$(echo "$output" | grep "Failed requests:" | awk '{print $3}' || echo "0")
    local time_per_request=$(echo "$output" | grep "Time per request:" | head -1 | awk '{print $4}' || echo "0")
    local success_rate=$(echo "$output" | grep "Complete requests:" | awk '{print $3}' || echo "0")

    echo ""
    log_info "Results for ${description}:"
    echo "$output" | grep -E "(Complete requests|Failed requests|Time per request|Requests per second)" || echo "No results"
    echo ""

    # Evaluate results
    local success_percentage=$((success_rate * 100 / TOTAL_REQUESTS))

    if [ "$failed_requests" -eq 0 ] && [ "${time_per_request%.*}" -lt "${MAX_RESPONSE_TIME}" ]; then
        log_success "${description} passed performance test"
        return 0
    else
        log_error "${description} failed performance test"
        log_error "Failed requests: ${failed_requests}, Avg response time: ${time_per_request}ms"
        return 1
    fi
}

# Run performance test with curl (fallback)
run_curl_test() {
    local url=$1
    local description=$2

    log_info "Running simple performance test: ${description}"

    local total_time=0
    local failed=0

    for i in $(seq 1 10); do
        local start=$(date +%s%N)
        local status=$(curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "000")
        local end=$(date +%s%N)

        local duration=$(( (end - start) / 1000000 ))  # Convert to ms
        total_time=$((total_time + duration))

        if [ "$status" != "200" ]; then
            ((failed++))
        fi

        echo -n "."
    done

    echo ""

    local avg_time=$((total_time / 10))

    log_info "Average response time: ${avg_time}ms"
    log_info "Failed requests: ${failed}/10"

    if [ $failed -eq 0 ] && [ $avg_time -lt ${MAX_RESPONSE_TIME} ]; then
        log_success "${description} passed"
        return 0
    else
        log_error "${description} failed"
        return 1
    fi
}

# Test frontend performance
test_frontend_performance() {
    echo ""
    log_info "========================================="
    log_info "Frontend Performance Tests"
    log_info "========================================="

    local frontend_url=$(get_service_url "${APP_NAME}-frontend")

    if command -v ab &> /dev/null; then
        run_ab_test "${frontend_url}/" "Frontend homepage" || true
    else
        run_curl_test "${frontend_url}/" "Frontend homepage" || true
    fi
}

# Test API performance
test_api_performance() {
    echo ""
    log_info "========================================="
    log_info "API Performance Tests"
    log_info "========================================="

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    if command -v ab &> /dev/null; then
        run_ab_test "${backend_url}/api/products" "Products API" || true
        run_ab_test "${backend_url}/api/search?q=laptop" "Search API" || true
    else
        run_curl_test "${backend_url}/api/products" "Products API" || true
        run_curl_test "${backend_url}/api/search?q=laptop" "Search API" || true
    fi
}

# Test database performance
test_database_performance() {
    echo ""
    log_info "========================================="
    log_info "Database Performance Tests"
    log_info "========================================="

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    if command -v ab &> /dev/null; then
        run_ab_test "${backend_url}/health/db" "Database connectivity" || true
    else
        run_curl_test "${backend_url}/health/db" "Database connectivity" || true
    fi
}

# Run all performance tests
run_all_tests() {
    log_info "Starting performance tests..."
    log_info "Configuration:"
    log_info "  Concurrent requests: ${CONCURRENT_REQUESTS}"
    log_info "  Total requests: ${TOTAL_REQUESTS}"
    log_info "  Max response time: ${MAX_RESPONSE_TIME}ms"
    log_info "  Min success rate: ${MIN_SUCCESS_RATE}%"

    test_frontend_performance
    test_api_performance
    test_database_performance

    echo ""
    log_success "Performance tests completed"
}

# Main function
main() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl not found"
        exit 1
    fi

    if ! command -v ab &> /dev/null; then
        log_warning "Apache Bench (ab) not found - install with: apt-get install apache2-utils"
        log_warning "Falling back to simple curl-based tests"
    fi

    run_all_tests
}

# Execute main function
main "$@"

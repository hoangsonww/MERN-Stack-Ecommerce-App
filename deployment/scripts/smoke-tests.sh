#!/bin/bash

################################################################################
# Smoke Tests for Fusion Electronics
#
# This script runs smoke tests to verify basic functionality after deployment.
# Tests include:
# - Frontend accessibility
# - Backend API endpoints
# - Database connectivity
# - Vector DB connectivity
# - Core user workflows
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
TEST_TIMEOUT=30

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
    ((TESTS_RUN++))
}

# Get service URL
get_service_url() {
    local service=$1

    # Try LoadBalancer IP
    local lb_ip=$(kubectl get service ${service} -n ${NAMESPACE} \
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

    if [ -n "$lb_ip" ]; then
        echo "http://${lb_ip}"
        return 0
    fi

    # Try LoadBalancer hostname
    local lb_host=$(kubectl get service ${APP_NAME}-${service} -n ${NAMESPACE} \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

    if [ -n "$lb_host" ]; then
        echo "http://${lb_host}"
        return 0
    fi

    # Fallback to port-forward
    echo "http://localhost:8080"
}

# Test HTTP endpoint
test_http() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    log_test "${description}"

    local status=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout ${TEST_TIMEOUT} \
        --max-time ${TEST_TIMEOUT} \
        "${url}" 2>/dev/null || echo "000")

    if [ "$status" -eq "$expected_status" ]; then
        log_success "${description} (HTTP ${status})"
        return 0
    else
        log_error "${description} (HTTP ${status}, expected ${expected_status})"
        return 1
    fi
}

# Test JSON API endpoint
test_json_api() {
    local url=$1
    local expected_field=$2
    local description=$3

    log_test "${description}"

    local response=$(curl -s \
        --connect-timeout ${TEST_TIMEOUT} \
        --max-time ${TEST_TIMEOUT} \
        "${url}" 2>/dev/null || echo "{}")

    if echo "$response" | grep -q "\"${expected_field}\""; then
        log_success "${description}"
        return 0
    else
        log_error "${description} (field '${expected_field}' not found in response)"
        return 1
    fi
}

# Test frontend
test_frontend() {
    echo ""
    log_info "Testing Frontend..."

    local frontend_url=$(get_service_url "${APP_NAME}-frontend")

    test_http "${frontend_url}/" 200 "Frontend homepage" || true
    test_http "${frontend_url}/shop" 200 "Shop page" || true
    test_http "${frontend_url}/cart" 200 "Cart page" || true
}

# Test backend API
test_backend_api() {
    echo ""
    log_info "Testing Backend API..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    # Health endpoints
    test_http "${backend_url}/health" 200 "Backend health endpoint" || true

    # Products API
    test_json_api "${backend_url}/api/products" "name" "Get all products" || true

    # Search API
    test_json_api "${backend_url}/api/search?q=laptop" "name" "Search products" || true
}

# Test database connectivity
test_database() {
    echo ""
    log_info "Testing Database Connectivity..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    test_http "${backend_url}/health/db" 200 "MongoDB connection" || true
}

# Test vector database
test_vector_db() {
    echo ""
    log_info "Testing Vector Database..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    # Pinecone health check
    test_http "${backend_url}/health/pinecone" 200 "Pinecone connection" || true
}

# Test product workflow
test_product_workflow() {
    echo ""
    log_info "Testing Product Workflow..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    # Get a product
    log_test "Get single product"
    local products=$(curl -s "${backend_url}/api/products" 2>/dev/null || echo "[]")
    local product_id=$(echo "$products" | grep -oP '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

    if [ -n "$product_id" ]; then
        test_json_api "${backend_url}/api/products/${product_id}" "name" "Get product by ID" || true

        # Get similar products
        test_json_api "${backend_url}/api/products/${product_id}/similar" "name" "Get similar products" || true
    else
        log_error "No products found in database"
    fi
}

# Test authentication workflow
test_auth_workflow() {
    echo ""
    log_info "Testing Authentication Workflow..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    # Test registration endpoint (without actually registering)
    test_http "${backend_url}/api/auth/register" 400 "Auth register endpoint (expects 400 for empty body)" || true

    # Test login endpoint (without actually logging in)
    test_http "${backend_url}/api/auth/login" 400 "Auth login endpoint (expects 400 for empty body)" || true
}

# Test checkout workflow
test_checkout_workflow() {
    echo ""
    log_info "Testing Checkout Workflow..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    # Test checkout endpoint (expects 400 for invalid data)
    test_http "${backend_url}/api/checkout/create-order" 400 "Checkout endpoint (expects 400 for empty body)" || true
}

# Test error handling
test_error_handling() {
    echo ""
    log_info "Testing Error Handling..."

    local backend_url=$(get_service_url "${APP_NAME}-backend")

    # Test 404 handling
    test_http "${backend_url}/api/products/invalidid123" 404 "404 error handling" || true
}

# Run all smoke tests
run_all_tests() {
    echo ""
    log_info "========================================="
    log_info "Running Smoke Tests"
    log_info "========================================="

    test_frontend
    test_backend_api
    test_database
    test_vector_db
    test_product_workflow
    test_auth_workflow
    test_checkout_workflow
    test_error_handling

    echo ""
    log_info "========================================="
    log_info "Smoke Test Results"
    log_info "========================================="
    echo "Total Tests: ${TESTS_RUN}"
    echo "Passed: ${TESTS_PASSED}"
    echo "Failed: ${TESTS_FAILED}"
    echo ""

    local pass_rate=0
    if [ ${TESTS_RUN} -gt 0 ]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    fi

    if [ ${TESTS_FAILED} -eq 0 ]; then
        log_success "All smoke tests passed! (100%)"
        return 0
    elif [ $pass_rate -ge 80 ]; then
        log_success "Smoke tests mostly passed (${pass_rate}%)"
        log_error "Some tests failed, but deployment may proceed"
        return 0
    else
        log_error "Too many smoke tests failed (${pass_rate}% pass rate)"
        log_error "Deployment should be rolled back"
        return 1
    fi
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

    run_all_tests
}

# Execute main function
main "$@"

#!/bin/bash

################################################################################
# Canary Monitoring Script for Fusion Electronics
#
# This script monitors canary deployments and compares metrics between
# canary and stable versions to detect issues early.
#
# Metrics monitored:
# - Error rate
# - Response time (p50, p95, p99)
# - Request rate
# - Pod resource usage
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
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
NAMESPACE="${K8S_NAMESPACE:-fusion-ecommerce}"
APP_NAME="${APP_NAME:-fusion-electronics}"
MONITORING_DURATION="${MONITORING_DURATION:-300}"  # 5 minutes default
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5}"  # 5% error rate threshold
LATENCY_THRESHOLD="${LATENCY_THRESHOLD:-2000}"     # 2000ms latency threshold

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

log_metric() {
    echo -e "${MAGENTA}[METRIC]${NC} $1"
}

# Get pod metrics
get_pod_metrics() {
    local version=$1  # stable or canary

    log_info "Collecting metrics for ${version} pods..."

    # Get CPU and memory usage
    kubectl top pods -n ${NAMESPACE} -l app=${APP_NAME},version=${version} --no-headers 2>/dev/null || echo ""
}

# Get error rate from logs
get_error_rate() {
    local version=$1
    local duration=${2:-60}  # Last N seconds

    log_info "Calculating error rate for ${version} (last ${duration}s)..."

    # Get pod names
    local pods=$(kubectl get pods -n ${NAMESPACE} -l app=${APP_NAME}-backend,version=${version} \
        -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$pods" ]; then
        echo "0"
        return 0
    fi

    local total_requests=0
    local error_requests=0

    for pod in $pods; do
        # Count total requests (any HTTP log line)
        local pod_total=$(kubectl logs ${pod} -n ${NAMESPACE} --since=${duration}s 2>/dev/null | \
            grep -c "HTTP" || echo "0")

        # Count error requests (5xx status codes)
        local pod_errors=$(kubectl logs ${pod} -n ${NAMESPACE} --since=${duration}s 2>/dev/null | \
            grep "HTTP" | grep -c " 5[0-9][0-9] " || echo "0")

        total_requests=$((total_requests + pod_total))
        error_requests=$((error_requests + pod_errors))
    done

    if [ $total_requests -eq 0 ]; then
        echo "0"
    else
        echo $(( error_requests * 100 / total_requests ))
    fi
}

# Get average response time
get_avg_response_time() {
    local version=$1
    local duration=${2:-60}

    log_info "Calculating average response time for ${version}..."

    local pods=$(kubectl get pods -n ${NAMESPACE} -l app=${APP_NAME}-backend,version=${version} \
        -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$pods" ]; then
        echo "0"
        return 0
    fi

    # This is a simplified example - in production, use proper APM tools
    # Extract response times from logs if they're logged
    local total_time=0
    local count=0

    for pod in $pods; do
        # Example: looking for log pattern like "response_time: 123ms"
        while IFS= read -r time; do
            total_time=$((total_time + time))
            count=$((count + 1))
        done < <(kubectl logs ${pod} -n ${NAMESPACE} --since=${duration}s 2>/dev/null | \
            grep -oP 'response_time: \K\d+' || echo "")
    done

    if [ $count -eq 0 ]; then
        echo "0"
    else
        echo $(( total_time / count ))
    fi
}

# Get request rate (requests per second)
get_request_rate() {
    local version=$1
    local duration=${2:-60}

    log_info "Calculating request rate for ${version}..."

    local pods=$(kubectl get pods -n ${NAMESPACE} -l app=${APP_NAME}-backend,version=${version} \
        -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$pods" ]; then
        echo "0"
        return 0
    fi

    local total_requests=0

    for pod in $pods; do
        local pod_requests=$(kubectl logs ${pod} -n ${NAMESPACE} --since=${duration}s 2>/dev/null | \
            grep -c "HTTP" || echo "0")
        total_requests=$((total_requests + pod_requests))
    done

    echo $(( total_requests / duration ))
}

# Compare canary vs stable metrics
compare_metrics() {
    echo ""
    log_info "========================================="
    log_info "Canary vs Stable Metrics Comparison"
    log_info "========================================="
    echo ""

    # Error rates
    local stable_errors=$(get_error_rate "stable")
    local canary_errors=$(get_error_rate "canary")

    log_metric "Error Rate:"
    echo "  Stable:  ${stable_errors}%"
    echo "  Canary:  ${canary_errors}%"

    if [ $canary_errors -gt $ERROR_RATE_THRESHOLD ]; then
        log_error "Canary error rate (${canary_errors}%) exceeds threshold (${ERROR_RATE_THRESHOLD}%)"
        return 1
    fi

    if [ $canary_errors -gt $((stable_errors * 2)) ] && [ $canary_errors -gt 1 ]; then
        log_error "Canary error rate is significantly higher than stable"
        return 1
    fi

    log_success "Error rate within acceptable range"
    echo ""

    # Response times
    local stable_latency=$(get_avg_response_time "stable")
    local canary_latency=$(get_avg_response_time "canary")

    log_metric "Average Response Time:"
    echo "  Stable:  ${stable_latency}ms"
    echo "  Canary:  ${canary_latency}ms"

    if [ $canary_latency -gt $LATENCY_THRESHOLD ]; then
        log_error "Canary latency (${canary_latency}ms) exceeds threshold (${LATENCY_THRESHOLD}ms)"
        return 1
    fi

    if [ $stable_latency -gt 0 ] && [ $canary_latency -gt $((stable_latency * 2)) ]; then
        log_error "Canary latency is significantly higher than stable"
        return 1
    fi

    log_success "Response time within acceptable range"
    echo ""

    # Request rates
    local stable_rate=$(get_request_rate "stable")
    local canary_rate=$(get_request_rate "canary")

    log_metric "Request Rate (req/s):"
    echo "  Stable:  ${stable_rate}"
    echo "  Canary:  ${canary_rate}"
    echo ""

    # Pod resource usage
    log_metric "Pod Resource Usage:"
    echo ""
    echo "Stable Pods:"
    get_pod_metrics "stable"
    echo ""
    echo "Canary Pods:"
    get_pod_metrics "canary"
    echo ""

    return 0
}

# Monitor canary continuously
monitor_canary() {
    local duration=${MONITORING_DURATION}
    local interval=60  # Check every minute
    local iterations=$((duration / interval))

    log_info "Starting canary monitoring for ${duration} seconds..."
    echo ""

    for i in $(seq 1 $iterations); do
        log_info "Monitoring iteration $i/${iterations}..."

        if ! compare_metrics; then
            log_error "Canary monitoring detected issues - recommend rollback"
            return 1
        fi

        if [ $i -lt $iterations ]; then
            log_info "Waiting ${interval} seconds before next check..."
            sleep $interval
        fi
    done

    log_success "Canary monitoring completed successfully"
    log_success "No issues detected - safe to promote canary"
    return 0
}

# Get canary status
get_canary_status() {
    echo ""
    log_info "========================================="
    log_info "Current Canary Status"
    log_info "========================================="
    echo ""

    # Get deployments
    log_info "Deployments:"
    kubectl get deployments -n ${NAMESPACE} -l app=${APP_NAME} -o wide
    echo ""

    # Get pods
    log_info "Pods:"
    kubectl get pods -n ${NAMESPACE} -l app=${APP_NAME} -o wide
    echo ""

    # Get services
    log_info "Services:"
    kubectl get services -n ${NAMESPACE} -l app=${APP_NAME} -o wide
    echo ""

    # Get current metrics
    compare_metrics
}

# Main function
main() {
    local command=${1:-"monitor"}

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi

    case "$command" in
        monitor)
            monitor_canary
            ;;
        status)
            get_canary_status
            ;;
        compare)
            compare_metrics
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Usage: $0 [monitor|status|compare]"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"

#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if kubectl can connect to cluster
check_kubectl_connection() {
    if ! kubectl cluster-info >/dev/null 2>&1; then
        print_error "Cannot connect to Kubernetes cluster"
        print_error "Please ensure kubectl is configured correctly"
        exit 1
    fi
}

# Function to check if resources already exist
check_existing_resources() {
    local resources_exist=false
    
    # Check for existing namespaces
    if kubectl get namespace agent-stream >/dev/null 2>&1; then
        print_warning "agent-stream namespace already exists"
        resources_exist=true
    fi
    
    if kubectl get namespace function-stream >/dev/null 2>&1; then
        print_warning "function-stream namespace already exists"
        resources_exist=true
    fi
    
    # Check for existing CRDs
    if kubectl get crd agents.as.agentstream.github.io >/dev/null 2>&1; then
        print_warning "Agent CRD already exists"
        resources_exist=true
    fi
    
    if kubectl get crd functions.fs.functionstream.github.io >/dev/null 2>&1; then
        print_warning "Function CRD already exists"
        resources_exist=true
    fi
    
    if kubectl get crd packages.fs.functionstream.github.io >/dev/null 2>&1; then
        print_warning "Package CRD already exists"
        resources_exist=true
    fi
    
    if [ "$resources_exist" = true ]; then
        print_warning "Some AgentStream/FunctionStream resources already exist"
        print_warning "This may cause conflicts during installation"
        echo
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Installation cancelled by user"
            exit 0
        fi
        echo
    fi
}

# Function to install cert-manager
install_cert_manager() {
    print_status "Installing cert-manager..."
    
    # Check if cert-manager is already installed
    if kubectl get namespace cert-manager >/dev/null 2>&1; then
        print_warning "cert-manager namespace already exists"
        read -p "Do you want to reinstall cert-manager? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping cert-manager installation"
            return 0
        fi
        echo
        print_status "Removing existing cert-manager..."
        kubectl delete namespace cert-manager --ignore-not-found=true || true
        sleep 10
    fi
    
    # Install cert-manager
    if kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml; then
        print_success "cert-manager YAML applied successfully"
    else
        print_error "Failed to apply cert-manager YAML"
        return 1
    fi
    
    # Wait for cert-manager namespace to be created
    print_status "Waiting for cert-manager namespace to be created..."
    if kubectl wait --for=jsonpath='{.status.phase}=Active' namespace/cert-manager --timeout=60s; then
        print_success "cert-manager namespace is active"
    else
        print_error "Timeout waiting for cert-manager namespace"
        return 1
    fi
    
    # Wait for cert-manager pods to be ready
    print_status "Waiting for cert-manager pods to be ready..."
    local wait_time=0
    local max_wait=300
    
    while [ $wait_time -lt $max_wait ]; do
        if kubectl wait --for=jsonpath='{.status.phase}=Running' pods -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=30s >/dev/null 2>&1; then
            print_success "cert-manager pods are running"
            return 0
        fi
        sleep 10
        wait_time=$((wait_time + 10))
        echo -n "."
    done
    
    print_error "Timeout waiting for cert-manager pods to be ready"
    return 1
}

# Function to apply resources and wait for readiness
apply_and_wait() {
    local file="$1"
    local description="$2"
    local label_selector="$3"
    local namespace="$4"
    
    print_status "Installing $description..."
    
    if [ ! -f "$file" ]; then
        print_error "$description YAML file not found: $file"
        return 1
    fi
    
    # Apply the YAML file
    if kubectl apply -f "$file"; then
        print_success "$description YAML applied successfully"
    else
        print_error "Failed to apply $description YAML"
        return 1
    fi
    
    # Wait for pods to be ready
    if [ -n "$label_selector" ] && [ -n "$namespace" ]; then
        print_status "Waiting for $description to be ready..."
        local wait_time=0
        local max_wait=300
        
        while [ $wait_time -lt $max_wait ]; do
            if kubectl wait --for=jsonpath='{.status.phase}=Running' pods -l "$label_selector" -n "$namespace" --timeout=30s >/dev/null 2>&1; then
                print_success "$description is ready"
                return 0
            fi
            sleep 10
            wait_time=$((wait_time + 10))
            echo -n "."
        done
        
        print_warning "Timeout waiting for $description to be ready"
        print_warning "You may need to check the pod status manually"
        return 1
    fi
    
    return 0
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    local all_ready=true
    
    # Check namespaces
    if kubectl get namespace agent-stream >/dev/null 2>&1; then
        print_success "agent-stream namespace exists"
    else
        print_error "agent-stream namespace not found"
        all_ready=false
    fi
    
    if kubectl get namespace function-stream >/dev/null 2>&1; then
        print_success "function-stream namespace exists"
    else
        print_error "function-stream namespace not found"
        all_ready=false
    fi
    
    # Check CRDs
    if kubectl get crd agents.as.agentstream.github.io >/dev/null 2>&1; then
        print_success "Agent CRD exists"
    else
        print_error "Agent CRD not found"
        all_ready=false
    fi
    
    if kubectl get crd functions.fs.functionstream.github.io >/dev/null 2>&1; then
        print_success "Function CRD exists"
    else
        print_error "Function CRD not found"
        all_ready=false
    fi
    
    if kubectl get crd packages.fs.functionstream.github.io >/dev/null 2>&1; then
        print_success "Package CRD exists"
    else
        print_error "Package CRD not found"
        all_ready=false
    fi
    
    # Check pod status
    print_status "Checking pod status..."
    
    # Check FunctionStream pods
    if kubectl get pods -n function-stream -l app.kubernetes.io/instance=functionstream >/dev/null 2>&1; then
        local fs_pods=$(kubectl get pods -n function-stream -l app.kubernetes.io/instance=functionstream --no-headers | wc -l)
        local fs_ready=$(kubectl get pods -n function-stream -l app.kubernetes.io/instance=functionstream --no-headers | grep -c "Running")
        if [ "$fs_pods" -gt 0 ] && [ "$fs_ready" -eq "$fs_pods" ]; then
            print_success "FunctionStream pods are running ($fs_ready/$fs_pods)"
        else
            print_warning "FunctionStream pods not all ready ($fs_ready/$fs_pods)"
            all_ready=false
        fi
    else
        print_warning "No FunctionStream pods found"
        all_ready=false
    fi
    
    # Check AgentStream pods
    if kubectl get pods -n agent-stream -l app.kubernetes.io/instance=agentstream >/dev/null 2>&1; then
        local as_pods=$(kubectl get pods -n agent-stream -l app.kubernetes.io/instance=agentstream --no-headers | wc -l)
        local as_ready=$(kubectl get pods -n agent-stream -l app.kubernetes.io/instance=agentstream --no-headers | grep -c "Running")
        if [ "$as_pods" -gt 0 ] && [ "$as_ready" -eq "$as_pods" ]; then
            print_success "AgentStream pods are running ($as_ready/$as_pods)"
        else
            print_warning "AgentStream pods not all ready ($as_ready/$as_pods)"
            all_ready=false
        fi
    else
        print_warning "No AgentStream pods found"
        all_ready=false
    fi
    
    if [ "$all_ready" = true ]; then
        print_success "Installation verification completed successfully!"
        return 0
    else
        print_warning "Installation verification completed with warnings."
        print_warning "Some components may not be fully ready."
        return 1
    fi
}

# Function to display post-installation information
show_post_install_info() {
    echo
    print_success "AgentStream and FunctionStream installation completed!"
    echo
    print_status "Post-installation information:"
    echo "  - AgentStream namespace: agent-stream"
    echo "  - FunctionStream namespace: function-stream"
    echo "  - cert-manager namespace: cert-manager"
    echo
    print_status "Useful commands:"
    echo "  - Check pod status: kubectl get pods -n agent-stream"
    echo "  - Check pod status: kubectl get pods -n function-stream"
    echo "  - View logs: kubectl logs -n agent-stream -l app.kubernetes.io/instance=agentstream"
    echo "  - View logs: kubectl logs -n function-stream -l app.kubernetes.io/instance=functionstream"
    echo "  - Uninstall: ./scripts/uninstall.sh"
    echo
}

# Function to check webhook status
check_webhook_status() {
    print_status "Checking webhook status..."

    # 1. Check service exists
    if kubectl get service operator-webhook-service -n function-stream >/dev/null 2>&1; then
        print_success "Webhook service exists"
    else
        print_error "Webhook service not found"
        return 1
    fi

    # 2. Check endpoints has IP
    endpoints=$(kubectl get endpoints operator-webhook-service -n function-stream -o jsonpath='{.subsets[*].addresses[*].ip}')
    if [ -n "$endpoints" ]; then
        print_success "Webhook service has endpoints: $endpoints"
    else
        print_error "Webhook service has no endpoints"
        return 1
    fi

    # 3. Check pods running
    pods=$(kubectl get pods -n function-stream -l app.kubernetes.io/name=operator --no-headers 2>/dev/null | wc -l)
    running=$(kubectl get pods -n function-stream -l app.kubernetes.io/name=operator --no-headers 2>/dev/null | grep -c "Running")
    if [ "$pods" -gt 0 ] && [ "$running" -eq "$pods" ]; then
        print_success "All webhook pods are running ($running/$pods)"
    else
        print_error "Not all webhook pods are running ($running/$pods)"
        return 1
    fi

    print_success "Webhook basic checks passed"
    return 0
}

# Function to wait for webhook to be ready
wait_for_webhook_ready() {
    print_status "Waiting for webhook to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Attempt $attempt/$max_attempts: Checking webhook status..."
        if check_webhook_status; then
            print_success "Webhook is ready"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: Webhook not ready yet, waiting..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Webhook failed to become ready after $max_attempts attempts"
    return 1
}

# Function to show webhook troubleshooting information
show_webhook_troubleshooting() {
    echo
    print_warning "Webhook troubleshooting information:"
    echo
    print_status "Check webhook service:"
    echo "  kubectl get service operator-webhook-service -n function-stream"
    echo "  kubectl describe service operator-webhook-service -n function-stream"
    echo
    print_status "Check webhook pods:"
    echo "  kubectl get pods -n function-stream -l app.kubernetes.io/name=operator"
    echo "  kubectl logs -n function-stream -l app.kubernetes.io/name=operator"
    echo
    print_status "Check webhook configurations:"
    echo "  kubectl get validatingwebhookconfiguration"
    echo "  kubectl describe validatingwebhookconfiguration mpackage-v1alpha1.kb.io"
    echo
    print_status "Check network connectivity:"
    echo "  kubectl run test-pod --image=busybox --rm -i --restart=Never -- nslookup operator-webhook-service.function-stream.svc"
    echo "  kubectl run test-pod --image=busybox --rm -i --restart=Never -- wget -qO- https://operator-webhook-service.function-stream.svc:443/healthz"
    echo
    print_status "Check webhook admission logs:"
    echo "  kubectl logs -n function-stream -l app.kubernetes.io/name=operator | grep webhook"
    echo
}

# Main script
main() {
    echo "AgentStream - Installation Script"
    echo "=========================================================="
    echo
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists kubectl; then
        print_error "kubectl is not installed or not in PATH"
        print_error "Please install kubectl first: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    
    check_kubectl_connection
    print_success "Prerequisites check passed"
    echo
    
    # Check for existing resources
    check_existing_resources
    
    # User confirmation
    print_warning "This script will install AgentStream and FunctionStream to your Kubernetes cluster."
    print_warning "This will create:"
    echo "  - Namespaces: agent-stream, function-stream, cert-manager"
    echo "  - Custom Resource Definitions (CRDs)"
    echo "  - RBAC resources"
    echo "  - cert-manager for certificate management"
    echo
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Installation cancelled by user"
        exit 0
    fi
    echo
    
    # Start installation
    print_status "Starting installation process..."
    echo
    
    # Install cert-manager
    if ! install_cert_manager; then
        print_error "cert-manager installation failed"
        exit 1
    fi
    echo
    
    # Install FunctionStream
    if ! apply_and_wait "$SCRIPT_DIR/fs.yaml" "FunctionStream" "app.kubernetes.io/instance=functionstream" "function-stream"; then
        print_error "FunctionStream installation failed"
        exit 1
    fi
    echo
    
    # Check webhook status before installing AgentStream
    print_status "Checking webhook status before installing AgentStream..."
    if ! wait_for_webhook_ready; then
        print_error "Webhook is not ready. AgentStream installation may fail."
        show_webhook_troubleshooting
        echo
        read -p "Do you want to continue with AgentStream installation anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "AgentStream installation cancelled by user"
            print_status "Please fix webhook issues and run the script again"
            exit 1
        fi
        echo
    fi
    
    # Install AgentStream
    if ! apply_and_wait "$SCRIPT_DIR/deploy.yaml" "AgentStream" "app.kubernetes.io/instance=agentstream" "agent-stream"; then
        print_error "AgentStream installation failed"
        print_error "This may be due to webhook issues. Please check the troubleshooting information below:"
        show_webhook_troubleshooting
        exit 1
    fi
    echo
    
    # Verify installation
    if ! verify_installation; then
        print_warning "Installation completed with warnings"
        print_warning "Please check the pod status manually"
    fi
    
    # Show post-installation information
    show_post_install_info
}

# Handle script interruption
trap 'print_error "Script interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"

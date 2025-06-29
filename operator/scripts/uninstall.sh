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

# Function to check if resources exist before deletion
check_resources_exist() {
    local file="$1"
    local resources=()
    
    # Extract resource types and names from the YAML file
    while IFS= read -r line; do
        if [[ $line =~ ^kind:[[:space:]]*(.+)$ ]]; then
            kind="${BASH_REMATCH[1]}"
        elif [[ $line =~ ^[[:space:]]*name:[[:space:]]*(.+)$ ]]; then
            name="${BASH_REMATCH[1]}"
            if [[ -n "$kind" && -n "$name" ]]; then
                resources+=("$kind/$name")
                kind=""
                name=""
            fi
        fi
    done < "$file"
    
    # Check if any resources exist
    for resource in "${resources[@]}"; do
        if kubectl get "$resource" >/dev/null 2>&1; then
            return 0
        fi
    done
    return 1
}

# Function to delete resources with progress
delete_resources() {
    local file="$1"
    local description="$2"
    
    print_status "Deleting $description..."
    
    if ! check_resources_exist "$file"; then
        print_warning "$description resources not found, skipping..."
        return 0
    fi
    
    if kubectl delete -f "$file" --ignore-not-found=true --grace-period=30; then
        print_success "$description deleted successfully"
    else
        print_error "Failed to delete $description"
        return 1
    fi
}

# Function to wait for resources to be fully deleted
wait_for_deletion() {
    local file="$1"
    local description="$2"
    local max_wait=120
    local wait_time=0
    
    print_status "Waiting for $description to be fully deleted..."
    
    while check_resources_exist "$file" && [ $wait_time -lt $max_wait ]; do
        sleep 5
        wait_time=$((wait_time + 5))
        echo -n "."
    done
    echo
    
    if [ $wait_time -ge $max_wait ]; then
        print_warning "Timeout waiting for $description to be deleted"
        return 1
    else
        print_success "$description fully deleted"
        return 0
    fi
}

# Function to cleanup any remaining resources
cleanup_remaining_resources() {
    print_status "Cleaning up any remaining resources..."
    
    # Delete any remaining resources in the namespaces
    local namespaces=("agent-stream" "function-stream")
    
    for ns in "${namespaces[@]}"; do
        if kubectl get namespace "$ns" >/dev/null 2>&1; then
            print_status "Cleaning up namespace: $ns"
            
            # Delete all resources in the namespace
            kubectl delete all --all -n "$ns" --ignore-not-found=true || true
            
            # Delete any remaining CRDs
            kubectl delete crd agents.as.agentstream.github.io --ignore-not-found=true || true
            kubectl delete crd functions.fs.functionstream.github.io --ignore-not-found=true || true
            kubectl delete crd packages.fs.functionstream.github.io --ignore-not-found=true || true
            
            # Delete the namespace itself
            kubectl delete namespace "$ns" --ignore-not-found=true || true
        fi
    done
}

# Main script
main() {
    echo "AgentStream - Uninstallation Script"
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
    
    # User confirmation
    print_warning "This script will uninstall AgentStream and FunctionStream from your Kubernetes cluster."
    print_warning "This will delete all related resources including:"
    echo "  - Namespaces: agent-stream, function-stream"
    echo "  - Custom Resource Definitions (CRDs)"
    echo "  - All resources in these namespaces"
    echo "  - RBAC resources"
    echo
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Uninstallation cancelled by user"
        exit 0
    fi
    echo
    
    # Start uninstallation
    print_status "Starting uninstallation process..."
    echo
    
    # Delete AgentStream resources
    if [ -f "$SCRIPT_DIR/deploy.yaml" ]; then
        delete_resources "$SCRIPT_DIR/deploy.yaml" "AgentStream"
        wait_for_deletion "$SCRIPT_DIR/deploy.yaml" "AgentStream"
    else
        print_warning "deploy.yaml not found, skipping AgentStream deletion"
    fi
    echo
    
    # Delete FunctionStream resources
    if [ -f "$SCRIPT_DIR/fs.yaml" ]; then
        delete_resources "$SCRIPT_DIR/fs.yaml" "FunctionStream"
        wait_for_deletion "$SCRIPT_DIR/fs.yaml" "FunctionStream"
    else
        print_warning "fs.yaml not found, skipping FunctionStream deletion"
    fi
    echo
    
    # Final cleanup
    cleanup_remaining_resources
    echo
    
    # Verification
    print_status "Verifying uninstallation..."
    local remaining_resources=false
    
    if kubectl get namespace agent-stream >/dev/null 2>&1; then
        print_warning "agent-stream namespace still exists"
        remaining_resources=true
    fi
    
    if kubectl get namespace function-stream >/dev/null 2>&1; then
        print_warning "function-stream namespace still exists"
        remaining_resources=true
    fi
    
    if kubectl get crd agents.as.agentstream.github.io >/dev/null 2>&1; then
        print_warning "Agent CRD still exists"
        remaining_resources=true
    fi
    
    if kubectl get crd functions.fs.functionstream.github.io >/dev/null 2>&1; then
        print_warning "Function CRD still exists"
        remaining_resources=true
    fi
    
    if kubectl get crd packages.fs.functionstream.github.io >/dev/null 2>&1; then
        print_warning "Package CRD still exists"
        remaining_resources=true
    fi
    
    if [ "$remaining_resources" = false ]; then
        print_success "Uninstallation completed successfully!"
        print_success "All AgentStream and FunctionStream resources have been removed."
    else
        print_warning "Uninstallation completed with warnings."
        print_warning "Some resources may still exist. You may need to manually clean them up."
        exit 1
    fi
}

# Handle script interruption
trap 'print_error "Script interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"

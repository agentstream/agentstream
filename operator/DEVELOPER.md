# Developer Guide

This document provides guidelines for developers working on the AgentStream operator project.

## Development Workflow

### Prerequisites

- Go 1.21+
- Docker
- Helm 3.x
- kubectl
- make

### Building and Testing

```bash
# Build the operator binary
make build

# Run tests
make test

# Run e2e tests (requires Kind cluster)
make test-e2e

# Format code
make fmt

# Lint code
make lint
```

## Helm Chart Development

### Chart Structure

The Helm chart is located in `deploy/chart/` and contains:

- `Chart.yaml` - Chart metadata
- `values.yaml` - Default configuration values
- `templates/` - Kubernetes manifest templates
- `templates/_helpers.tpl` - Common template functions

### Validating Helm Chart Changes

When making changes to the Helm chart (templates, values, etc.), you should validate that the chart generates valid YAML:

```bash
# Generate deployment YAML from the Helm chart
make generate-deploy-yaml
```

This command:
1. Uses `helm template` to render the chart templates
2. Applies the default values and namespace settings
3. Outputs the generated YAML to `scripts/deploy.yaml`

### Common Issues and Solutions

#### YAML Parsing Errors

If you encounter YAML parsing errors when running `make generate-deploy-yaml`:

1. **Check template syntax**: Ensure all template expressions use proper quoting
   ```yaml
   # Correct
   value: {{ .Values.someValue | quote }}
   
   # Incorrect
   value: {{ .Values.someValue }}
   ```

2. **Validate values.yaml**: The `values.yaml` file should contain static values, not template expressions
   ```yaml
   # Correct - empty value uses dynamic namespace
   agent:
     package: ""
   
   # Correct - static value
   agent:
     package: "agent-stream.agent"
   
   # Incorrect - template expression in values.yaml
   agent:
     package: "{{ .Release.Namespace }}.agent"
   ```

3. **Check indentation**: Ensure proper YAML indentation in template files

#### Debugging Template Issues

To debug template rendering issues:

```bash
# Use Helm debug mode to see detailed output
helm template agentstream ./deploy/chart --namespace agent-stream --set createNamespace=true --create-namespace --debug

# Validate chart syntax
helm lint ./deploy/chart
```

### Chart Customization

The chart can be customized by:

1. **Modifying values.yaml**: Change default configuration values
2. **Adding new templates**: Create new `.yaml` files in `templates/`
3. **Updating helpers**: Modify `_helpers.tpl` for common template functions

#### Dynamic Package Names

The chart supports dynamic package naming based on the release namespace:

- **Default behavior**: When `agent.package` is empty in `values.yaml`, the chart automatically uses `{{ .Release.Namespace }}.agent`
- **Custom package**: Set `agent.package` to a specific value to override the default

```bash
# Use default (namespace.agent)
helm template agentstream ./deploy/chart --namespace my-namespace

# Use custom package
helm template agentstream ./deploy/chart --namespace my-namespace --set agent.package="custom.package"
```

### Deployment

To deploy the operator using the generated YAML:

```bash
# Generate deployment YAML
make generate-deploy-yaml

# Apply to cluster
kubectl apply -f scripts/deploy.yaml
```

## Code Generation

The project uses code generation for CRDs and deep copy methods:

```bash
# Generate CRDs and RBAC manifests
make manifests

# Generate deep copy methods
make generate
```

## Testing

### Unit Tests

```bash
# Run unit tests
make test
```

### E2E Tests

E2E tests require a Kind cluster:

```bash
# Start Kind cluster (if not already running)
kind create cluster

# Run e2e tests
make test-e2e
```

## Code Quality

### Linting

```bash
# Run linter
make lint

# Run linter with auto-fix
make lint-fix
```

### Formatting

```bash
# Format code
make fmt
```

## Troubleshooting

### Common Issues

1. **Helm chart validation fails**: Check template syntax and values.yaml
2. **Code generation fails**: Ensure controller-gen is installed
3. **Tests fail**: Check that all dependencies are installed

### Getting Help

- Check the Makefile for available targets: `make help`
- Review existing templates in `deploy/chart/templates/`
- Validate Helm chart syntax: `helm lint ./deploy/chart`

## Best Practices

1. **Always validate Helm changes**: Run `make generate-deploy-yaml` after modifying the chart
2. **Use proper quoting**: Quote template expressions to avoid YAML parsing errors
3. **Test locally**: Use Kind cluster for local testing
4. **Follow Go conventions**: Use `make fmt` and `make lint` before committing
5. **Document changes**: Update this document when adding new development workflows 
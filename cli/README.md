# AgentStream CLI

A command-line tool for interacting with messaging systems, providing commands for producing messages, reading messages, and making RPC calls.

## Installation

```bash
cd cli
go build -o ascli
```

## Context Management

The CLI supports context management for storing and switching between different AgentStream connection configurations, similar to Kubernetes contexts.

### Context Commands

```bash
# Create a new context
./ascli context create local --pulsar-url pulsar://localhost:6650 --description "Local development environment"

# Create a context with authentication
./ascli context create prod --pulsar-url pulsar://prod-server:6650 --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem"}' --description "Production environment"

# Switch to a context
./ascli context use local

# List all contexts
./ascli context list

# Show current context
./ascli context current

# Delete a context
./ascli context delete local
```

### Context Configuration

Contexts are stored in `~/.ascli/contexts.json` and include:
- **Pulsar URL**: The service URL for the Pulsar cluster
- **Auth Plugin**: Authentication plugin class name (optional)
- **Auth Params**: Authentication parameters as JSON string (optional)
- **Description**: Human-readable description of the context

### Using Contexts with Commands

When a context is set, all commands will use the context's configuration by default. Command-line flags can override context settings:

```bash
# Use context configuration
./ascli produce --topic my-topic --json '{"key": "value"}'

# Override context with command-line flags
./ascli produce --topic my-topic --json '{"key": "value"}' --pulsar-url pulsar://other-server:6650
```

## Usage

### Produce Messages

Send JSON messages to a topic:

```bash
# Send a single message
./ascli produce --topic my-topic --json '{"key": "value"}'

# Send multiple messages
./ascli produce --topic my-topic --json '{"key": "value"}' --num 5

# Read JSON from stdin
echo '{"key": "value"}' | ./ascli produce --topic my-topic --json -

# Send as a request message
./ascli produce --topic my-topic --json '{"key": "value"}' --request

# Use custom service URL (overrides context)
./ascli produce --pulsar-url pulsar://localhost:6650 --topic my-topic --json '{"key": "value"}'

# Use authentication (overrides context)
./ascli produce --topic my-topic --json '{"key": "value"}' --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'
```

### Read Messages

Read messages from a topic:

```bash
# Read messages from current time
./ascli read --topic my-topic

# Read messages from a specific time
./ascli read --topic my-topic --seek-time "2024-01-01 12:00:00"

# Read a specific number of messages
./ascli read --topic my-topic --num 20

# Use custom service URL (overrides context)
./ascli read --pulsar-url pulsar://localhost:6650 --topic my-topic

# Use authentication (overrides context)
./ascli read --topic my-topic --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'
```

### RPC Calls

Send RPC requests and receive responses:

```bash
# Send RPC request
./ascli rpc --topic my-topic --json '{"key": "value"}'

# Read JSON from stdin for RPC
echo '{"key": "value"}' | ./ascli rpc --topic my-topic --json -

# Use custom response topic
./ascli rpc --topic my-topic --json '{"key": "value"}' --response-topic my-response-topic

# Use custom service URL (overrides context)
./ascli rpc --pulsar-url pulsar://localhost:6650 --topic my-topic --json '{"key": "value"}'

# Use authentication (overrides context)
./ascli rpc --topic my-topic --json '{"key": "value"}' --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'
```

## Global Options

All commands support the following global options that override context settings:

- `--pulsar-url`: Service URL (overrides context)
- `--auth-plugin`: Authentication plugin class name (overrides context)
- `--auth-params`: Authentication parameters as JSON string (overrides context)

## Examples

### Context Management Workflow

```bash
# Set up development environment
./ascli context create dev --pulsar-url pulsar://localhost:6650 --description "Development environment"
./ascli context use dev

# Set up production environment
./ascli context create prod --pulsar-url pulsar://prod-server:6650 --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem"}' --description "Production environment"

# Switch between environments
./ascli context use dev
./ascli produce --topic test-topic --json '{"message": "Hello from dev"}'

./ascli context use prod
./ascli produce --topic test-topic --json '{"message": "Hello from prod"}'
```

### Basic Message Production

```bash
# Send a simple message using context configuration
./ascli produce --topic test-topic --json '{"message": "Hello World", "timestamp": "2024-01-01T12:00:00Z"}'
```

### Reading Historical Messages

```bash
# Read messages from a specific time
./ascli read --topic test-topic --seek-time "2024-01-01 10:00:00" --num 5
```

### RPC Request/Response

```bash
# Send an RPC request
./ascli rpc --topic service-topic --json '{"action": "getData", "id": 123}'
```

## Features

- **Context Management**: Store and switch between different AgentStream connection configurations
- **JSON Support**: All commands support JSON data with pretty printing
- **Stdin Support**: Read JSON data from stdin using `-` as the JSON parameter
- **Time-based Reading**: Read messages from specific timestamps
- **RPC Support**: Send requests and receive responses with automatic request ID tracking
- **Multiple Message Production**: Send multiple copies of the same message
- **Request Messages**: Mark messages as requests with automatic request ID generation
- **Authentication Support**: Support for Pulsar authentication plugins (TLS, OAuth2, etc.)
- **Configuration Persistence**: Contexts are stored in `~/.ascli/contexts.json`

## Requirements

- Go 1.21 or later
- Messaging server running (default: `pulsar://localhost:6650`) 
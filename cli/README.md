# AgentStream CLI

A command-line tool for interacting with messaging systems, providing commands for producing messages, reading messages, and making RPC calls.

## Installation

```bash
cd cli
go build -o ascli
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

# Use custom service URL
./ascli produce --pulsar-url pulsar://localhost:6650 --topic my-topic --json '{"key": "value"}'

# Use authentication
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

# Use custom service URL
./ascli read --pulsar-url pulsar://localhost:6650 --topic my-topic

# Use authentication
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

# Use custom service URL
./ascli rpc --pulsar-url pulsar://localhost:6650 --topic my-topic --json '{"key": "value"}'

# Use authentication
./ascli rpc --topic my-topic --json '{"key": "value"}' --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'
```

## Global Options

All commands support the following global options:

- `--pulsar-url`: Service URL (default: `pulsar://localhost:6650`)
- `--auth-plugin`: Authentication plugin class name (optional)
- `--auth-params`: Authentication parameters as JSON string (optional)

## Examples

### Basic Message Production

```bash
# Send a simple message
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

- **JSON Support**: All commands support JSON data with pretty printing
- **Stdin Support**: Read JSON data from stdin using `-` as the JSON parameter
- **Time-based Reading**: Read messages from specific timestamps
- **RPC Support**: Send requests and receive responses with automatic request ID tracking
- **Multiple Message Production**: Send multiple copies of the same message
- **Request Messages**: Mark messages as requests with automatic request ID generation
- **Authentication Support**: Support for Pulsar authentication plugins (TLS, OAuth2, etc.)

## Requirements

- Go 1.21 or later
- Messaging server running (default: `pulsar://localhost:6650`) 
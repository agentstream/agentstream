#!/bin/bash

# Example script demonstrating ascli usage
# Make sure you have a messaging server running on localhost:6650

echo "=== AgentStream CLI Examples ==="
echo

# Build the CLI
echo "Building ascli..."
go build -o ascli .
echo

# Show help
echo "=== CLI Help ==="
./ascli --help
echo

# Show produce help
echo "=== Produce Command Help ==="
./ascli produce --help
echo

# Show read help
echo "=== Read Command Help ==="
./ascli read --help
echo

# Show rpc help
echo "=== RPC Command Help ==="
./ascli rpc --help
echo

echo "=== Usage Examples ==="
echo

echo "1. Produce a message:"
echo "   ./ascli produce --topic test-topic --json '{\"message\": \"Hello World\"}'"
echo

echo "2. Produce multiple messages:"
echo "   ./ascli produce --topic test-topic --json '{\"message\": \"Hello World\"}' --num 5"
echo

echo "3. Read messages from a topic:"
echo "   ./ascli read --topic test-topic --num 10"
echo

echo "4. Read messages from a specific time:"
echo "   ./ascli read --topic test-topic --seek-time \"2024-01-01 12:00:00\" --num 5"
echo

echo "5. Send RPC request:"
echo "   ./ascli rpc --topic service-topic --json '{\"action\": \"getData\", \"id\": 123}'"
echo

echo "6. Read JSON from stdin:"
echo "   echo '{\"key\": \"value\"}' | ./ascli produce --topic test-topic --json -"
echo

echo "Note: Make sure you have a messaging server running on localhost:6650"
echo "      or specify a different URL with --pulsar-url" 
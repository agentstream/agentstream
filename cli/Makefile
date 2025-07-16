.PHONY: build clean install test help

# Binary name
BINARY_NAME=ascli

# Build the binary
build:
	go build -o $(BINARY_NAME) .

# Clean build artifacts
clean:
	go clean
	rm -f $(BINARY_NAME)

# Install to system PATH (requires sudo on some systems)
install: build
	cp $(BINARY_NAME) /usr/local/bin/

# Run tests
test:
	go test ./...

# Show help
help:
	@echo "Available targets:"
	@echo "  build    - Build the binary"
	@echo "  clean    - Clean build artifacts"
	@echo "  install  - Install to system PATH"
	@echo "  test     - Run tests"
	@echo "  help     - Show this help"

# Default target
all: build 
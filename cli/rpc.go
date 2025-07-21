package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/apache/pulsar-client-go/pulsar"
	"github.com/google/uuid"
	"github.com/spf13/cobra"
)

var (
	rpcPulsarURL  string
	rpcTopic      string
	rpcJSON       string
	responseTopic string
	rpcAuthPlugin string
	rpcAuthParams string
)

var rpcCmd = &cobra.Command{
	Use:   "rpc",
	Short: "Send RPC request to a topic and get response",
	Long: `Send RPC request to a topic and get response.
	
Examples:
  ascli rpc --topic my-topic --json '{"key": "value"}'
  ascli rpc --topic my-topic --json -  # Read JSON from stdin
  ascli rpc --topic my-topic --json '{"key": "value"}' --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'
  
Context support:
  ascli context create local --pulsar-url pulsar://localhost:6650
  ascli context use local
  ascli rpc --topic my-topic --json '{"key": "value"}'  # Uses context configuration`,
	RunE: runRPC,
}

func init() {
	rootCmd.AddCommand(rpcCmd)

	rpcCmd.Flags().StringVar(&rpcPulsarURL, "pulsar-url", "", "Service URL (overrides context)")
	rpcCmd.Flags().StringVar(&rpcTopic, "topic", "", "Topic to send request to (required)")
	rpcCmd.Flags().StringVar(&rpcJSON, "json", "", "JSON string to send, or '-' to read from stdin (required)")
	rpcCmd.Flags().StringVar(&responseTopic, "response-topic", "", "Response topic (auto-generated if not specified)")
	rpcCmd.Flags().StringVar(&rpcAuthPlugin, "auth-plugin", "", "Authentication plugin class name (overrides context)")
	rpcCmd.Flags().StringVar(&rpcAuthParams, "auth-params", "", "Authentication parameters (JSON string) (overrides context)")

	rpcCmd.MarkFlagRequired("topic")
	rpcCmd.MarkFlagRequired("json")
}

func runRPC(cmd *cobra.Command, args []string) error {
	// Parse JSON data
	var data interface{}
	var messageStr string

	if rpcJSON == "-" {
		// Read from stdin
		scanner := bufio.NewScanner(os.Stdin)
		var input string
		for scanner.Scan() {
			input += scanner.Text() + "\n"
		}
		if err := json.Unmarshal([]byte(input), &data); err != nil {
			return fmt.Errorf("invalid JSON data from stdin: %v", err)
		}
		messageStr = input
	} else {
		// Parse the provided JSON string
		if err := json.Unmarshal([]byte(rpcJSON), &data); err != nil {
			return fmt.Errorf("invalid JSON data: %v", err)
		}
		messageStr = rpcJSON
	}

	// Generate response topic if not provided
	if responseTopic == "" {
		responseTopic = fmt.Sprintf("non-persistent://public/default/response-%s", uuid.New().String())
	}

	// Get configuration from context or command line
	url, authPlugin, authParams, err := getContextConfig(rpcPulsarURL, rpcAuthPlugin, rpcAuthParams)
	if err != nil {
		return fmt.Errorf("failed to get context configuration: %v", err)
	}

	// Create client
	clientOpts, err := buildClientOptions(url, authPlugin, authParams)
	if err != nil {
		return fmt.Errorf("failed to build client options: %v", err)
	}

	client, err := pulsar.NewClient(clientOpts)
	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}
	defer client.Close()

	// Create producer for request
	producer, err := client.CreateProducer(pulsar.ProducerOptions{
		Topic: rpcTopic,
	})
	if err != nil {
		return fmt.Errorf("failed to create producer: %v", err)
	}
	defer producer.Close()

	// Create consumer for response
	consumer, err := client.Subscribe(pulsar.ConsumerOptions{
		Topic:            responseTopic,
		SubscriptionName: fmt.Sprintf("rpc-consumer-%s", uuid.New().String()),
		Type:             pulsar.Exclusive,
	})
	if err != nil {
		return fmt.Errorf("failed to create consumer: %v", err)
	}
	defer consumer.Close()

	// Generate request ID
	requestID := uuid.New().String()

	// Send request
	properties := map[string]string{
		"request_id":     requestID,
		"response_topic": responseTopic,
	}

	msgID, err := producer.Send(context.Background(), &pulsar.ProducerMessage{
		Payload:    []byte(messageStr),
		Properties: properties,
	})
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}

	fmt.Printf("Request sent to topic '%s' (%s) with request_id: %s\n", rpcTopic, msgID, requestID)
	fmt.Printf("Waiting for response on topic: %s\n", responseTopic)

	// Wait for response
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	msg, err := consumer.Receive(ctx)
	if err != nil {
		return fmt.Errorf("failed to receive response: %v", err)
	}

	// Check if this is the response for our request
	if msg.Properties()["request_id"] == requestID {
		rawData := string(msg.Payload())
		fmt.Println("Received response:")

		// Try to parse as JSON for pretty printing
		var responseData interface{}
		if err := json.Unmarshal([]byte(rawData), &responseData); err == nil {
			prettyJSON, _ := json.MarshalIndent(responseData, "", "  ")
			fmt.Println(string(prettyJSON))
		} else {
			fmt.Println(rawData)
		}

		consumer.Ack(msg)
	} else {
		return fmt.Errorf("received response with different request_id")
	}

	return nil
}

package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/apache/pulsar-client-go/pulsar"
	"github.com/google/uuid"
	"github.com/spf13/cobra"
)

var (
	pulsarURL  string
	topic      string
	jsonData   string
	num        int
	request    bool
	authPlugin string
	authParams string
)

var produceCmd = &cobra.Command{
	Use:   "produce",
	Short: "Produce JSON messages to a topic",
	Long: `Produce JSON messages to a topic.
	
Examples:
  ascli produce --topic my-topic --json '{"key": "value"}'
  ascli produce --topic my-topic --json - --num 5  # Read JSON from stdin
  ascli produce --topic my-topic --json '{"key": "value"}' --request
  ascli produce --topic my-topic --json '{"key": "value"}' --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'`,
	RunE: runProduce,
}

func init() {
	rootCmd.AddCommand(produceCmd)

	produceCmd.Flags().StringVar(&pulsarURL, "pulsar-url", "pulsar://localhost:6650", "Service URL")
	produceCmd.Flags().StringVar(&topic, "topic", "", "Topic to produce to (required)")
	produceCmd.Flags().StringVar(&jsonData, "json", "", "JSON string to send, or '-' to read from stdin (required)")
	produceCmd.Flags().IntVar(&num, "num", 1, "Number of messages to produce")
	produceCmd.Flags().BoolVar(&request, "request", false, "Send as a request message")
	produceCmd.Flags().StringVar(&authPlugin, "auth-plugin", "", "Authentication plugin class name")
	produceCmd.Flags().StringVar(&authParams, "auth-params", "", "Authentication parameters (JSON string)")

	produceCmd.MarkFlagRequired("topic")
	produceCmd.MarkFlagRequired("json")
}

func runProduce(cmd *cobra.Command, args []string) error {
	// Parse JSON data
	var data interface{}
	var messageStr string

	if jsonData == "-" {
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
		if err := json.Unmarshal([]byte(jsonData), &data); err != nil {
			return fmt.Errorf("invalid JSON data: %v", err)
		}
		messageStr = jsonData
	}

	// Create client
	clientOpts, err := buildClientOptions(pulsarURL, authPlugin, authParams)
	if err != nil {
		return fmt.Errorf("failed to build client options: %v", err)
	}

	client, err := pulsar.NewClient(clientOpts)
	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}
	defer client.Close()

	// Create producer
	producer, err := client.CreateProducer(pulsar.ProducerOptions{
		Topic: topic,
	})
	if err != nil {
		return fmt.Errorf("failed to create producer: %v", err)
	}
	defer producer.Close()

	// Prepare properties
	properties := make(map[string]string)
	if request {
		properties["request_id"] = uuid.New().String()
	}

	// Send messages
	for i := 0; i < num; i++ {
		msgID, err := producer.Send(context.Background(), &pulsar.ProducerMessage{
			Payload:    []byte(messageStr),
			Properties: properties,
		})

		if err != nil {
			fmt.Printf("Failed to send message %d to topic '%s': %v\n", i+1, topic, err)
		} else {
			fmt.Printf("Message %d sent to topic '%s' (%s):\n", i+1, topic, msgID)
			prettyJSON, _ := json.MarshalIndent(data, "", "  ")
			fmt.Println(string(prettyJSON))
		}
	}

	return nil
}

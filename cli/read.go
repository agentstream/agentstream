package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/apache/pulsar-client-go/pulsar"
	"github.com/spf13/cobra"
)

var (
	readPulsarURL  string
	readTopic      string
	seekTime       string
	readNum        int
	readAuthPlugin string
	readAuthParams string
)

var readCmd = &cobra.Command{
	Use:   "read",
	Short: "Read messages from a topic",
	Long: `Read messages from a topic.
	
Examples:
  ascli read --topic my-topic
  ascli read --topic my-topic --seek-time "2024-01-01 12:00:00"
  ascli read --topic my-topic --num 20
  ascli read --topic my-topic --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem", "tlsKeyFile": "/path/to/key.pem"}'
  
Context support:
  ascli context create local --pulsar-url pulsar://localhost:6650
  ascli context use local
  ascli read --topic my-topic  # Uses context configuration`,
	RunE: runRead,
}

func init() {
	rootCmd.AddCommand(readCmd)

	readCmd.Flags().StringVar(&readPulsarURL, "pulsar-url", "", "Service URL (overrides context)")
	readCmd.Flags().StringVar(&readTopic, "topic", "", "Topic to read from (required)")
	readCmd.Flags().StringVar(&seekTime, "seek-time", time.Now().Format("2006-01-02 15:04:05"), "Seek time in format YYYY-MM-DD HH:MM:SS")
	readCmd.Flags().IntVar(&readNum, "num", 10, "Number of messages to read")
	readCmd.Flags().StringVar(&readAuthPlugin, "auth-plugin", "", "Authentication plugin class name (overrides context)")
	readCmd.Flags().StringVar(&readAuthParams, "auth-params", "", "Authentication parameters (JSON string) (overrides context)")

	readCmd.MarkFlagRequired("topic")
}

func runRead(cmd *cobra.Command, args []string) error {
	// Parse seek time
	seekTimeParsed, err := time.Parse("2006-01-02 15:04:05", seekTime)
	if err != nil {
		return fmt.Errorf("invalid seek_time format. Use YYYY-MM-DD HH:MM:SS: %v", err)
	}

	// Get configuration from context or command line
	url, authPlugin, authParams, err := getContextConfig(readPulsarURL, readAuthPlugin, readAuthParams)
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

	// Create reader
	reader, err := client.CreateReader(pulsar.ReaderOptions{
		Topic:          readTopic,
		StartMessageID: pulsar.EarliestMessageID(),
	})
	if err != nil {
		return fmt.Errorf("failed to create reader: %v", err)
	}
	defer reader.Close()

	// Seek to the specified time
	err = reader.SeekByTime(seekTimeParsed)
	if err != nil {
		return fmt.Errorf("failed to seek to time: %v", err)
	}

	// Read messages
	recvNum := 0
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for recvNum < readNum {
		msg, err := reader.Next(ctx)
		if err != nil {
			if err == context.DeadlineExceeded {
				fmt.Printf("Timeout reached after reading %d messages\n", recvNum)
				break
			}
			return fmt.Errorf("failed to read message: %v", err)
		}

		rawData := string(msg.Payload())
		fmt.Println("---")
		fmt.Printf("Read Index: %d\n", recvNum)
		fmt.Printf("Message ID: %s\n", msg.ID())
		fmt.Printf("Message Header: %v\n", msg.Properties())
		fmt.Printf("Publish time: %s\n", msg.PublishTime().Format("2006-01-02 15:04:05"))

		// Try to parse as JSON for pretty printing
		var data interface{}
		if err := json.Unmarshal([]byte(rawData), &data); err == nil {
			prettyJSON, _ := json.MarshalIndent(data, "", "  ")
			fmt.Println(string(prettyJSON))
		} else {
			fmt.Println(rawData)
		}

		recvNum++
	}

	return nil
}

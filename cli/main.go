package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "ascli",
	Short: "AgentStream CLI tool",
	Long: `AgentStream CLI is a command-line tool for interacting with messaging systems.
It provides commands for producing messages, reading messages, and making RPC calls.`,
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

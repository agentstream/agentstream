package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

// Context represents an AgentStream connection context
type Context struct {
	Name        string `json:"name"`
	PulsarURL   string `json:"pulsar_url"`
	AuthPlugin  string `json:"auth_plugin,omitempty"`
	AuthParams  string `json:"auth_params,omitempty"`
	Description string `json:"description,omitempty"`
}

// ContextConfig represents the configuration file structure
type ContextConfig struct {
	CurrentContext string             `json:"current_context"`
	Contexts       map[string]Context `json:"contexts"`
}

var (
	contextConfigPath string
	contextConfig     *ContextConfig
)

var contextCmd = &cobra.Command{
	Use:   "context",
	Short: "Manage AgentStream connection contexts",
	Long: `Manage AgentStream connection contexts for storing connection configurations.
	
Examples:
  ascli context create my-context --pulsar-url pulsar://localhost:6650
  ascli context create prod-context --pulsar-url pulsar://prod-server:6650 --auth-plugin org.apache.pulsar.client.impl.auth.AuthenticationTls --auth-params '{"tlsCertFile": "/path/to/cert.pem"}'
  ascli context use my-context
  ascli context list
  ascli context delete my-context`,
}

func init() {
	rootCmd.AddCommand(contextCmd)
	contextCmd.AddCommand(createContextCmd)
	contextCmd.AddCommand(useContextCmd)
	contextCmd.AddCommand(listContextCmd)
	contextCmd.AddCommand(deleteContextCmd)
	contextCmd.AddCommand(getCurrentContextCmd)
}

var createContextCmd = &cobra.Command{
	Use:   "create [name]",
	Short: "Create a new context",
	Args:  cobra.ExactArgs(1),
	RunE:  runCreateContext,
}

var useContextCmd = &cobra.Command{
	Use:   "use [name]",
	Short: "Switch to a context",
	Args:  cobra.ExactArgs(1),
	RunE:  runUseContext,
}

var listContextCmd = &cobra.Command{
	Use:   "list",
	Short: "List all contexts",
	RunE:  runListContext,
}

var deleteContextCmd = &cobra.Command{
	Use:   "delete [name]",
	Short: "Delete a context",
	Args:  cobra.ExactArgs(1),
	RunE:  runDeleteContext,
}

var getCurrentContextCmd = &cobra.Command{
	Use:   "current",
	Short: "Show current context",
	RunE:  runGetCurrentContext,
}

func init() {
	createContextCmd.Flags().String("pulsar-url", "", "Pulsar service URL (required)")
	createContextCmd.Flags().String("auth-plugin", "", "Authentication plugin class name")
	createContextCmd.Flags().String("auth-params", "", "Authentication parameters (JSON string)")
	createContextCmd.Flags().String("description", "", "Context description")

	createContextCmd.MarkFlagRequired("pulsar-url")
}

// loadContextConfig loads the context configuration from file
func loadContextConfig() error {
	if contextConfig != nil {
		return nil
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get user home directory: %v", err)
	}

	configDir := filepath.Join(homeDir, ".ascli")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %v", err)
	}

	contextConfigPath = filepath.Join(configDir, "contexts.json")
	contextConfig = &ContextConfig{
		Contexts: make(map[string]Context),
	}

	// Try to load existing config
	if _, err := os.Stat(contextConfigPath); err == nil {
		data, err := os.ReadFile(contextConfigPath)
		if err != nil {
			return fmt.Errorf("failed to read config file: %v", err)
		}

		if err := json.Unmarshal(data, contextConfig); err != nil {
			return fmt.Errorf("failed to parse config file: %v", err)
		}
	}

	return nil
}

// saveContextConfig saves the context configuration to file
func saveContextConfig() error {
	if contextConfig == nil {
		return fmt.Errorf("context config not initialized")
	}

	data, err := json.MarshalIndent(contextConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %v", err)
	}

	if err := os.WriteFile(contextConfigPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %v", err)
	}

	return nil
}

// getCurrentContext returns the current context configuration
func getCurrentContext() (*Context, error) {
	if err := loadContextConfig(); err != nil {
		return nil, err
	}

	if contextConfig.CurrentContext == "" {
		return nil, fmt.Errorf("no current context set")
	}

	ctx, exists := contextConfig.Contexts[contextConfig.CurrentContext]
	if !exists {
		return nil, fmt.Errorf("current context '%s' not found", contextConfig.CurrentContext)
	}

	return &ctx, nil
}

func runCreateContext(cmd *cobra.Command, args []string) error {
	name := args[0]

	if err := loadContextConfig(); err != nil {
		return err
	}

	// Check if context already exists
	if _, exists := contextConfig.Contexts[name]; exists {
		return fmt.Errorf("context '%s' already exists", name)
	}

	pulsarURL, _ := cmd.Flags().GetString("pulsar-url")
	authPlugin, _ := cmd.Flags().GetString("auth-plugin")
	authParams, _ := cmd.Flags().GetString("auth-params")
	description, _ := cmd.Flags().GetString("description")

	context := Context{
		Name:        name,
		PulsarURL:   pulsarURL,
		AuthPlugin:  authPlugin,
		AuthParams:  authParams,
		Description: description,
	}

	contextConfig.Contexts[name] = context

	// Set as current context if it's the first one
	if contextConfig.CurrentContext == "" {
		contextConfig.CurrentContext = name
	}

	if err := saveContextConfig(); err != nil {
		return err
	}

	fmt.Printf("Context '%s' created successfully\n", name)
	if contextConfig.CurrentContext == name {
		fmt.Printf("Context '%s' set as current\n", name)
	}

	return nil
}

func runUseContext(cmd *cobra.Command, args []string) error {
	name := args[0]

	if err := loadContextConfig(); err != nil {
		return err
	}

	if _, exists := contextConfig.Contexts[name]; !exists {
		return fmt.Errorf("context '%s' not found", name)
	}

	contextConfig.CurrentContext = name

	if err := saveContextConfig(); err != nil {
		return err
	}

	fmt.Printf("Switched to context '%s'\n", name)
	return nil
}

func runListContext(cmd *cobra.Command, args []string) error {
	if err := loadContextConfig(); err != nil {
		return err
	}

	if len(contextConfig.Contexts) == 0 {
		fmt.Println("No contexts found")
		return nil
	}

	fmt.Println("Available contexts:")
	for name, ctx := range contextConfig.Contexts {
		current := ""
		if name == contextConfig.CurrentContext {
			current = " (current)"
		}
		fmt.Printf("  %s%s\n", name, current)
		if ctx.Description != "" {
			fmt.Printf("    Description: %s\n", ctx.Description)
		}
		fmt.Printf("    Pulsar URL: %s\n", ctx.PulsarURL)
		if ctx.AuthPlugin != "" {
			fmt.Printf("    Auth Plugin: %s\n", ctx.AuthPlugin)
		}
		fmt.Println()
	}

	return nil
}

func runDeleteContext(cmd *cobra.Command, args []string) error {
	name := args[0]

	if err := loadContextConfig(); err != nil {
		return err
	}

	if _, exists := contextConfig.Contexts[name]; !exists {
		return fmt.Errorf("context '%s' not found", name)
	}

	// Don't allow deleting current context
	if name == contextConfig.CurrentContext {
		return fmt.Errorf("cannot delete current context '%s'. Switch to another context first", name)
	}

	delete(contextConfig.Contexts, name)

	if err := saveContextConfig(); err != nil {
		return err
	}

	fmt.Printf("Context '%s' deleted successfully\n", name)
	return nil
}

func runGetCurrentContext(cmd *cobra.Command, args []string) error {
	if err := loadContextConfig(); err != nil {
		return err
	}

	if contextConfig.CurrentContext == "" {
		fmt.Println("No current context set")
		return nil
	}

	ctx, exists := contextConfig.Contexts[contextConfig.CurrentContext]
	if !exists {
		return fmt.Errorf("current context '%s' not found", contextConfig.CurrentContext)
	}

	fmt.Printf("Current context: %s\n", ctx.Name)
	if ctx.Description != "" {
		fmt.Printf("Description: %s\n", ctx.Description)
	}
	fmt.Printf("Pulsar URL: %s\n", ctx.PulsarURL)
	if ctx.AuthPlugin != "" {
		fmt.Printf("Auth Plugin: %s\n", ctx.AuthPlugin)
	}

	return nil
}

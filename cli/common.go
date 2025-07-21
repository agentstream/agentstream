package main

import (
	"fmt"

	"github.com/apache/pulsar-client-go/pulsar"
)

// buildClientOptions creates Pulsar client options with optional authentication
func buildClientOptions(url string, authPlugin, authParams string) (pulsar.ClientOptions, error) {
	opts := pulsar.ClientOptions{
		URL: url,
	}

	if authPlugin != "" {
		auth, err := pulsar.NewAuthentication(authPlugin, authParams)
		if err != nil {
			return opts, fmt.Errorf("failed to create authentication: %v", err)
		}
		opts.Authentication = auth
	}

	return opts, nil
}

// getContextConfig gets Pulsar configuration from current context, with fallback to provided values
func getContextConfig(providedURL, providedAuthPlugin, providedAuthParams string) (string, string, string, error) {
	// If all parameters are provided via command line, use them
	if providedURL != "" && providedAuthPlugin != "" && providedAuthParams != "" {
		return providedURL, providedAuthPlugin, providedAuthParams, nil
	}

	// Try to get configuration from current context
	currentCtx, err := getCurrentContext()
	if err != nil {
		// If no context is set, use provided values with defaults
		if providedURL == "" {
			providedURL = "pulsar://localhost:6650"
		}
		return providedURL, providedAuthPlugin, providedAuthParams, nil
	}

	// Use context values, with fallback to provided values
	url := currentCtx.PulsarURL
	if providedURL != "" {
		url = providedURL
	}

	authPlugin := currentCtx.AuthPlugin
	if providedAuthPlugin != "" {
		authPlugin = providedAuthPlugin
	}

	authParams := currentCtx.AuthParams
	if providedAuthParams != "" {
		authParams = providedAuthParams
	}

	return url, authPlugin, authParams, nil
}

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

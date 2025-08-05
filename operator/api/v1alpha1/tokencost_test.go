package v1alpha1

import (
    "fmt"
    "io"
    "net/http"
    "regexp"
    "strconv"
    "strings"
    "testing"
    "time"
)

var globalTokenCounter = map[string]int64{
    "prompt_tokens":    0,
    "candidates_tokens": 0,
    "cache_tokens":     0,
    "total_tokens":     0,
}

func getTokens() map[string]int64 {
    return globalTokenCounter
}

// Parse Prometheus metrics and extract values
func parseMetrics(metrics string) map[string]int64 {
    result := make(map[string]int64)
    
    // Define metric names to parse
    metricNames := []string{
        "prompt_tokens_total",
        "candidates_tokens_total", 
        "cache_tokens_total",
        "total_tokens_total",
    }
    
    for _, metricName := range metricNames {
        // Use regex to match metric lines
        pattern := fmt.Sprintf(`%s\s+(\d+)`, metricName)
        re := regexp.MustCompile(pattern)
        matches := re.FindStringSubmatch(metrics)
        
        if len(matches) > 1 {
            if value, err := strconv.ParseInt(matches[1], 10, 64); err == nil {
                result[metricName] = value
            }
        }
    }
    
    return result
}

func TestPrometheusMetricsExposed(t *testing.T) {
    // Wait for service to start and expose port
    time.Sleep(2 * time.Second)

    // Access local Prometheus metrics endpoint
    resp, err := http.Get("http://localhost:8000/metrics")
    if err != nil {
        t.Fatal("Failed to access Prometheus metrics: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        t.Fatal("Metrics returned non-200 status code: %d", resp.StatusCode)
    }

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        t.Fatal("Failed to read metrics content: %v", err)
    }

    metrics := string(body)
    
    // Check if key metrics exist
    expectedMetrics := []string{
        "prompt_tokens_total",
        "candidates_tokens_total",
        "cache_tokens_total",
        "total_tokens_total",
    }
    
    for _, metric := range expectedMetrics {
        if !strings.Contains(metrics, metric) {
            t.Error("Metric not found: %s", metric)
        }
    }
    
    // Parse and output specific values
    parsedMetrics := parseMetrics(metrics)
    
    fmt.Println("=== Prometheus Metrics Values ===")
    for metricName, value := range parsedMetrics {
        fmt.Printf("%s: %d\n", metricName, value)
    }

    fmt.Println("=== Global Cumulative Token Usage ===")
    fmt.Printf("Current global cumulative token usage: %+v\n", getTokens())
    
    // Validate parsed values are reasonable
    if len(parsedMetrics) == 0 {
        t.Error("Failed to parse any metric values")
    }
    
    // Output complete metrics content for debugging
    fmt.Println("=== Complete Metrics Content ===")
    fmt.Println(metrics)
}

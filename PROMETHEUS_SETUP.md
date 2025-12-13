# Prometheus Monitoring Setup

This backend has been configured with Prometheus monitoring using the `prom-client` package. This allows you to collect and expose metrics about your application's performance.

## Overview

### Components

1. **Prometheus Metrics Module** (`utils/prometheus.js`)

   - Initializes the Prometheus client registry
   - Defines custom metrics for tracking application behavior

2. **Metrics Middleware** (`utils/metricsMiddleware.js`)

   - Express middleware that tracks HTTP request duration
   - Records request count and active request count
   - Labels metrics with method, route, and status code

3. **Metrics Endpoint** (`/metrics`)
   - Exposes metrics in Prometheus text format
   - Scraped by Prometheus to collect time-series data

## Metrics Exposed

### Default Metrics (from prom-client)

- `process_cpu_usage_percent` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_event_loop_lag_seconds` - Event loop lag
- And many more Node.js default metrics

### Custom Metrics

#### `http_request_duration_ms` (Histogram)

- **Description**: Duration of HTTP requests in milliseconds
- **Labels**: method, route, status_code
- **Buckets**: 10, 30, 100, 300, 1000, 3000 ms

#### `http_requests_total` (Counter)

- **Description**: Total number of HTTP requests
- **Labels**: method, route, status_code

#### `http_requests_active` (Gauge)

- **Description**: Number of currently active/in-flight HTTP requests
- **No labels**

## Accessing Metrics

### Development

Visit `http://localhost:8000/metrics` to view metrics in Prometheus text format.

### Production (Render)

Your Prometheus instance can scrape metrics from:

```
https://your-render-url/metrics
```

## Setting Up Prometheus Scraping

To scrape metrics from your application, add this to your `prometheus.yml` configuration:

```yaml
scrape_configs:
  - job_name: "lsp-backend"
    static_configs:
      - targets: ["localhost:8000"] # For local development
    # OR for production
    # static_configs:
    #   - targets: ['lsp-backend.onrender.com:443']
    # scheme: https
    scrape_interval: 15s
    scrape_timeout: 10s
```

## Example Queries (PromQL)

Once metrics are being scraped, you can query them in Prometheus or Grafana:

```promql
# Average request duration in the last 5 minutes
rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])

# Request rate per second
rate(http_requests_total[1m])

# Currently active requests
http_requests_active

# P95 request latency
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Requests per method
rate(http_requests_total[1m]) by (method)

# Requests by status code
rate(http_requests_total[1m]) by (status_code)
```

## Integration with Grafana

1. Add Prometheus as a data source in Grafana
2. Create dashboards using the available metrics
3. Set up alerts based on metric thresholds

## Important Notes

- The metrics endpoint (`/metrics`) is not protected - consider adding authentication in production
- Metrics are kept in memory; they reset when the application restarts
- For persistent metrics storage and querying, use a Prometheus time-series database
- The frontend on Vercel doesn't need changes; only the backend exposes metrics

## Next Steps

1. Run `npm install` to install the `prom-client` package
2. Deploy the backend to Render
3. Set up a Prometheus instance to scrape metrics
4. Create Grafana dashboards for visualization and monitoring

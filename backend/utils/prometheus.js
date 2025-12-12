const client = require("prom-client");

// Create a Registry
const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP Request Duration Histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [10, 30, 100, 300, 1000, 3000],
  registers: [register],
});

// HTTP Request Counter
const httpRequestCount = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Active Requests Gauge
const activeRequests = new client.Gauge({
  name: "http_requests_active",
  help: "Number of active HTTP requests",
  registers: [register],
});

module.exports = {
  register,
  httpRequestDurationMicroseconds,
  httpRequestCount,
  activeRequests,
};

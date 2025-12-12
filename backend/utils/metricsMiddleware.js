const {
  httpRequestDurationMicroseconds,
  httpRequestCount,
  activeRequests,
} = require("./prometheus");

/**
 * Middleware to track HTTP request duration and count
 * Records metrics for method, route, and status code
 */
const prometheusMiddleware = (req, res, next) => {
  // Increment active requests
  activeRequests.inc();

  // Start timer
  const start = Date.now();

  // Capture the original send method
  const originalSend = res.send;

  // Override res.send to track when response is sent
  res.send = function (data) {
    // Calculate duration in milliseconds
    const duration = Date.now() - start;

    // Get the route from the request
    const route = req.route ? req.route.path : req.path;

    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestCount
      .labels(req.method, route, res.statusCode)
      .inc();

    // Decrement active requests
    activeRequests.dec();

    // Call the original send method
    return originalSend.call(this, data);
  };

  next();
};

module.exports = prometheusMiddleware;

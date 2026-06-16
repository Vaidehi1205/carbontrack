/**
 * Global Express error handler — never leaks stack traces in production.
 */
export default function errorHandler(err, req, res, next) {
  console.error("API Error:", err.message);

  const status = err.status || err.statusCode || 500;
  const message = status === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message || "Internal server error";

  res.status(status).json({ error: message });
}

/**
 * Async route wrapper to catch rejected promises.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

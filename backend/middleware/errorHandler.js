/**
 * Global Express error handler — never leaks stack traces in production.
 */
export default function errorHandler(err, req, res, next) {
  const message = err.message || "Internal server error";
  console.error(`[${req.method} ${req.path}] Error:`, message);
  if (err.details) console.error("Details:", err.details);

  const status = err.status || err.statusCode || 500;
  const displayMessage = status === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : message;

  res.status(status).json({ error: displayMessage });
}

/**
 * Async route wrapper to catch rejected promises.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

import logger from '../utils/logger.js';

export function notFoundHandler(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  logger.error(`${code}: ${error.message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Unexpected server error',
      code
    }
  });
}


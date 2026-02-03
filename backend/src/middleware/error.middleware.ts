import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';
import { appConfig } from '../config/app.config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(appConfig.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error creators
export const notFound = (message = 'Resource not found') => new ApiError(404, message);
export const badRequest = (message = 'Bad request') => new ApiError(400, message);
export const unauthorized = (message = 'Unauthorized') => new ApiError(401, message);
export const forbidden = (message = 'Forbidden') => new ApiError(403, message);
export const conflict = (message = 'Conflict') => new ApiError(409, message);
export const internalError = (message = 'Internal server error') => new ApiError(500, message, false);


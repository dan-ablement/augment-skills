import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  ApiError,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  internalError,
} from '../../middleware/error.middleware';

// Mock the logger
jest.mock('../../config/logger.config', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock appConfig
jest.mock('../../config/app.config', () => ({
  appConfig: {
    nodeEnv: 'test',
  },
}));

import { logger } from '../../config/logger.config';
import { appConfig } from '../../config/app.config';

describe('Error Middleware', () => {
  describe('ApiError class', () => {
    it('should create an error with statusCode and message', () => {
      const error = new ApiError(400, 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.isOperational).toBe(true);
    });

    it('should set isOperational to true by default', () => {
      const error = new ApiError(500, 'Server error');

      expect(error.isOperational).toBe(true);
    });

    it('should allow isOperational to be set to false', () => {
      const error = new ApiError(500, 'Fatal error', false);

      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new ApiError(404, 'Not found');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      // Stack trace should contain the test file location
      expect(error.stack).toContain('error.middleware.test.ts');
    });

    it('should inherit from Error', () => {
      const error = new ApiError(400, 'Bad request');

      expect(error.name).toBe('Error');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error creator functions', () => {
    describe('notFound', () => {
      it('should create a 404 error with default message', () => {
        const error = notFound();

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
        expect(error.isOperational).toBe(true);
      });

      it('should create a 404 error with custom message', () => {
        const error = notFound('User not found');

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
      });
    });

    describe('badRequest', () => {
      it('should create a 400 error with default message', () => {
        const error = badRequest();

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad request');
        expect(error.isOperational).toBe(true);
      });

      it('should create a 400 error with custom message', () => {
        const error = badRequest('Invalid input');

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid input');
      });
    });

    describe('unauthorized', () => {
      it('should create a 401 error with default message', () => {
        const error = unauthorized();

        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Unauthorized');
        expect(error.isOperational).toBe(true);
      });

      it('should create a 401 error with custom message', () => {
        const error = unauthorized('Invalid token');

        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid token');
      });
    });

    describe('forbidden', () => {
      it('should create a 403 error with default message', () => {
        const error = forbidden();

        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Forbidden');
        expect(error.isOperational).toBe(true);
      });

      it('should create a 403 error with custom message', () => {
        const error = forbidden('Access denied');

        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Access denied');
      });
    });

    describe('conflict', () => {
      it('should create a 409 error with default message', () => {
        const error = conflict();

        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Conflict');
        expect(error.isOperational).toBe(true);
      });

      it('should create a 409 error with custom message', () => {
        const error = conflict('Resource already exists');

        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Resource already exists');
      });
    });

    describe('internalError', () => {
      it('should create a 500 error with default message', () => {
        const error = internalError();

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Internal server error');
        expect(error.isOperational).toBe(false);
      });

      it('should create a 500 error with custom message', () => {
        const error = internalError('Database connection failed');

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Database connection failed');
        expect(error.isOperational).toBe(false);
      });
    });
  });

  describe('errorHandler middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();

      jsonMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });

      mockRequest = {
        path: '/api/test',
        method: 'GET',
      };

      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };

      mockNext = jest.fn();
    });

    it('should send correct JSON response for ApiError', () => {
      const error = new ApiError(404, 'Resource not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Resource not found',
          statusCode: 404,
        },
      });
    });

    it('should default to 500 status code when not provided', () => {
      const error = new Error('Unknown error') as any;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Unknown error',
          statusCode: 500,
        },
      });
    });

    it('should default to "Internal Server Error" message when not provided', () => {
      const error = { statusCode: 500 } as any;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Internal Server Error',
          statusCode: 500,
        },
      });
    });

    it('should log the error with correct metadata', () => {
      const error = new ApiError(400, 'Bad request');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error: Bad request', {
        statusCode: 400,
        path: '/api/test',
        method: 'GET',
        stack: error.stack,
      });
    });

    it('should include stack trace in development environment', () => {
      // Override appConfig for this test
      (appConfig as any).nodeEnv = 'development';

      const error = new ApiError(500, 'Server error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Server error',
          statusCode: 500,
          stack: error.stack,
        },
      });

      // Reset
      (appConfig as any).nodeEnv = 'test';
    });

    it('should not include stack trace in production environment', () => {
      (appConfig as any).nodeEnv = 'production';

      const error = new ApiError(500, 'Server error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          message: 'Server error',
          statusCode: 500,
        },
      });

      // Reset
      (appConfig as any).nodeEnv = 'test';
    });

    it('should handle all error creator functions correctly', () => {
      const errors = [
        { fn: notFound, expectedStatus: 404 },
        { fn: badRequest, expectedStatus: 400 },
        { fn: unauthorized, expectedStatus: 401 },
        { fn: forbidden, expectedStatus: 403 },
        { fn: conflict, expectedStatus: 409 },
        { fn: internalError, expectedStatus: 500 },
      ];

      errors.forEach(({ fn, expectedStatus }) => {
        jest.clearAllMocks();
        const error = fn();

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });
});


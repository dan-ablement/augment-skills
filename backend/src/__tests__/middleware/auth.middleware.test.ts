import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import { ApiError } from '../../middleware/error.middleware';

// Helper to extract error from next() call
const getNextError = (mockNext: jest.MockedFunction<NextFunction>): ApiError => {
  return mockNext.mock.calls[0][0] as unknown as ApiError;
};

// Helper to create mock session
const createMockSession = (overrides: Record<string, unknown> = {}) => {
  return overrides as unknown as Request['session'];
};

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('requireAuth', () => {
    it('should call next() when session.isAuthenticated is true', () => {
      mockReq.session = createMockSession({
        isAuthenticated: true,
        user: {
          role: 'user',
          authMethod: 'google',
        },
      });

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with unauthorized error when not authenticated', () => {
      mockReq.session = createMockSession({
        isAuthenticated: false,
      });

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = getNextError(mockNext);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Please log in to access this resource');
    });

    it('should handle missing session', () => {
      mockReq.session = undefined;

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = getNextError(mockNext);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Please log in to access this resource');
    });
  });

  describe('requireAdmin', () => {
    it('should call next() when authenticated and role is admin', () => {
      mockReq.session = createMockSession({
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'admin@example.com',
          username: 'admin',
          role: 'admin',
          authMethod: 'admin',
        },
      });

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with unauthorized error when not admin', () => {
      mockReq.session = createMockSession({
        isAuthenticated: true,
        user: {
          id: '2',
          email: 'user@example.com',
          role: 'user',
          authMethod: 'google',
        },
      });

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = getNextError(mockNext);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Admin access required');
    });

    it('should call next with unauthorized error when not authenticated', () => {
      mockReq.session = createMockSession({
        isAuthenticated: false,
        user: {
          role: 'admin',
          authMethod: 'admin',
        },
      });

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = getNextError(mockNext);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Admin access required');
    });

    it('should call next with unauthorized error when session is missing', () => {
      mockReq.session = undefined;

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = getNextError(mockNext);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Admin access required');
    });

    it('should call next with unauthorized error when user object is missing', () => {
      mockReq.session = createMockSession({
        isAuthenticated: true,
      });

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = getNextError(mockNext);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Admin access required');
    });
  });
});


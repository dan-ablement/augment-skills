import { Request, Response, NextFunction } from 'express';
import { unauthorized } from './error.middleware';

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    isAuthenticated: boolean;
    user: {
      id?: string;
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      role: string;
      authMethod: 'admin' | 'google';
    };
  }
}

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  return next(unauthorized('Please log in to access this resource'));
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.isAuthenticated && req.session.user?.role === 'admin') {
    return next();
  }
  
  return next(unauthorized('Admin access required'));
};

export default { requireAuth, requireAdmin };


import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database.config';
import { logger } from '../config/logger.config';
import { unauthorized, forbidden } from './error.middleware';

/**
 * Extend Express Request to include API key information
 */
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        name: string;
        scopes: string[];
      };
    }
  }
}

/**
 * Middleware to authenticate requests using API key from x-api-key header
 * Validates the key against the api_keys table and attaches key info to request
 */
export const requireApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKeyHeader = req.get('x-api-key');

    // Check if API key header is present
    if (!apiKeyHeader) {
      logger.warn('API key request missing x-api-key header', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return next(unauthorized('API key required'));
    }

    // Query the api_keys table to find matching key
    const result = await query(
      `SELECT id, key_hash, name, scopes, is_active, expires_at, last_used_at
       FROM api_keys
       WHERE is_active = true
       ORDER BY created_at DESC`,
      []
    );

    if (!result.rows || result.rows.length === 0) {
      logger.warn('No active API keys found in database');
      return next(unauthorized('Invalid API key'));
    }

    // Find matching key by comparing bcrypt hash
    let matchedKey = null;
    for (const row of result.rows) {
      const isMatch = await bcrypt.compare(apiKeyHeader, row.key_hash);
      if (isMatch) {
        matchedKey = row;
        break;
      }
    }

    if (!matchedKey) {
      logger.warn('API key validation failed - no matching key', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return next(unauthorized('Invalid API key'));
    }

    // Check if key is expired
    if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
      logger.warn('API key expired', {
        keyId: matchedKey.id,
        expiresAt: matchedKey.expires_at,
        path: req.path,
      });
      return next(forbidden('API key has expired'));
    }

    // Update last_used_at timestamp
    try {
      await query(
        'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
        [matchedKey.id]
      );
    } catch (updateError) {
      logger.error('Failed to update api_keys.last_used_at', {
        keyId: matchedKey.id,
        error: updateError,
      });
      // Don't fail the request if we can't update the timestamp
    }

    // Attach API key info to request
    req.apiKey = {
      id: matchedKey.id,
      name: matchedKey.name,
      scopes: matchedKey.scopes || [],
    };

    logger.debug('API key authenticated', {
      keyId: matchedKey.id,
      keyName: matchedKey.name,
      path: req.path,
    });

    return next();
  } catch (error) {
    logger.error('API key authentication error', {
      error,
      path: req.path,
    });
    return next(unauthorized('API key validation failed'));
  }
};

/**
 * Middleware factory to check if authenticated API key has a specific scope
 * Must be used after requireApiKey middleware
 */
export const requireScope = (scope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      logger.warn('requireScope called without authenticated API key', {
        path: req.path,
      });
      return next(unauthorized('API key required'));
    }

    if (!req.apiKey.scopes.includes(scope)) {
      logger.warn('API key missing required scope', {
        keyId: req.apiKey.id,
        requiredScope: scope,
        availableScopes: req.apiKey.scopes,
        path: req.path,
      });
      return next(forbidden(`API key missing required scope: ${scope}`));
    }

    return next();
  };
};

export default { requireApiKey, requireScope };


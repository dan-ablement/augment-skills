import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../middleware/error.middleware';

jest.mock('../../config/database.config', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('../../config/logger.config', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../config/app.config', () => ({ appConfig: { nodeEnv: 'test' } }));

import { requireApiKey, requireScope } from '../../middleware/apikey.middleware';
import { query } from '../../config/database.config';
import bcrypt from 'bcrypt';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const getNextError = (n: jest.MockedFunction<NextFunction>): ApiError =>
  n.mock.calls[0][0] as unknown as ApiError;
const emptyResult = { rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as any;
const makeKeyRow = (overrides = {}) => ({
  id: 'key-uuid', key_hash: '$2b$hash', name: 'dev', scopes: ['validation:write'],
  is_active: true, expires_at: null, last_used_at: null, ...overrides,
});

describe('API Key Middleware', () => {
  let req: Partial<Request>, res: Partial<Response>, next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { get: jest.fn(), path: '/test', method: 'POST', ip: '127.0.0.1' };
    res = {};
    next = jest.fn();
  });

  describe('requireApiKey', () => {
    it('returns 401 when x-api-key header missing', async () => {
      (req.get as jest.Mock).mockReturnValue(undefined);
      await requireApiKey(req as Request, res as Response, next);
      expect(getNextError(next).statusCode).toBe(401);
      expect(getNextError(next).message).toBe('API key required');
    });

    it('returns 401 when no active keys in DB', async () => {
      (req.get as jest.Mock).mockReturnValue('key');
      mockQuery.mockResolvedValue(emptyResult);
      await requireApiKey(req as Request, res as Response, next);
      expect(getNextError(next).statusCode).toBe(401);
    });

    it('returns 401 when bcrypt compare fails for all keys', async () => {
      (req.get as jest.Mock).mockReturnValue('wrong');
      mockQuery.mockResolvedValue({ ...emptyResult, rows: [makeKeyRow()], rowCount: 1 });
      mockCompare.mockResolvedValue(false as never);
      await requireApiKey(req as Request, res as Response, next);
      expect(mockCompare).toHaveBeenCalledWith('wrong', '$2b$hash');
      expect(getNextError(next).statusCode).toBe(401);
    });

    it('authenticates and attaches apiKey on valid key', async () => {
      (req.get as jest.Mock).mockReturnValue('valid');
      mockQuery.mockResolvedValueOnce({ ...emptyResult, rows: [makeKeyRow()], rowCount: 1 })
        .mockResolvedValueOnce(emptyResult);
      mockCompare.mockResolvedValue(true as never);
      await requireApiKey(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.apiKey).toEqual({ id: 'key-uuid', name: 'dev', scopes: ['validation:write'] });
    });

    it('returns 403 when key is expired', async () => {
      (req.get as jest.Mock).mockReturnValue('expired');
      const past = new Date(Date.now() - 86400000).toISOString();
      mockQuery.mockResolvedValue({
        ...emptyResult, rows: [makeKeyRow({ expires_at: past })], rowCount: 1,
      });
      mockCompare.mockResolvedValue(true as never);
      await requireApiKey(req as Request, res as Response, next);
      expect(getNextError(next).statusCode).toBe(403);
      expect(getNextError(next).message).toBe('API key has expired');
    });

    it('updates last_used_at on success', async () => {
      (req.get as jest.Mock).mockReturnValue('valid');
      mockQuery.mockResolvedValueOnce({ ...emptyResult, rows: [makeKeyRow()], rowCount: 1 })
        .mockResolvedValueOnce(emptyResult);
      mockCompare.mockResolvedValue(true as never);
      await requireApiKey(req as Request, res as Response, next);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[1][0]).toContain('UPDATE api_keys SET last_used_at');
    });

    it('still authenticates if last_used_at update fails', async () => {
      (req.get as jest.Mock).mockReturnValue('valid');
      mockQuery.mockResolvedValueOnce({ ...emptyResult, rows: [makeKeyRow()], rowCount: 1 })
        .mockRejectedValueOnce(new Error('DB write failed'));
      mockCompare.mockResolvedValue(true as never);
      await requireApiKey(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('returns 401 on unexpected errors', async () => {
      (req.get as jest.Mock).mockReturnValue('key');
      mockQuery.mockRejectedValue(new Error('connection lost'));
      await requireApiKey(req as Request, res as Response, next);
      expect(getNextError(next).statusCode).toBe(401);
    });
  });

  describe('requireScope', () => {
    it('returns 401 when apiKey not set', () => {
      requireScope('validation:write')(req as Request, res as Response, next);
      expect(getNextError(next).statusCode).toBe(401);
    });

    it('returns 403 when scope missing', () => {
      req.apiKey = { id: '1', name: 'k', scopes: ['skills:read'] };
      requireScope('validation:write')(req as Request, res as Response, next);
      expect(getNextError(next).statusCode).toBe(403);
      expect(getNextError(next).message).toContain('validation:write');
    });

    it('calls next() when scope present', () => {
      req.apiKey = { id: '1', name: 'k', scopes: ['validation:write'] };
      requireScope('validation:write')(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});


import express from 'express';
import request from 'supertest';

// Mock database
jest.mock('../../config/database.config', () => ({
  query: jest.fn(),
  pool: { on: jest.fn() },
}));

// Mock auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => next(),
  requireAdmin: (req: any, res: any, next: any) => next(),
}));

// Mock logger to suppress output
jest.mock('../../config/logger.config', () => ({
  logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

import { query } from '../../config/database.config';
import { errorHandler } from '../../middleware/error.middleware';
import employeeRoutes from '../../routes/employee.routes';

const mockQuery = query as jest.MockedFunction<typeof query>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/employees', employeeRoutes);
  app.use(errorHandler);
  return app;
}

const app = createApp();

beforeEach(() => {
  mockQuery.mockReset();
});

describe('Employee Routes', () => {
  describe('PUT /employees/:id/restore', () => {
    it('should restore an inactive employee', async () => {
      const inactiveEmployee = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        is_active: false,
      };
      const restoredEmployee = { ...inactiveEmployee, is_active: true };

      mockQuery
        .mockResolvedValueOnce({ rows: [inactiveEmployee], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [restoredEmployee], rowCount: 1 } as any);

      const res = await request(app).put('/employees/1/restore');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Employee restored successfully');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should return 400 if employee is already active', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          is_active: true,
        }],
        rowCount: 1,
      } as any);

      const res = await request(app).put('/employees/1/restore');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Employee is already active');
    });

    it('should return 404 if employee is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app).put('/employees/999/restore');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Employee not found');
    });
  });
});


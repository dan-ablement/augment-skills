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
import skillRoutes from '../../routes/skill.routes';

const mockQuery = query as jest.MockedFunction<typeof query>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/skills', skillRoutes);
  app.use(errorHandler);
  return app;
}

const app = createApp();

beforeEach(() => {
  mockQuery.mockReset();
});

describe('Skill Routes', () => {
  describe('GET /skills', () => {
    it('should return only active skills by default', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({
          rows: [
            { id: 1, name: 'TypeScript', category: 'Frontend', is_active: true },
            { id: 2, name: 'React', category: 'Frontend', is_active: true },
          ],
          rowCount: 2,
        } as any);

      const res = await request(app).get('/skills');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      // Verify the count query includes is_active = TRUE filter
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = TRUE');
    });

    it('should return all skills when include_archived=true', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({
          rows: [
            { id: 1, name: 'TypeScript', category: 'Frontend', is_active: true },
            { id: 2, name: 'React', category: 'Frontend', is_active: true },
            { id: 3, name: 'Angular', category: 'Frontend', is_active: false },
          ],
          rowCount: 3,
        } as any);

      const res = await request(app).get('/skills?include_archived=true');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      // Verify the count query does NOT include is_active filter
      expect(mockQuery.mock.calls[0][0]).not.toContain('is_active = TRUE');
    });
  });

  describe('GET /skills/:id', () => {
    it('should return a skill regardless of is_active', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 3, name: 'Angular', category: 'Frontend', is_active: false }],
        rowCount: 1,
      } as any);

      const res = await request(app).get('/skills/3');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(3);
      expect(res.body.data.is_active).toBe(false);
    });

    it('should return 404 if skill does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app).get('/skills/999');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Skill not found');
    });
  });

  describe('GET /skills/categories', () => {
    it('should return only categories from active skills', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ category: 'Backend' }, { category: 'Frontend' }],
        rowCount: 2,
      } as any);

      const res = await request(app).get('/skills/categories');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(['Backend', 'Frontend']);
      // Verify query filters by is_active = TRUE
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = TRUE');
    });
  });

  describe('POST /skills', () => {
    it('should create a skill (is_active defaults to true)', async () => {
      const newSkill = { id: 4, name: 'Go', category: 'Backend', description: 'Go lang', is_active: true };
      mockQuery.mockResolvedValueOnce({ rows: [newSkill], rowCount: 1 } as any);

      const res = await request(app)
        .post('/skills')
        .send({ name: 'Go', category: 'Backend', description: 'Go lang' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Go');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/skills').send({ category: 'Backend' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Skill name is required');
    });

    it('should return 400 for duplicate skill name', async () => {
      const pgError: any = new Error('duplicate key');
      pgError.code = '23505';
      mockQuery.mockRejectedValueOnce(pgError);

      const res = await request(app)
        .post('/skills')
        .send({ name: 'TypeScript', category: 'Frontend' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Skill with this name already exists');
    });
  });

  describe('PUT /skills/:id', () => {
    it('should update a skill', async () => {
      const updatedSkill = { id: 1, name: 'TypeScript 5', category: 'Frontend', is_active: true };
      mockQuery.mockResolvedValueOnce({ rows: [updatedSkill], rowCount: 1 } as any);

      const res = await request(app)
        .put('/skills/1')
        .send({ name: 'TypeScript 5' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('TypeScript 5');
    });

    it('should return 404 if skill does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .put('/skills/999')
        .send({ name: 'Nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Skill not found');
    });
  });

  describe('DELETE /skills/:id', () => {
    it('should soft-delete a skill (set is_active=false, NOT delete row)', async () => {
      const activeSkill = { id: 1, name: 'TypeScript', is_active: true };
      const archivedSkill = { ...activeSkill, is_active: false };
      mockQuery
        .mockResolvedValueOnce({ rows: [activeSkill], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [archivedSkill], rowCount: 1 } as any);

      const res = await request(app).delete('/skills/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Skill archived successfully');
      expect(res.body.data.is_active).toBe(false);
      // Verify it uses UPDATE (soft delete), not DELETE
      const updateCall = mockQuery.mock.calls[1][0];
      expect(updateCall).toContain('UPDATE');
      expect(updateCall).toContain('is_active = false');
      expect(updateCall).not.toContain('DELETE FROM');
    });

    it('should return 404 if skill does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app).delete('/skills/999');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Skill not found');
    });

    it('should return 400 if skill is already archived', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'TypeScript', is_active: false }],
        rowCount: 1,
      } as any);

      const res = await request(app).delete('/skills/1');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Skill is already archived');
    });
  });

  describe('PUT /skills/:id/restore', () => {
    it('should restore an archived skill (set is_active=true)', async () => {
      const archivedSkill = { id: 1, name: 'TypeScript', is_active: false };
      const restoredSkill = { ...archivedSkill, is_active: true };
      mockQuery
        .mockResolvedValueOnce({ rows: [archivedSkill], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [restoredSkill], rowCount: 1 } as any);

      const res = await request(app).put('/skills/1/restore');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Skill restored successfully');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should return 400 if skill is already active', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'TypeScript', is_active: true }],
        rowCount: 1,
      } as any);

      const res = await request(app).put('/skills/1/restore');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Skill is already active');
    });

    it('should return 404 if skill does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app).put('/skills/999/restore');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Skill not found');
    });
  });
});


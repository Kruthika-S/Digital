const app = require('../app');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

jest.mock('../config/db', () => ({
  execute: jest.fn(),
  end: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
}));

const mockedDb = require('../config/db');

const makeToken = (id) => jwt.sign({ sub: id }, env.jwt.secret, { expiresIn: '1h' });

const adminToken = makeToken(1);
const memberToken = makeToken(2);

const adminUser = { id: 1, name: 'Admin', email: 'admin@dh.com', role: 'admin' };
const memberUser = { id: 2, name: 'Member', email: 'member@dh.com', role: 'member' };

const mockLead = {
  id: 1, name: 'Lead', company: 'Corp', email: 'l@c.com',
  phone: '123', source: 'Web', status: 'New', assigned_user_id: 2,
  assigned_user_name: 'Member', created_at: new Date(), updated_at: new Date()
};

describe('Authorization / Role-Based Access Control', () => {
  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────
  //  Member CANNOT delete leads
  // ──────────────────────────────────────────────
  describe('DELETE /api/leads/:id (admin only)', () => {
    it('member should receive 403 when trying to delete a lead', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .delete('/api/leads/1')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('admin should be able to delete a lead', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[mockLead]]);
        }
        if (query.includes('DELETE FROM leads')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        }
        if (query.includes('INSERT INTO activities')) {
          return Promise.resolve([{ insertId: 1 }]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .delete('/api/leads/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);
    });
  });

  // ──────────────────────────────────────────────
  //  Member CANNOT assign leads
  // ──────────────────────────────────────────────
  describe('POST /api/leads/:id/assign (admin only)', () => {
    it('member should receive 403 when trying to assign a lead', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .post('/api/leads/1/assign')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ assigned_user_id: 1 });

      expect(res.statusCode).toEqual(403);
    });

    it('admin should be able to assign a lead', async () => {
      const assignedLead = { ...mockLead, assigned_user_id: 2 };

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[assignedLead]]);
        }
        if (query.includes('UPDATE leads')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        }
        if (query.includes('INSERT INTO activities')) {
          return Promise.resolve([{ insertId: 1 }]);
        }
        if (query.includes('FROM notes')) return Promise.resolve([[]]); 
        if (query.includes('FROM activities')) return Promise.resolve([[]]); 
        return Promise.resolve([[assignedLead]]); 
      });

      const res = await request(app)
        .post('/api/leads/1/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigned_user_id: 2 });

      expect(res.statusCode).toEqual(200);
    });
  });

  // ──────────────────────────────────────────────
  //  Member CANNOT create users
  // ──────────────────────────────────────────────
  describe('POST /api/users (admin only)', () => {
    it('member should receive 403 when trying to create a user', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'New User', email: 'new@test.com', password: 'pass123', role: 'member' });

      expect(res.statusCode).toEqual(403);
    });

    it('unauthenticated user should receive 401 when trying to create a user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'New User', email: 'new@test.com', password: 'pass123' });

      expect(res.statusCode).toEqual(401);
    });

    it('admin should be able to create a user', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('SELECT * FROM users WHERE email')) {
          return Promise.resolve([[]]); // email not taken
        }
        if (query.includes('INSERT INTO users')) {
          return Promise.resolve([{ insertId: 3 }]);
        }
        if (query.includes('INSERT INTO activities')) {
          return Promise.resolve([{ insertId: 1 }]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Member', email: 'newmember@dh.com', password: 'password123', role: 'member' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 3);
    });
  });

  // ──────────────────────────────────────────────
  //  Member CANNOT list users
  // ──────────────────────────────────────────────
  describe('GET /api/users (admin only)', () => {
    it('member should receive 403 when trying to list users', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('admin should be able to list users', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('SELECT id, name, email, role, created_at, updated_at FROM users')) {
          return Promise.resolve([[adminUser, memberUser]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  //  Unauthenticated cannot access any protected route
  // ──────────────────────────────────────────────
  describe('Authentication Guard', () => {
    it('should reject GET /api/leads without token', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.statusCode).toEqual(401);
    });

    it('should reject GET /api/users without token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toEqual(401);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.statusCode).toEqual(401);
    });
  });
});

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

// Helper: generate valid JWT tokens
const makeToken = (id, role) =>
  jwt.sign({ sub: id }, env.jwt.secret, { expiresIn: '1h' });

const adminToken = makeToken(1, 'admin');
const memberToken = makeToken(2, 'member');

const adminUser = { id: 1, name: 'Admin', email: 'admin@digitalheroes.com', role: 'admin' };
const memberUser = { id: 2, name: 'Member', email: 'member@digitalheroes.com', role: 'member' };

// Mock DB responses
const mockLead = {
  id: 1,
  name: 'Test Lead',
  company: 'Test Corp',
  email: 'test@example.com',
  phone: '1234567890',
  source: 'Website',
  status: 'New',
  assigned_user_id: 2,
  assigned_user_name: 'Member',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Reusable mock: auth lookup + activity insert + lead query
const mockAuthAs = (user) => {
  mockedDb.execute.mockImplementation((query) => {
    if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
      return Promise.resolve([[user]]);
    }
    return Promise.resolve([[]]); // default empty
  });
};

describe('Lead Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  //  PUBLIC: Lead Capture
  // ──────────────────────────────────────────────
  describe('POST /api/leads/capture (public)', () => {
    it('should create a lead via public capture form', async () => {
      mockedDb.execute
        .mockResolvedValueOnce([{ insertId: 1 }])  // Lead INSERT
        .mockResolvedValueOnce([{ insertId: 1 }]);  // Activity INSERT

      const res = await request(app)
        .post('/api/leads/capture')
        .send({
          name: 'Test Lead',
          company: 'Test Corp',
          email: 'test@example.com',
          phone: '1234567890',
          source: 'Website'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body.message).toBe('Lead created successfully');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/leads/capture')
        .send({ name: 'Only Name' }); // missing company, email

      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 for invalid email in capture form', async () => {
      const res = await request(app)
        .post('/api/leads/capture')
        .send({ name: 'Test', company: 'Corp', email: 'not-an-email' });

      expect(res.statusCode).toEqual(400);
    });
  });

  // ──────────────────────────────────────────────
  //  Auth guard
  // ──────────────────────────────────────────────
  describe('GET /api/leads (auth guard)', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.statusCode).toEqual(401);
    });
  });

  // ──────────────────────────────────────────────
  //  GET /api/leads (admin - see all)
  // ──────────────────────────────────────────────
  describe('GET /api/leads (admin)', () => {
    it('admin should get paginated leads list', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('COUNT(*)')) {
          return Promise.resolve([[{ total: 1 }]]);
        }
        if (query.includes('SELECT l.*')) {
          return Promise.resolve([[mockLead]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('leads');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('admin should be able to filter leads by status', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('COUNT(*)')) return Promise.resolve([[{ total: 0 }]]);
        if (query.includes('SELECT l.*')) return Promise.resolve([[]]); 
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/leads?status=Won')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
    });
  });

  // ──────────────────────────────────────────────
  //  GET /api/leads/:id
  // ──────────────────────────────────────────────
  describe('GET /api/leads/:id', () => {
    it('admin should get lead by id with notes and activities', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[mockLead]]);
        }
        if (query.includes('FROM notes')) {
          return Promise.resolve([[{ id: 1, message: 'Test note', author_name: 'Member', created_at: new Date() }]]);
        }
        if (query.includes('FROM activities')) {
          return Promise.resolve([[{ id: 1, action: 'Lead Created via Public Form', created_at: new Date() }]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/leads/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('notes');
      expect(res.body).toHaveProperty('activities');
    });

    it('should return 404 for non-existent lead', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        return Promise.resolve([[]]); // lead not found
      });

      const res = await request(app)
        .get('/api/leads/9999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
    });

    it('member should not see leads not assigned to them', async () => {
      const unassignedLead = { ...mockLead, assigned_user_id: 99 }; // assigned to someone else

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[unassignedLead]]);
        }
        if (query.includes('FROM notes')) return Promise.resolve([[]]); 
        if (query.includes('FROM activities')) return Promise.resolve([[]]); 
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/leads/1')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  // ──────────────────────────────────────────────
  //  PUT /api/leads/:id (update / status)
  // ──────────────────────────────────────────────
  describe('PUT /api/leads/:id (status update)', () => {
    it('member should be able to update status of their assigned lead', async () => {
      const updatedLead = { ...mockLead, status: 'Contacted' };

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[mockLead]]); // first fetch
        }
        if (query.includes('UPDATE leads')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        }
        if (query.includes('INSERT INTO activities')) {
          return Promise.resolve([{ insertId: 5 }]);
        }
        if (query.includes('FROM notes')) return Promise.resolve([[]]); 
        if (query.includes('FROM activities')) return Promise.resolve([[]]); 
        return Promise.resolve([[updatedLead]]); 
      });

      const res = await request(app)
        .put('/api/leads/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ status: 'Contacted' });

      expect(res.statusCode).toEqual(200);
    });

    it('member cannot update a lead not assigned to them', async () => {
      const unassignedLead = { ...mockLead, assigned_user_id: 99 };

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[unassignedLead]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .put('/api/leads/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ status: 'Won' });

      expect(res.statusCode).toEqual(403);
    });
  });

  // ──────────────────────────────────────────────
  //  POST /api/leads/:id/notes
  // ──────────────────────────────────────────────
  describe('POST /api/leads/:id/notes', () => {
    it('member should be able to add a note to their assigned lead', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        if (query.includes('FROM leads l') && query.includes('WHERE l.id')) {
          return Promise.resolve([[mockLead]]);
        }
        if (query.includes('INSERT INTO notes')) {
          return Promise.resolve([{ insertId: 10 }]);
        }
        if (query.includes('INSERT INTO activities')) {
          return Promise.resolve([{ insertId: 5 }]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .post('/api/leads/1/notes')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ message: 'This is a test note' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Note added successfully');
    });

    it('should return 400 if note message is empty', async () => {
      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[memberUser]]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .post('/api/leads/1/notes')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ message: '' });

      expect(res.statusCode).toEqual(400);
    });
  });

  // ──────────────────────────────────────────────
  //  GET /api/leads/:id/activities
  // ──────────────────────────────────────────────
  describe('GET /api/leads/:id/activities', () => {
    it('admin should get activity trail for a lead', async () => {
      const activities = [
        { id: 1, action: 'Lead Created via Public Form', user_name: null, created_at: new Date() },
        { id: 2, action: 'Lead Assigned', user_name: 'Admin', created_at: new Date() }
      ];

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('SELECT id, name, email, role FROM users WHERE id')) {
          return Promise.resolve([[adminUser]]);
        }
        if (query.includes('FROM activities') && query.includes('WHERE a.target_type')) {
          return Promise.resolve([activities]);
        }
        return Promise.resolve([[]]); 
      });

      const res = await request(app)
        .get('/api/leads/1/activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('activities');
      expect(Array.isArray(res.body.activities)).toBe(true);
    });
  });
});

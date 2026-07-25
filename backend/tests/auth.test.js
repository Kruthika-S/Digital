const app = require('../app');
const request = require('supertest');
const bcrypt = require('bcrypt');

jest.mock('../config/db', () => ({
  execute: jest.fn(),
  end: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
}));

const mockedDb = require('../config/db');

const createHash = async (pw) => bcrypt.hash(pw, 10);

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login admin successfully and return token', async () => {
      const hash = await createHash('password123');

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('INSERT INTO activities')) return Promise.resolve([{ insertId: 1 }]);
        return Promise.resolve([[{ id: 1, name: 'Admin User', email: 'admin@digitalheroes.com', password: hash, role: 'admin' }]]);
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@digitalheroes.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.role).toBe('admin');
    });

    it('should login member successfully and return token', async () => {
      const hash = await createHash('password123');

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('INSERT INTO activities')) return Promise.resolve([{ insertId: 1 }]);
        return Promise.resolve([[{ id: 2, name: 'Member User', email: 'member@digitalheroes.com', password: hash, role: 'member' }]]);
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'member@digitalheroes.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('member');
    });

    it('should fail login with wrong password', async () => {
      const hash = await createHash('password123');

      mockedDb.execute.mockImplementation((query) => {
        if (query.includes('INSERT INTO activities')) return Promise.resolve([{ insertId: 1 }]);
        return Promise.resolve([[{ id: 1, email: 'admin@digitalheroes.com', password: hash, role: 'admin' }]]);
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@digitalheroes.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
    });

    it('should fail login with non-existent user', async () => {
      mockedDb.execute.mockResolvedValue([[]]); // no user found

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
    });
  });
});

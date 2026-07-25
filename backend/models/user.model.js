const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(userData) {
    const { name, email, password, role } = userData;
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'member']
    );
    return result.insertId;
  }
  
  static async findAll() {
    const [rows] = await db.execute('SELECT id, name, email, role, created_at, updated_at FROM users');
    return rows;
  }
}

module.exports = UserModel;

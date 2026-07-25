const db = require('../config/db');

class LeadModel {
  static async create(leadData) {
    const { name, company, email, phone, source } = leadData;
    const [result] = await db.execute(
      'INSERT INTO leads (name, company, email, phone, source) VALUES (?, ?, ?, ?, ?)',
      [name, company, email, phone, source]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT l.*, u.name as assigned_user_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_user_id = u.id 
      WHERE l.id = ?
    `, [id]);
    return rows[0];
  }

  static async update(id, updateData) {
    const keys = Object.keys(updateData);
    if (keys.length === 0) return 0;

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);

    const [result] = await db.execute(`UPDATE leads SET ${setClause} WHERE id = ?`, values);
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM leads WHERE id = ?', [id]);
    return result.affectedRows;
  }

  static async findAll(filters = {}, limit = 10, offset = 0) {
    // Use safe integer values inline to avoid mysql2 prepared-statement
    // LIMIT/OFFSET type-coercion bug ("Incorrect arguments to mysqld_stmt_execute")
    const safeLimit  = Math.max(1, parseInt(limit,  10) || 10);
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    let query = `
      SELECT l.*, u.name as assigned_user_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_user_id = u.id 
      WHERE 1=1
    `;
    const values = [];

    if (filters.status) {
      query += ' AND l.status = ?';
      values.push(filters.status);
    }
    if (filters.assigned_user_id) {
      query += ' AND l.assigned_user_id = ?';
      values.push(parseInt(filters.assigned_user_id, 10));
    }
    if (filters.search) {
      query += ' AND (l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)';
      values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Inline LIMIT/OFFSET as integer literals — avoids mysql2 prepared-statement issues
    query += ` ORDER BY l.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [rows] = await db.query(query, values);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM leads l WHERE 1=1';
    const countValues = [];
    if (filters.status) {
      countQuery += ' AND l.status = ?';
      countValues.push(filters.status);
    }
    if (filters.assigned_user_id) {
      countQuery += ' AND l.assigned_user_id = ?';
      countValues.push(parseInt(filters.assigned_user_id, 10));
    }
    if (filters.search) {
      countQuery += ' AND (l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)';
      countValues.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const [countRows] = await db.query(countQuery, countValues);

    return {
      leads: rows,
      total: countRows[0].total
    };
  }
}

module.exports = LeadModel;

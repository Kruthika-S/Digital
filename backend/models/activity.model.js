const db = require('../config/db');

class ActivityModel {
  static async log(userId, action, targetType, targetId, details = null) {
    const [result] = await db.execute(
      'INSERT INTO activities (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
    return result.insertId;
  }

  static async getRecent(limit = 50) {
    const [rows] = await db.execute(`
      SELECT a.*, u.name as user_name 
      FROM activities a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC LIMIT ?
    `, [parseInt(limit, 10)]);
    return rows;
  }

  static async getByLeadId(leadId) {
    const [rows] = await db.execute(`
      SELECT a.*, u.name as user_name 
      FROM activities a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.target_type = 'lead' AND a.target_id = ?
      ORDER BY a.created_at DESC
    `, [leadId]);
    return rows;
  }
}

module.exports = ActivityModel;

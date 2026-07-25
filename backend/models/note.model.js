const db = require('../config/db');

class NoteModel {
  static async create(noteData) {
    const { lead_id, author_id, message } = noteData;
    const [result] = await db.execute(
      'INSERT INTO notes (lead_id, author_id, message) VALUES (?, ?, ?)',
      [lead_id, author_id, message]
    );
    return result.insertId;
  }

  static async findByLeadId(leadId) {
    const [rows] = await db.execute(`
      SELECT n.*, u.name as author_name 
      FROM notes n 
      JOIN users u ON n.author_id = u.id 
      WHERE n.lead_id = ? 
      ORDER BY n.created_at DESC
    `, [leadId]);
    return rows;
  }
}

module.exports = NoteModel;

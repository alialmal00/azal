// models/Session.js
const db = require('../config/db');

class Session {
  // ایجاد نشست جدید
  static async create(userId, token, ipAddress, userAgent) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 روز اعتبار
    
    const query = `
      INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, token, expires_at
    `;
    
    const values = [userId, token, ipAddress, userAgent, expiresAt];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // یافتن نشست با توکن
  static async findByToken(token) {
    const query = `
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.role_selected
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP
    `;
    const result = await db.query(query, [token]);
    return result.rows[0];
  }

  // حذف نشست (خروج)
  static async delete(token) {
    const query = 'DELETE FROM sessions WHERE token = $1';
    await db.query(query, [token]);
    return true;
  }
}

module.exports = Session;
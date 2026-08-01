// models/ContactMessage.js
const db = require('../config/db');

class ContactMessage {
  static async create(name, email, subject, message, ipAddress, userAgent) {
    const query = `
      INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at
    `;
    
    const values = [name, email, subject || '', message, ipAddress, userAgent];
    
    try {
      const result = await db.query(query, values);
      console.log('✅ Message saved with ID:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving contact message:', error);
      throw error;
    }
  }

  static async getAll(limit = 50) {
    const query = `
      SELECT id, name, email, subject, message, is_read, created_at
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = ContactMessage;
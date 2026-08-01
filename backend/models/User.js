// models/User.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { name, phone, password, role = 'student' } = userData;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const query = `
            INSERT INTO users (name, phone, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, phone, role, role_selected, created_at
        `;
        
        const values = [name, phone, hashedPassword, role];
        
        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByPhone(phone) {
        const query = 'SELECT * FROM users WHERE phone = $1';
        const result = await db.query(query, [phone]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT id, name, phone, role, role_selected, avatar, 
                   is_active, last_login, created_at
            FROM users WHERE id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async updateLastLogin(id) {
        const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
        await db.query(query, [id]);
    }

    static async updateRole(id, role) {
        const query = `
            UPDATE users 
            SET role = $1, role_selected = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, phone, role, role_selected
        `;
        const result = await db.query(query, [role, id]);
        return result.rows[0];
    }
}

module.exports = User;
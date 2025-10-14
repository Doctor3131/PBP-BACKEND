const pool = require('../../utils/config/database')
const { ConflictError } = require('../utils/error.util')

const findByEmail = async (email) => {
  const query = 'SELECT id, name, email, password_hash, role FROM users WHERE email = $1'
  const { rows } = await pool.query(query, [email])

  return rows[0]
}

const create = async ({ name, email, passwordHash, role = 'customer' }) => {
  try {
    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `
    const { rows } = await pool.query(query, [name, email, passwordHash, role])

    return rows[0]
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('Email already registered')
    }

    throw error
  }
}

const findById = async (id) => {
  const query = 'SELECT id, name, email, role, created_at FROM users WHERE id = $1'
  const { rows } = await pool.query(query, [id])

  return rows[0]
}

module.exports = { findByEmail, create, findById }

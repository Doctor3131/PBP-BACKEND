const pool = require('../../utils/config/database')

const findAll = async () => {
  const query = 'SELECT * FROM categories ORDER BY name ASC'
  const result = await pool.query(query)

  return result.rows
}

const findById = async (categoryId) => {
  const query = 'SELECT * FROM categories WHERE id = $1'
  const result = await pool.query(query, [categoryId])

  return result.rows[0] || null
}

const create = async (name) => {
  const query = `
    INSERT INTO categories (name)
    VALUES ($1)
    RETURNING *
  `
  const result = await pool.query(query, [name])

  return result.rows[0]
}

const update = async (categoryId, name) => {
  const query = `
    UPDATE categories 
    SET name = $1
    WHERE id = $2
    RETURNING *
  `
  const result = await pool.query(query, [name, categoryId])

  return result.rows[0]
}

const deleteById = async (categoryId) => {
  const query = 'DELETE FROM categories WHERE id = $1'

  await pool.query(query, [categoryId])
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById,
}

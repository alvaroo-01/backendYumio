import pool from '../config/db.js'
import { nameToSlug } from './catalog.model.js'

export async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
  return rows[0] ?? null
}

export async function findUserByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username])
  return rows[0] ?? null
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.country_id, u.is_vegetarian, u.is_vegan,
            u.created_at, p.name AS country_name
     FROM users u
     LEFT JOIN paises p ON p.id = u.country_id
     WHERE u.id = ? LIMIT 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function createUser({ username, email, passwordHash, countryId, isVegetarian, isVegan }) {
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password_hash, country_id, is_vegetarian, is_vegan)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, countryId ?? null, isVegetarian, isVegan],
  )
  return result.insertId
}

export async function setUserAllergens(userId, allergenIds) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM user_allergens WHERE user_id = ?', [userId])
    if (allergenIds.length > 0) {
      const values = allergenIds.map((aid) => [userId, aid])
      await conn.query('INSERT IGNORE INTO user_allergens (user_id, allergen_id) VALUES ?', [values])
    }
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function getUserAllergens(userId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.name
     FROM user_allergens ua
     JOIN allergens a ON a.id = ua.allergen_id
     WHERE ua.user_id = ?`,
    [userId],
  )
  return rows.map((r) => ({ ...r, slug: nameToSlug(r.name) }))
}

export async function getAllAllergens() {
  const [rows] = await pool.query('SELECT id, name FROM allergens ORDER BY id ASC')
  return rows
}

export async function updateUser(userId, { username, email, passwordHash, countryId, isVegetarian, isVegan }) {
  const setClauses = ['username = ?', 'email = ?', 'country_id = ?', 'is_vegetarian = ?', 'is_vegan = ?']
  const params = [username, email, countryId ?? null, isVegetarian ? 1 : 0, isVegan ? 1 : 0]

  if (passwordHash) {
    setClauses.push('password_hash = ?')
    params.push(passwordHash)
  }

  params.push(userId)
  await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, params)
}

export async function deleteUserById(userId) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ? LIMIT 1', [userId])
  return Number(result?.affectedRows ?? 0) > 0
}

export async function findUserByEmailExcluding(email, excludeUserId) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
    [email, excludeUserId],
  )
  return rows[0] ?? null
}

export async function findUserByUsernameExcluding(username, excludeUserId) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
    [username, excludeUserId],
  )
  return rows[0] ?? null
}

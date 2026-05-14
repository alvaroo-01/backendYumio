import pool from '../config/db.js'

export async function sendFriendRequest(requesterId, addresseeId) {
  await pool.query(
    `INSERT INTO user_friendships (requester_user_id, addressee_user_id, status)
     VALUES (?, ?, 'pending')`,
    [requesterId, addresseeId],
  )
}

export async function getFriendshipBetween(userA, userB) {
  const [rows] = await pool.query(
    `SELECT * FROM user_friendships
     WHERE (requester_user_id = ? AND addressee_user_id = ?)
        OR (requester_user_id = ? AND addressee_user_id = ?)
     LIMIT 1`,
    [userA, userB, userB, userA],
  )
  return rows[0] ?? null
}

export async function updateFriendshipStatus(id, status) {
  await pool.query('UPDATE user_friendships SET status = ? WHERE id = ?', [status, id])
}

export async function blockFriendship(id, blockerUserId) {
  await pool.query(
    'UPDATE user_friendships SET status = ?, blocked_by_user_id = ? WHERE id = ?',
    ['blocked', blockerUserId, id],
  )
}

export async function unblockFriendship(id, requestingUserId) {
  const [result] = await pool.query(
    `UPDATE user_friendships
     SET status = 'pending', blocked_by_user_id = NULL
     WHERE id = ? AND blocked_by_user_id = ?`,
    [id, requestingUserId],
  )
  return result.affectedRows > 0
}

export async function getFriends(userId) {
  const [rows] = await pool.query(
    `SELECT
       uf.id AS friendship_id, uf.status, uf.created_at,
       u.id AS friend_id, u.username AS friend_username, u.email AS friend_email
     FROM user_friendships uf
     JOIN users u
       ON u.id = CASE
                   WHEN uf.requester_user_id = ? THEN uf.addressee_user_id
                   ELSE uf.requester_user_id
                 END
     WHERE (uf.requester_user_id = ? OR uf.addressee_user_id = ?)
       AND uf.status = 'accepted'`,
    [userId, userId, userId],
  )
  return rows
}

export async function getPendingRequests(userId) {
  const [rows] = await pool.query(
    `SELECT uf.id AS friendship_id, uf.created_at,
            u.id AS requester_id, u.username AS requester_username
     FROM user_friendships uf
     JOIN users u ON u.id = uf.requester_user_id
     WHERE uf.addressee_user_id = ? AND uf.status = 'pending'`,
    [userId],
  )
  return rows
}

export async function getBlockedUsers(userId) {
  const [rows] = await pool.query(
    `SELECT
       uf.id AS friendship_id,
       uf.created_at,
       u.id AS blocked_user_id,
       u.username AS blocked_username
     FROM user_friendships uf
     JOIN users u
       ON u.id = CASE
                   WHEN uf.requester_user_id = ? THEN uf.addressee_user_id
                   ELSE uf.requester_user_id
                 END
     WHERE (uf.requester_user_id = ? OR uf.addressee_user_id = ?)
       AND uf.status = 'blocked'
       AND uf.blocked_by_user_id = ?
     ORDER BY u.username ASC`,
    [userId, userId, userId, userId],
  )

  return rows
}

export async function searchUsersForFriendship(userId, query, limit = 15) {
  const like = `%${String(query ?? '').trim()}%`
  const safeLimit = Math.min(30, Math.max(1, Number(limit) || 15))

  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.username,
       uf.id AS friendship_id,
       uf.status AS friendship_status,
       uf.requester_user_id,
       uf.addressee_user_id
     FROM users u
     LEFT JOIN user_friendships uf
       ON (
         (uf.requester_user_id = ? AND uf.addressee_user_id = u.id)
         OR
         (uf.requester_user_id = u.id AND uf.addressee_user_id = ?)
       )
     WHERE u.id <> ?
       AND u.username LIKE ?
     ORDER BY u.username ASC
     LIMIT ?`,
    [userId, userId, userId, like, safeLimit],
  )

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    friendshipId: row.friendship_id ?? null,
    friendshipStatus: row.friendship_status ?? 'none',
    direction:
      row.friendship_id == null
        ? null
        : (row.requester_user_id === userId ? 'outgoing' : 'incoming'),
  }))
}

export async function deleteFriendship(id) {
  await pool.query('DELETE FROM user_friendships WHERE id = ?', [id])
}

// ─── Compartir recetas entre amigos ──────────────────────────────────────────

/**
 * Envía una receta a un amigo concreto.
 * Devuelve el ID del share creado.
 */
export async function shareRecipeWithFriend(senderId, recipientId, recipeId, message) {
  const [result] = await pool.query(
    `INSERT INTO friend_recipe_shares (sender_id, recipient_id, recipe_id, message)
     VALUES (?, ?, ?, ?)`,
    [senderId, recipientId, recipeId, message ?? null],
  )
  return result.insertId
}

/**
 * Envía una receta a TODOS los amigos aceptados del remitente.
 * Devuelve el número de envíos realizados.
 */
export async function shareRecipeWithAllFriends(senderId, recipeId, message) {
  // Obtener todos los amigos aceptados
  const [friends] = await pool.query(
    `SELECT
       CASE
         WHEN uf.requester_user_id = ? THEN uf.addressee_user_id
         ELSE uf.requester_user_id
       END AS friend_id
     FROM user_friendships uf
     WHERE (uf.requester_user_id = ? OR uf.addressee_user_id = ?)
       AND uf.status = 'accepted'`,
    [senderId, senderId, senderId],
  )

  if (friends.length === 0) return 0

  const values = friends.map((f) => [senderId, f.friend_id, recipeId, message ?? null])
  await pool.query(
    `INSERT INTO friend_recipe_shares (sender_id, recipient_id, recipe_id, message)
     VALUES ?`,
    [values],
  )
  return friends.length
}

/**
 * Recetas recibidas por el usuario (enviadas por sus amigos).
 * Devuelve items con datos del remitente y de la receta.
 */
export async function getReceivedShares(userId) {
  const [rows] = await pool.query(
    `SELECT
       frs.id          AS share_id,
       frs.message,
       frs.read_at,
       frs.created_at  AS sent_at,
       u.id            AS sender_id,
       u.username      AS sender_username,
       r.id            AS recipe_id,
       r.name          AS recipe_title,
       r.description   AS recipe_description,
       r.photo         AS recipe_photo,
       dt.name         AS recipe_dish_type
     FROM friend_recipe_shares frs
     JOIN users u    ON u.id  = frs.sender_id
     JOIN recipes r  ON r.id  = frs.recipe_id
     LEFT JOIN dish_types dt ON dt.id = r.dish_type_id
     WHERE frs.recipient_id = ?
     ORDER BY frs.created_at DESC`,
    [userId],
  )
  return rows
}

/**
 * Recetas enviadas por el usuario a sus amigos.
 */
export async function getSentShares(userId) {
  const [rows] = await pool.query(
    `SELECT
       frs.id          AS share_id,
       frs.message,
       frs.read_at,
       frs.created_at  AS sent_at,
       u.id            AS recipient_id,
       u.username      AS recipient_username,
       r.id            AS recipe_id,
       r.name          AS recipe_title,
       r.photo         AS recipe_photo
     FROM friend_recipe_shares frs
     JOIN users u    ON u.id  = frs.recipient_id
     JOIN recipes r  ON r.id  = frs.recipe_id
     WHERE frs.sender_id = ?
     ORDER BY frs.created_at DESC`,
    [userId],
  )
  return rows
}

/**
 * Marca un share recibido como leído.
 * Solo el destinatario puede marcarlo.
 */
export async function markShareAsRead(shareId, userId) {
  await pool.query(
    `UPDATE friend_recipe_shares
     SET read_at = NOW()
     WHERE id = ? AND recipient_id = ? AND read_at IS NULL`,
    [shareId, userId],
  )
}

/**
 * Número de shares recibidos no leídos (para el badge de notificaciones).
 */
export async function getUnreadShareCount(userId) {
  const [[{ count }]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM friend_recipe_shares
     WHERE recipient_id = ? AND read_at IS NULL`,
    [userId],
  )
  return Number(count)
}
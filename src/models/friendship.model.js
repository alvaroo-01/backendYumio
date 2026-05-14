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
     ORDER BY u.username ASC`,
    [userId, userId, userId],
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

export async function getFriendshipById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM user_friendships WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}
import {
  sendFriendRequest,
  getFriendshipBetween,
  updateFriendshipStatus,
  getFriends,
  getPendingRequests,
  getBlockedUsers,
  searchUsersForFriendship,
  deleteFriendship,
} from '../models/friendship.model.js'
import { findUserByUsername, findUserById } from '../models/user.model.js'
import { ok, created, noContent, badRequest, forbidden, notFound, conflict, serverError } from '../utils/response.js'

// GET /friends
export async function list(req, res) {
  try {
    const friends = await getFriends(req.user.id)
    return ok(res, { friends })
  } catch (err) {
    console.error('[friends.list]', err)
    return serverError(res)
  }
}

// GET /friends/pending
export async function pending(req, res) {
  try {
    const requests = await getPendingRequests(req.user.id)
    return ok(res, { requests })
  } catch (err) {
    console.error('[friends.pending]', err)
    return serverError(res)
  }
}

// GET /friends/blocked
export async function blocked(req, res) {
  try {
    const users = await getBlockedUsers(req.user.id)
    return ok(res, { blocked: users })
  } catch (err) {
    console.error('[friends.blocked]', err)
    return serverError(res)
  }
}

// GET /friends/search?q=username
export async function search(req, res) {
  try {
    const q = String(req.query.q ?? '').trim()
    if (!q) {
      return ok(res, { users: [] })
    }

    const users = await searchUsersForFriendship(req.user.id, q, req.query.limit)
    return ok(res, { users })
  } catch (err) {
    console.error('[friends.search]', err)
    return serverError(res)
  }
}

// POST /friends/request
export async function request(req, res) {
  try {
    const { username } = req.body
    if (!username) return badRequest(res, 'El campo username es obligatorio.')

    const addressee = await findUserByUsername(username.trim())
    if (!addressee) return notFound(res, 'Usuario no encontrado.')
    if (addressee.id === req.user.id) return badRequest(res, 'No puedes enviarte una solicitud a ti mismo.')

    const existing = await getFriendshipBetween(req.user.id, addressee.id)
    if (existing) {
      if (existing.status === 'accepted') return conflict(res, 'Ya sois amigos.')
      if (existing.status === 'pending') return conflict(res, 'Ya existe una solicitud de amistad pendiente.')
      if (existing.status === 'blocked') return forbidden(res, 'No es posible enviar la solicitud.')
    }

    await sendFriendRequest(req.user.id, addressee.id)
    return created(res, { message: `Solicitud de amistad enviada a ${addressee.username}.` })
  } catch (err) {
    console.error('[friends.request]', err)
    return serverError(res)
  }
}

// PATCH /friends/:friendshipId/accept
export async function accept(req, res) {
  try {
    const friendship = await getFriendshipById(req.params.friendshipId)
    if (!friendship) return notFound(res, 'Solicitud no encontrada.')
    if (friendship.addressee_user_id !== req.user.id) return forbidden(res)
    if (friendship.status !== 'pending') return badRequest(res, 'La solicitud no está en estado pendiente.')

    await updateFriendshipStatus(friendship.id, 'accepted')
    return ok(res, { message: 'Solicitud de amistad aceptada.' })
  } catch (err) {
    console.error('[friends.accept]', err)
    return serverError(res)
  }
}

// PATCH /friends/:friendshipId/block
export async function block(req, res) {
  try {
    const friendship = await getFriendshipById(req.params.friendshipId)
    if (!friendship) return notFound(res, 'Solicitud no encontrada.')
    const isInvolved = friendship.requester_user_id === req.user.id || friendship.addressee_user_id === req.user.id
    if (!isInvolved) return forbidden(res)

    await updateFriendshipStatus(friendship.id, 'blocked')
    return ok(res, { message: 'Usuario bloqueado.' })
  } catch (err) {
    console.error('[friends.block]', err)
    return serverError(res)
  }
}

// DELETE /friends/:friendshipId
export async function remove(req, res) {
  try {
    const friendship = await getFriendshipById(req.params.friendshipId)
    if (!friendship) return notFound(res, 'Relación no encontrada.')
    const isInvolved = friendship.requester_user_id === req.user.id || friendship.addressee_user_id === req.user.id
    if (!isInvolved) return forbidden(res)

    await deleteFriendship(friendship.id)
    return noContent(res)
  } catch (err) {
    console.error('[friends.remove]', err)
    return serverError(res)
  }
}

// ── helper local ──────────────────────────────────────────────────────────────
import pool from '../config/db.js'

async function getFriendshipById(id) {
  const [rows] = await pool.query('SELECT * FROM user_friendships WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

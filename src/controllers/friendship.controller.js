import {
  sendFriendRequest,
  getFriendshipBetween,
  updateFriendshipStatus,
  getFriends,
  getPendingRequests,
  getBlockedUsers,
  searchUsersForFriendship,
  deleteFriendship,
  getFriendshipById,
  shareRecipeWithFriend,
  shareRecipeWithAllFriends,
  getReceivedShares,
  getSentShares,
  markShareAsRead,
  getUnreadShareCount,
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


// ─── Compartir recetas entre amigos ──────────────────────────────────────────

// POST /friends/:friendId/share-recipe
// Comparte una receta con un amigo concreto
export async function shareRecipeWithOne(req, res) {
  try {
    const friendId = Number(req.params.friendId)
    const recipeId = Number(req.body.recipe_id)
    const message  = req.body.message ? String(req.body.message).trim() : null

    if (!Number.isInteger(friendId) || friendId <= 0) return badRequest(res, 'ID de amigo no válido.')
    if (!Number.isInteger(recipeId) || recipeId <= 0) return badRequest(res, 'ID de receta no válido.')

    // Verificar que son amigos
    const friendship = await getFriendshipBetween(req.user.id, friendId)
    if (!friendship || friendship.status !== 'accepted') {
      return forbidden(res, 'Solo puedes compartir recetas con tus amigos.')
    }

    // Verificar que la receta existe y el usuario tiene acceso a ella
    const [rows] = await pool.query(
      'SELECT id, user_id, is_public FROM recipes WHERE id = ? LIMIT 1',
      [recipeId],
    )
    if (!rows[0]) return notFound(res, 'Receta no encontrada.')
    if (!rows[0].is_public && rows[0].user_id !== req.user.id) {
      return forbidden(res, 'No puedes compartir una receta privada que no es tuya.')
    }

    const shareId = await shareRecipeWithFriend(req.user.id, friendId, recipeId, message)
    return created(res, {
      message: 'Receta compartida correctamente.',
      shareId,
    })
  } catch (err) {
    console.error('[friends.shareRecipeWithOne]', err)
    return serverError(res)
  }
}

// POST /friends/share-recipe/all
// Comparte una receta con todos los amigos del usuario
export async function shareRecipeWithAll(req, res) {
  try {
    const recipeId = Number(req.body.recipe_id)
    const message  = req.body.message ? String(req.body.message).trim() : null

    if (!Number.isInteger(recipeId) || recipeId <= 0) return badRequest(res, 'ID de receta no válido.')

    // Verificar que la receta existe y el usuario tiene acceso
    const [rows] = await pool.query(
      'SELECT id, user_id, is_public FROM recipes WHERE id = ? LIMIT 1',
      [recipeId],
    )
    if (!rows[0]) return notFound(res, 'Receta no encontrada.')
    if (!rows[0].is_public && rows[0].user_id !== req.user.id) {
      return forbidden(res, 'No puedes compartir una receta privada que no es tuya.')
    }

    const count = await shareRecipeWithAllFriends(req.user.id, recipeId, message)

    if (count === 0) {
      return ok(res, { message: 'No tienes amigos con quienes compartir la receta.', count: 0 })
    }

    return ok(res, {
      message: `Receta compartida con ${count} amigo${count !== 1 ? 's' : ''}.`,
      count,
    })
  } catch (err) {
    console.error('[friends.shareRecipeWithAll]', err)
    return serverError(res)
  }
}

// GET /friends/shared-recipes/received
// Recetas recibidas de amigos
export async function getReceived(req, res) {
  try {
    const [shares, unread] = await Promise.all([
      getReceivedShares(req.user.id),
      getUnreadShareCount(req.user.id),
    ])

    const items = shares.map((row) => ({
      shareId:   row.share_id,
      message:   row.message ?? null,
      readAt:    row.read_at ?? null,
      sentAt:    row.sent_at,
      sender: {
        id:       row.sender_id,
        username: row.sender_username,
      },
      recipe: {
        id:          row.recipe_id,
        title:       row.recipe_title,
        description: row.recipe_description ?? '',
        imageUrl:    row.recipe_photo
          ? (row.recipe_photo.startsWith('http')
              ? row.recipe_photo
              : `${process.env.API_BASE_URL || ''}${row.recipe_photo}`)
          : null,
        dishType: row.recipe_dish_type ?? '',
      },
    }))

    return ok(res, { shares: items, unreadCount: unread })
  } catch (err) {
    console.error('[friends.getReceived]', err)
    return serverError(res)
  }
}

// GET /friends/shared-recipes/sent
// Recetas que el usuario ha enviado a sus amigos
export async function getSent(req, res) {
  try {
    const shares = await getSentShares(req.user.id)

    const items = shares.map((row) => ({
      shareId:   row.share_id,
      message:   row.message ?? null,
      readAt:    row.read_at ?? null,
      sentAt:    row.sent_at,
      recipient: {
        id:       row.recipient_id,
        username: row.recipient_username,
      },
      recipe: {
        id:      row.recipe_id,
        title:   row.recipe_title,
        imageUrl: row.recipe_photo
          ? (row.recipe_photo.startsWith('http')
              ? row.recipe_photo
              : `${process.env.API_BASE_URL || ''}${row.recipe_photo}`)
          : null,
      },
    }))

    return ok(res, { shares: items })
  } catch (err) {
    console.error('[friends.getSent]', err)
    return serverError(res)
  }
}

// PATCH /friends/shared-recipes/:shareId/read
// Marca una receta recibida como leída
export async function markRead(req, res) {
  try {
    const shareId = Number(req.params.shareId)
    if (!Number.isInteger(shareId) || shareId <= 0) return badRequest(res, 'ID no válido.')

    await markShareAsRead(shareId, req.user.id)
    return ok(res, { message: 'Marcado como leído.' })
  } catch (err) {
    console.error('[friends.markRead]', err)
    return serverError(res)
  }
}

// GET /friends/shared-recipes/unread-count
// Número de recetas recibidas no leídas (para badge de notificaciones)
export async function unreadCount(req, res) {
  try {
    const count = await getUnreadShareCount(req.user.id)
    return ok(res, { unreadCount: count })
  } catch (err) {
    console.error('[friends.unreadCount]', err)
    return serverError(res)
  }
}
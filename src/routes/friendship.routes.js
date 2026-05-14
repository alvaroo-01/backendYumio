import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  list, pending, blocked, search, request, accept, block, remove,
  shareRecipeWithOne, shareRecipeWithAll,
  getReceived, getSent, markRead, unreadCount,
} from '../controllers/friendship.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.use(requireAuth)

const friendshipIdParam = param('friendshipId').isInt({ min: 1 }).withMessage('ID no válido.')

router.get('/',                                          list)
router.get('/pending',                                   pending)
router.get('/blocked',                                   blocked)
router.get('/search',    query('q').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }), validate, search)
router.post('/request',   body('username').trim().notEmpty().withMessage('El username es obligatorio.'), validate, request)
router.patch('/:friendshipId/accept', [friendshipIdParam], validate, accept)
router.patch('/:friendshipId/block',  [friendshipIdParam], validate, block)
router.delete('/:friendshipId',       [friendshipIdParam], validate, remove)

// ─── Compartir recetas entre amigos ──────────────────────────────────────────

// GET  /friends/shared-recipes/received        → recetas recibidas de amigos
router.get('/shared-recipes/received', getReceived)

// GET  /friends/shared-recipes/sent            → recetas que has enviado
router.get('/shared-recipes/sent', getSent)

// GET  /friends/shared-recipes/unread-count    → badge de notificaciones
router.get('/shared-recipes/unread-count', unreadCount)

// PATCH /friends/shared-recipes/:shareId/read  → marcar como leída
router.patch(
  '/shared-recipes/:shareId/read',
  param('shareId').isInt({ min: 1 }).withMessage('ID de share no válido.'),
  validate,
  markRead,
)

// POST /friends/share-recipe/all               → compartir con TODOS los amigos
router.post(
  '/share-recipe/all',
  body('recipe_id').isInt({ min: 1 }).withMessage('ID de receta no válido.'),
  body('message').optional({ nullable: true, checkFalsy: true }).isLength({ max: 500 }),
  validate,
  shareRecipeWithAll,
)

// POST /friends/:friendId/share-recipe         → compartir con un amigo concreto
router.post(
  '/:friendId/share-recipe',
  param('friendId').isInt({ min: 1 }).withMessage('ID de amigo no válido.'),
  body('recipe_id').isInt({ min: 1 }).withMessage('ID de receta no válido.'),
  body('message').optional({ nullable: true, checkFalsy: true }).isLength({ max: 500 }),
  validate,
  shareRecipeWithOne,
)

export default router
import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { list, pending, blocked, search, request, accept, block, unblock, remove } from '../controllers/friendship.controller.js'
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
router.patch('/:friendshipId/unblock',[friendshipIdParam], validate, unblock)
router.delete('/:friendshipId',       [friendshipIdParam], validate, remove)

export default router
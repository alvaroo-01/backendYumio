import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  getShoppingList,
  getShoppingListByRecipe,
  addManualItem,
  deleteItemById,
  deleteItemsByName,
  clearShoppingList,
} from '../controllers/shoppingList.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.use(requireAuth)

// GET /shopping-list                   → todos los items de la lista activa
router.get('/', getShoppingList)

// GET /shopping-list/recipe/:recipeId  → items de la lista filtrados por receta
router.get(
  '/recipe/:recipeId',
  param('recipeId').isInt({ min: 1 }).withMessage('ID de receta no válido.'),
  validate,
  getShoppingListByRecipe,
)

// POST /shopping-list                  → añadir item manual (sin receta)
router.post(
  '/',
  body('ingredient_text')
    .optional()
    .trim(),
  body('ingredient')
    .optional()
    .trim(),
  body('quantity')
    .optional({ nullable: true, checkFalsy: true }),
  body('unit')
    .optional({ nullable: true, checkFalsy: true })
    .isString(),
  body('recipe_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('ID de receta no válido.'),
  validate,
  addManualItem,
)

// DELETE /shopping-list                → vaciar toda la lista
router.delete('/', clearShoppingList)

// DELETE /shopping-list/item/:id       → eliminar un item concreto por ID
router.delete(
  '/item/:id',
  param('id').isInt({ min: 1 }).withMessage('ID de item no válido.'),
  validate,
  deleteItemById,
)

// DELETE /shopping-list/ingredient/:name → eliminar todos los items con ese nombre
router.delete(
  '/ingredient/:name',
  param('name').trim().notEmpty().withMessage('El nombre del ingrediente es obligatorio.'),
  validate,
  deleteItemsByName,
)

export default router
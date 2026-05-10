import { Router } from 'express'
import { body, param } from 'express-validator'
import { list, detail, create, update, remove, favorite, unfavorite } from '../controllers/recipe.controller.js'
import { addToShoppingList } from '../controllers/shoppingList.controller.js'
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { upload } from '../config/multer.js'

const router = Router()

// GET /recipes y GET /recipes/:id son públicos (usuarios no autenticados ven recetas públicas)
// El resto de operaciones requieren autenticación
const VALID_DIET_TYPES = ['normal', 'omnivoro', 'vegetariano', 'vegano']

const recipeRules = [
  // El nombre puede venir como 'nombre' (formulario HTML) o 'name' (JSON canónico)
  body('nombre')
    .if((_val, { req }) => !req.body.name)
    .trim()
    .notEmpty().withMessage('El nombre de la receta es obligatorio.')
    .isLength({ max: 255 }),

  body('name')
    .if((_val, { req }) => !req.body.nombre)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 }),

  body(['raciones', 'servings'])
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Las raciones deben ser un número positivo.'),

  // tipo_plato no se valida contra lista porque se resuelve con lookup en BD
  body(['tipo_plato', 'dishType'])
    .optional({ nullable: true, checkFalsy: true })
    .isString(),

  body(['dieta', 'dietType'])
    .optional({ nullable: true, checkFalsy: true })
    .isIn(VALID_DIET_TYPES).withMessage('Tipo de dieta no válido.'),

  body(['total', 'totalMinutes', 'prep', 'prepMinutes', 'coccion', 'cookMinutes'])
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Los tiempos deben ser números positivos.'),
]

const idParam = param('id').isInt({ min: 1 }).withMessage('ID de receta no válido.')

router.get('/',    requireAuth, list)
router.get('/:id', optionalAuth, [idParam], validate, detail)

// POST y PUT admiten imagen opcional
router.post('/',     requireAuth, upload.single('photo'), recipeRules, validate, create)
router.put('/:id',   requireAuth, upload.single('photo'), [idParam, ...recipeRules], validate, update)
router.delete('/:id', requireAuth, [idParam], validate, remove)

router.post('/:id/favorite',      requireAuth, [idParam], validate, favorite)
router.delete('/:id/favorite',    requireAuth, [idParam], validate, unfavorite)

// Lista de la compra: añadir ingredientes de esta receta
router.post('/:id/shopping-list',
  requireAuth,
  [
    idParam,
    body('servings').isInt({ min: 1 }).withMessage('Las raciones deben ser >= 1.'),
  ],
  validate,
  addToShoppingList,
)

export default router
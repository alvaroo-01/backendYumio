import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { registro, login, logout, me, actualizar, eliminarCuenta } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

function authLimiterMessage(req, retryAfterSeconds, fallbackMessage) {
  return {
    ok: false,
    code: 'RATE_LIMITED',
    message: fallbackMessage,
    retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    path: req.path,
  }
}

function getRetryAfterSeconds(req) {
  const resetTime = req.rateLimit?.resetTime
  if (!resetTime) {
    return undefined
  }

  const retryAfterMs = new Date(resetTime).getTime() - Date.now()
  return Math.max(1, Math.ceil(retryAfterMs / 1000))
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    const retryAfterSeconds = getRetryAfterSeconds(req)
    return res.status(429).json(
      authLimiterMessage(
        req,
        retryAfterSeconds,
        'Demasiados intentos de inicio de sesion. Intentalo de nuevo en unos minutos.',
      ),
    )
  },
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSeconds = getRetryAfterSeconds(req)
    return res.status(429).json(
      authLimiterMessage(
        req,
        retryAfterSeconds,
        'Demasiados intentos de registro. Intentalo de nuevo en unos minutos.',
      ),
    )
  },
})

const meLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id ?? req.ip),
  handler: (req, res) => {
    const retryAfterSeconds = getRetryAfterSeconds(req)
    return res.status(429).json(
      authLimiterMessage(
        req,
        retryAfterSeconds,
        'Verificando sesion demasiado rapido. Espera unos segundos e intentalo de nuevo.',
      ),
    )
  },
})

function parseAlergenos(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // Fallback CSV
    }

    return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

function validAlergenoValue(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return false
  }

  const asNumber = Number(trimmed)
  if (Number.isInteger(asNumber) && asNumber > 0) {
    return true
  }

  return /^[A-Za-zÀ-ÖØ-öø-ÿ0-9_\-\s]+$/.test(trimmed)
}

const registroRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.')
    .matches(/^[\p{L}\s'\-]+$/u).withMessage('El nombre contiene caracteres no válidos.'),

  body('email')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio.')
    .isEmail().withMessage('Formato de correo no válido.')
    .normalizeEmail({ all_lowercase: true, gmail_remove_dots: false }),

  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),

  body('confirm_password')
    .notEmpty().withMessage('Debes confirmar la contraseña.')
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Las contraseñas no coinciden.')
      return true
    }),

  body('pais')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('País no válido.'),

  body('dieta')
    .notEmpty().withMessage('Debes seleccionar un tipo de dieta.')
    .isIn(['omnivoro', 'normal', 'vegetariano', 'vegano']).withMessage('Tipo de dieta no válido.'),

  body('alergenos')
    .optional()
    .customSanitizer(parseAlergenos)
    .isArray().withMessage('Los alérgenos deben ser un array o una lista válida.')
    .custom((arr) => arr.every(validAlergenoValue)).withMessage('Valores de alérgenos no válidos.'),
]

const loginRules = [
  body('email').trim().notEmpty().withMessage('El correo es obligatorio.').isEmail().withMessage('Formato no válido.').normalizeEmail({ all_lowercase: true, gmail_remove_dots: false }),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
]

const actualizarRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.')
    .matches(/^[\p{L}\s'\-]+$/u).withMessage('El nombre contiene caracteres no válidos.'),

  body('email')
    .trim().notEmpty().withMessage('El correo es obligatorio.')
    .isEmail().withMessage('Formato de correo no válido.')
    .normalizeEmail({ all_lowercase: true, gmail_remove_dots: false }),

  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),

  body('confirm_password')
    .optional({ checkFalsy: true }),

  body('pais')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('País no válido.'),

  body('dieta')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['normal', 'omnivoro', 'vegetariano', 'vegano']).withMessage('Tipo de dieta no válido.'),

  body('alergenos')
    .optional()
    .customSanitizer(parseAlergenos)
    .isArray().withMessage('Los alérgenos deben ser un array o una lista válida.')
    .custom((arr) => arr.every(validAlergenoValue)).withMessage('Valores de alérgenos no válidos.'),
]

router.post('/registro',   registerLimiter, registroRules,   validate, registro)
router.post('/login',      loginLimiter,    loginRules,      validate, login)
router.post('/logout',     requireAuth,     logout)
router.get('/me',          requireAuth,     meLimiter, me)
router.post('/actualizar', requireAuth, actualizarRules, validate, actualizar)
router.delete('/cuenta',   requireAuth, eliminarCuenta)

export default router
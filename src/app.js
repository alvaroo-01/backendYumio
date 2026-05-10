import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import authRoutes          from './routes/auth.routes.js'
import recipeRoutes        from './routes/recipe.routes.js'
import friendshipRoutes    from './routes/friendship.routes.js'
import catalogRoutes       from './routes/catalog.routes.js'
import shoppingListRoutes  from './routes/shoppingList.routes.js'
import { uploadsDir }     from './config/multer.js'
import { errorHandler } from './middlewares/error.middleware.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { ok: false, message: 'Demasiadas solicitudes al modulo de autenticacion. Intentalo de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/me',
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/auth', authLimiter)
app.use('/api',  apiLimiter)

// ── Archivos estáticos (imágenes subidas) ─────────────────────────────────────
app.use('/uploads', express.static(uploadsDir))

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes)
app.use('/recipes',       recipeRoutes)
app.use('/friends',       friendshipRoutes)
app.use('/catalogs',      catalogRoutes)
app.use('/shopping-list', shoppingListRoutes)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }))

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada.' }))

// ── Error handler global ──────────────────────────────────────────────────────
app.use(errorHandler)

export default app

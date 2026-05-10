import { verifyToken } from '../utils/jwt.js'
import { unauthorized } from '../utils/response.js'

export function requireAuth(req, res, next) {
  // Acepta cookie httpOnly o cabecera Bearer
  const cookieToken = req.cookies?.token
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  const token = cookieToken || headerToken

  if (!token) return unauthorized(res)

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    return unauthorized(res, 'Token inválido o expirado.')
  }
}

/** Igual que requireAuth pero no bloquea si no hay token.
 *  Si hay token válido lo hidrata en req.user; si no, req.user = null y continúa. */
export function optionalAuth(req, _res, next) {
  const cookieToken = req.cookies?.token
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  const token = cookieToken || headerToken

  if (!token) {
    req.user = null
    return next()
  }

  try {
    req.user = verifyToken(token)
  } catch {
    req.user = null
  }

  next()
}

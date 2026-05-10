import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}

/** Envía el JWT como cookie httpOnly y también lo devuelve en el body */
export function sendAuthCookie(res, user) {
  const token = signToken({ id: user.id, email: user.email })
  const maxAge = Number(process.env.COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
  })

  return token
}

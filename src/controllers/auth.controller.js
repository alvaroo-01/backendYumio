import bcrypt from 'bcryptjs'
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  updateUser,
  deleteUserById,
  setUserAllergens,
  getUserAllergens,
  getAllAllergens,
  findUserByEmailExcluding,
  findUserByUsernameExcluding,
} from '../models/user.model.js'
import { syncAndLoadUserAllergens } from '../services/userAllergenPersistence.service.js'
import { sendAuthCookie } from '../utils/jwt.js'
import { ok, created, conflict, unauthorized, notFound, serverError } from '../utils/response.js'

const SALT_ROUNDS = 12

// POST /auth/registro
export async function registro(req, res) {
  try {
    const { name, email, password, pais, dieta, alergenos = [] } = req.body

    const [existingEmail, existingUsername] = await Promise.all([
      findUserByEmail(email.trim()),
      findUserByUsername(name.trim()),
    ])

    if (existingEmail) return conflict(res, 'Ya existe una cuenta con ese correo electrónico.')
    if (existingUsername) return conflict(res, 'Ese nombre de usuario ya está en uso.')

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const normalizedDieta = dieta === 'omnivoro' ? 'normal' : (dieta ?? 'normal')
    const isVegetarian = normalizedDieta === 'vegetariano' || normalizedDieta === 'vegano'
    const isVegan = normalizedDieta === 'vegano'

    const userId = await createUser({
      username: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      countryId: pais || null,
      isVegetarian,
      isVegan,
    })

    const { allergens } = await syncAndLoadUserAllergens({
      userId,
      requestedAllergens: alergenos,
      fetchAllAllergens: getAllAllergens,
      persistUserAllergens: setUserAllergens,
      getUserAllergens,
    })

    const user = await findUserById(userId)
    const token = sendAuthCookie(res, user)

    return created(res, {
      message: 'Cuenta creada correctamente.',
      token,
      user: { ...sanitizeUser(user), allergens },
    })
  } catch (err) {
    console.error('[registro]', err)
    return serverError(res)
  }
}

// POST /auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body

    const user = await findUserByEmail(email.trim().toLowerCase())
    if (!user) return unauthorized(res, 'Credenciales incorrectas.')

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return unauthorized(res, 'Credenciales incorrectas.')

    const fullUser = await findUserById(user.id)
    const allergens = await getUserAllergens(user.id)
    const token = sendAuthCookie(res, fullUser)

    return ok(res, {
      message: 'Inicio de sesión correcto.',
      token,
      user: { ...sanitizeUser(fullUser), allergens },
    })
  } catch (err) {
    console.error('[login]', err)
    return serverError(res)
  }
}

// POST /auth/logout
export async function logout(_req, res) {
  res.clearCookie('token')
  return ok(res, { message: 'Sesión cerrada.' })
}

// GET /auth/me
export async function me(req, res) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return unauthorized(res)

    const allergens = await getUserAllergens(user.id)
    return ok(res, { user: { ...sanitizeUser(user), allergens } })
  } catch (err) {
    console.error('[me]', err)
    return serverError(res)
  }
}

// POST /auth/actualizar  🔒
export async function actualizar(req, res) {
  try {
    const userId = req.user.id
    const { name, email, password, confirm_password, pais, dieta, alergenos = [] } = req.body

    // Verificar que el email y username no estén ya en uso por otro usuario
    const [emailTaken, usernameTaken] = await Promise.all([
      findUserByEmailExcluding(email.trim().toLowerCase(), userId),
      findUserByUsernameExcluding(name.trim(), userId),
    ])

    if (emailTaken)    return conflict(res, 'Ese correo ya está en uso por otra cuenta.')
    if (usernameTaken) return conflict(res, 'Ese nombre de usuario ya está en uso.')

    // Si manda nueva contraseña, hashearla; si no, pasar null para no cambiarla
    let passwordHash = null
    if (password && password.length >= 8) {
      if (password !== confirm_password) {
        return res.status(400).json({ ok: false, message: 'Las contraseñas no coinciden.' })
      }
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    }

    const normalizedDieta = dieta === 'omnivoro' ? 'normal' : (dieta ?? 'normal')
    const isVegetarian = normalizedDieta === 'vegetariano' || normalizedDieta === 'vegano'
    const isVegan = normalizedDieta === 'vegano'

    await updateUser(userId, {
      username:     name.trim(),
      email:        email.trim().toLowerCase(),
      passwordHash,
      countryId:    pais || null,
      isVegetarian,
      isVegan,
    })

    const { allergens } = await syncAndLoadUserAllergens({
      userId,
      requestedAllergens: alergenos,
      fetchAllAllergens: getAllAllergens,
      persistUserAllergens: setUserAllergens,
      getUserAllergens,
    })

    const updatedUser = await findUserById(userId)

    return ok(res, {
      message: 'Perfil actualizado correctamente.',
      user: { ...sanitizeUser(updatedUser), allergens },
    })
  } catch (err) {
    console.error('[actualizar]', err)
    return serverError(res)
  }
}

export async function eliminarCuenta(req, res) {
  try {
    const userId = req.user.id
    const deleted = await deleteUserById(userId)

    if (!deleted) {
      return notFound(res, 'No se encontro la cuenta que intentas eliminar.')
    }

    res.clearCookie('token')

    return ok(res, {
      message: 'Cuenta eliminada correctamente.',
    })
  } catch (err) {
    console.error('[eliminarCuenta]', err)
    return serverError(res)
  }
}

function sanitizeUser(user) {
  const { password_hash: _, ...safe } = user
  return safe
}

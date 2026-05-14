import path from 'path'
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  recipeOwner,
  addFavorite,
  removeFavorite,
  getUserAllergenIds,
} from '../models/recipe.model.js'
import { ok, created, noContent, forbidden, notFound, serverError } from '../utils/response.js'

// GET /recipes  (público — req.user puede ser null)
export async function list(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6))
    const search = req.query.search?.trim() || ''
    const filter = req.query.filter || ''

    // req.user es null si el visitante no está autenticado (optionalAuth)
    const userId = req.user?.id ?? null
    const result = await getRecipes({ userId, page, limit, search, filter })
    return ok(res, result)
  } catch (err) {
    console.error('[recipes.list]', err)
    return serverError(res)
  }
}

// GET /recipes/:id  (solo propietario autenticado)
export async function detail(req, res) {
  try {
    const userId = Number(req.user.id)
    const recipe = await getRecipeById(Number(req.params.id), userId)
    if (!recipe) return notFound(res, 'Receta no encontrada.')

    // Calcular avisos de incompatibilidad con las preferencias del usuario
    // warnings: lista de alérgenos de la receta que coinciden con los del usuario
    let userAllergenWarnings = []
    if (userId) {
      const userAllergenIds = await getUserAllergenIds(userId)
      if (userAllergenIds.length > 0) {
        userAllergenWarnings = recipe.allergens.filter(
          (a) => userAllergenIds.includes(a.id),
        )
      }
    }

    return ok(res, {
      recipe,
      userAllergenWarnings,  // [] si no hay conflictos o usuario no autenticado
    })
  } catch (err) {
    console.error('[recipes.detail]', err)
    return serverError(res)
  }
}

// POST /recipes  (multipart/form-data)
export async function create(req, res) {
  try {
    const photoPath = req.file ? `/uploads/${path.basename(req.file.filename)}` : null
    const data = parseRecipeBody(req.body)
    const recipeId = await createRecipe(req.user.id, data, photoPath)
    const recipe = await getRecipeById(recipeId, req.user.id)
    return created(res, { message: 'Receta creada correctamente.', recipe })
  } catch (err) {
    console.error('[recipes.create]', err)
    return serverError(res)
  }
}

// PUT /recipes/:id  (multipart/form-data)
export async function update(req, res) {
  try {
    const recipeId = Number(req.params.id)
    const ownerId  = await recipeOwner(recipeId)
    if (ownerId === null)        return notFound(res, 'Receta no encontrada.')
    if (ownerId !== req.user.id) return forbidden(res)

    const photoPath = req.file ? `/uploads/${path.basename(req.file.filename)}` : null
    const data = parseRecipeBody(req.body)
    await updateRecipe(recipeId, data, photoPath)
    const recipe = await getRecipeById(recipeId, req.user.id)
    return ok(res, { message: 'Receta actualizada.', recipe })
  } catch (err) {
    console.error('[recipes.update]', err)
    return serverError(res)
  }
}

// DELETE /recipes/:id
export async function remove(req, res) {
  try {
    const recipeId = Number(req.params.id)
    const ownerId  = await recipeOwner(recipeId)
    const isAdminUser = Boolean(
      req.user?.role === 'admin'
      || req.user?.isAdmin === true
      || req.user?.is_admin === true
      || Number(req.user?.is_admin) === 1,
    )
    if (ownerId === null)        return notFound(res, 'Receta no encontrada.')
    if (ownerId !== req.user.id && !isAdminUser) return forbidden(res)

    await deleteRecipe(recipeId)
    return noContent(res)
  } catch (err) {
    console.error('[recipes.remove]', err)
    return serverError(res)
  }
}

// POST /recipes/:id/favorite
export async function favorite(req, res) {
  try {
    await addFavorite(req.user.id, Number(req.params.id))
    return ok(res, { message: 'Receta añadida a favoritos.' })
  } catch (err) {
    console.error('[recipes.favorite]', err)
    return serverError(res)
  }
}

// DELETE /recipes/:id/favorite
export async function unfavorite(req, res) {
  try {
    await removeFavorite(req.user.id, Number(req.params.id))
    return ok(res, { message: 'Receta eliminada de favoritos.' })
  } catch (err) {
    console.error('[recipes.unfavorite]', err)
    return serverError(res)
  }
}

// ─── Helper: parsea el body de multipart unificando campos del formulario ────
// El RecipeFormPage envía: nombre, descripcion, raciones, total, prep, coccion,
// pais, tipo_plato, dieta, observaciones, alergenos[], ingredientes (JSON), pasos (JSON)

function parseRecipeBody(body) {
  // Ingredientes y pasos pueden llegar como JSON string o como array
  let ingredients = []
  let steps = []
  let allergens = []

  try {
    ingredients = typeof body.ingredients === 'string'
      ? JSON.parse(body.ingredients)
      : Array.isArray(body.ingredients) ? body.ingredients : []
  } catch { /* ignorar parse error */ }

  try {
    steps = typeof body.steps === 'string'
      ? JSON.parse(body.steps)
      : Array.isArray(body.steps) ? body.steps : []
  } catch { /* ignorar parse error */ }

  // Alérgenos llegan como array de strings desde el form (alergenos[]) o como JSON
  if (Array.isArray(body['alergenos[]'])) {
    allergens = body['alergenos[]']
  } else if (typeof body['alergenos[]'] === 'string') {
    allergens = [body['alergenos[]']]
  } else if (Array.isArray(body.allergens)) {
    allergens = body.allergens
  } else if (typeof body.allergens === 'string') {
    try { allergens = JSON.parse(body.allergens) } catch { allergens = [] }
  }

  return {
    name:         body.nombre        ?? body.name        ?? '',
    description:  body.descripcion   ?? body.description ?? null,
    servings:     body.raciones      ?? body.servings    ?? null,
    totalMinutes: body.total         ?? body.totalMinutes ?? null,
    prepMinutes:  body.prep          ?? body.prepMinutes  ?? null,
    cookMinutes:  body.coccion       ?? body.cookMinutes  ?? null,
    countryId:    body.pais          ?? body.countryId    ?? null,
    dishType:     body.tipo_plato    ?? body.dishType     ?? null,
    dietType:     body.dieta         ?? body.dietType     ?? 'normal',
    observations: body.observaciones ?? body.observations ?? null,
    isPublic:     body.is_public     ?? body.isPublic     ?? true,
    ingredients,
    steps,
    allergens,
  }
}

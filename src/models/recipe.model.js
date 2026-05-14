import pool from '../config/db.js'
import { nameToSlug } from './catalog.model.js'

// ─── Listado paginado ────────────────────────────────────────────────────────

export async function getRecipes({ userId, page = 1, limit = 6, search = '', filter = '' }) {
  const offset = (page - 1) * limit

  const safeUserId = userId ? Number(userId) : null
  if (!safeUserId) {
    return {
      recipes: [],
      total: 0,
      totalPages: 1,
      page,
    }
  }

  const visibilityClause = 'r.user_id = ?'
  const visibilityParams = [safeUserId]

  const favJoin = filter === 'favoritas'
    ? 'JOIN favorite_recipes fr ON fr.recipe_id = r.id AND fr.user_id = ?'
    : 'LEFT JOIN favorite_recipes fr ON fr.recipe_id = r.id AND fr.user_id = ?'
  const favParams = [safeUserId]

  let where = `WHERE ${visibilityClause}`
  const filterParams = []

  // Búsqueda por texto (nombre o descripción)
  if (search) {
    where += ' AND (r.name LIKE ? OR r.description LIKE ?)'
    filterParams.push(`%${search}%`, `%${search}%`)
  }

  // Filtros especiales
  if (filter === 'favoritas') {

  } else if (filter === 'rapidas') {
    where += ' AND r.prep_time_total_minutes <= 30'
  }

  // Orden: más reciente primero
  const orderBy = filter === 'nombre' ? 'r.name ASC' : 'r.updated_at DESC'

  const allParams = [...favParams, ...visibilityParams, ...filterParams]

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT r.id) AS total FROM recipes r ${favJoin} ${where}`,
    allParams,
  )

  const [rows] = await pool.query(
    `SELECT
       r.id, r.name AS title, r.description, r.photo,
       r.is_vegetarian, r.is_vegan, r.is_public,
       r.servings, r.observations,
       r.prep_time_active_minutes, r.prep_time_passive_minutes,
       r.prep_time_total_minutes, r.updated_at,
       r.country_id, r.user_id,
       dt.name AS dish_type_name,
       p.iso_name AS country_name,
       u.username AS author,
       (fr.user_id IS NOT NULL) AS isFavorite
     FROM recipes r
     ${favJoin}
     LEFT JOIN dish_types dt ON dt.id = r.dish_type_id
     LEFT JOIN paises p      ON p.id  = r.country_id
     LEFT JOIN users u       ON u.id  = r.user_id
     ${where}
     GROUP BY r.id
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...allParams, limit, offset],
  )

  return {
    recipes: rows.map(normalizeRecipeRow),
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    page,
  }
}

// ─── Detalle de receta ───────────────────────────────────────────────────────

export async function getRecipeById(recipeId, requestingUserId) {
  // Solo se permite consultar recetas del propietario autenticado.
  if (!requestingUserId) return null

  const [rows] = await pool.query(
    `SELECT
       r.*,
       dt.name AS dish_type_name,
       p.iso_name AS country_name,
       u.username AS author,
       (fr.user_id IS NOT NULL) AS isFavorite
     FROM recipes r
     LEFT JOIN dish_types dt       ON dt.id = r.dish_type_id
     LEFT JOIN paises p            ON p.id  = r.country_id
     LEFT JOIN users u             ON u.id  = r.user_id
     LEFT JOIN favorite_recipes fr ON fr.recipe_id = r.id AND fr.user_id = ?
     WHERE r.id = ? AND r.user_id = ?
     LIMIT 1`,
    [requestingUserId, recipeId, requestingUserId],
  )
  if (!rows[0]) return null

  const recipe = rows[0]

  const [ingredients] = await pool.query(
    `SELECT ingredient_text, quantity, unit, order_index
     FROM recipe_ingredients WHERE recipe_id = ? ORDER BY order_index ASC`,
    [recipeId],
  )
  const [steps] = await pool.query(
    `SELECT step_number, description
     FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC`,
    [recipeId],
  )

  const [allergens] = await pool.query(
    `SELECT a.id AS allergen_id, a.name AS allergen_name
     FROM recipe_allergens ra
     JOIN allergens a ON a.id = ra.allergen_id
     WHERE ra.recipe_id = ?`,
    [recipeId],
  )

  const base = normalizeRecipeRow(recipe)

  return serializeRecipeDetail(base, recipe, ingredients, steps, allergens)
}

export async function getRecipeWithRelations(recipeId) {
  const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ? LIMIT 1', [recipeId])
  const recipe = rows[0]
  if (!recipe) return null

  const [ingredients] = await pool.query(
    `SELECT ingredient_text, quantity, unit, order_index
     FROM recipe_ingredients
     WHERE recipe_id = ?
     ORDER BY order_index ASC`,
    [recipeId],
  )

  const [steps] = await pool.query(
    `SELECT description
     FROM recipe_steps
     WHERE recipe_id = ?
     ORDER BY step_number ASC`,
    [recipeId],
  )

  const [allergens] = await pool.query(
    `SELECT a.name AS allergen_name
     FROM recipe_allergens ra
     JOIN allergens a ON a.id = ra.allergen_id
     WHERE ra.recipe_id = ?`,
    [recipeId],
  )

  return { recipe, ingredients, steps, allergens }
}

export function serializeRecipeDetail(base, recipe, ingredients, steps, allergens) {
  return {
    ...base,
    dishType: recipe.dish_type_name ?? '',
    dishTypeValue: base.dishType ?? '',
    dietType: getDietTypeLabel(recipe),
    dietTypeValue: base.dietType ?? 'normal',
    // Tiempos explícitos en camelCase y snake_case para compatibilidad total
    prepMinutes:  recipe.prep_time_active_minutes  != null ? String(recipe.prep_time_active_minutes)  : '',
    cookMinutes:  recipe.prep_time_passive_minutes != null ? String(recipe.prep_time_passive_minutes) : '',
    totalMinutes: recipe.prep_time_total_minutes   != null ? String(recipe.prep_time_total_minutes)   : '',
    prep_minutes:  recipe.prep_time_active_minutes  != null ? String(recipe.prep_time_active_minutes)  : '',
    cook_minutes:  recipe.prep_time_passive_minutes != null ? String(recipe.prep_time_passive_minutes) : '',
    total_minutes: recipe.prep_time_total_minutes   != null ? String(recipe.prep_time_total_minutes)   : '',
    observations: recipe.observations ?? '',
    ingredientRows: ingredients.map((ing) => ({
      quantity:   String(ing.quantity ?? ''),
      unit:       String(ing.unit ?? ''),
      ingredient: ing.ingredient_text,
    })),
    steps:     steps.map((s) => s.description),
    // Alérgenos con slug Y con nombre legible para que el frontend pueda mostrar ambos
    allergens: allergens.map((a) => ({
      slug:  nameToSlug(a.allergen_name),
      name:  a.allergen_name,
      id:    a.allergen_id,
    })),
  }
}

// ─── Alérgenos del usuario ───────────────────────────────────────────────────

/** Devuelve los IDs de alérgenos del usuario para cruzarlos con los de la receta */
export async function getUserAllergenIds(userId) {
  if (!userId) return []
  const [rows] = await pool.query(
    'SELECT allergen_id FROM user_allergens WHERE user_id = ?',
    [userId],
  )
  return rows.map((r) => r.allergen_id)
}

// ─── Crear receta ────────────────────────────────────────────────────────────

export async function createRecipe(userId, data, photoPath) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const isVeg   = data.dietType === 'vegetariano' || data.dietType === 'vegano'
    const isVegan = data.dietType === 'vegano'

    // dish_type_id: puede venir como número (ID) o como slug de texto
    const dishTypeId = await resolveDishTypeId(conn, data.dishType)

    const [result] = await conn.query(
      `INSERT INTO recipes
         (user_id, name, description, photo, servings,
          dish_type_id, country_id,
          is_vegetarian, is_vegan, is_public, observations,
          prep_time_active_minutes, prep_time_passive_minutes, prep_time_total_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.name,
        data.description   ?? null,
        photoPath          ?? null,
        data.servings      ? Number(data.servings) : 1,
        dishTypeId,
        data.countryId     ? Number(data.countryId) : null,
        isVeg   ? 1 : 0,
        isVegan ? 1 : 0,
        data.isPublic      ? 1 : 0,
        data.observations  ?? null,
        data.prepMinutes   ? Number(data.prepMinutes)   : null,
        data.cookMinutes   ? Number(data.cookMinutes)   : null,
        data.totalMinutes  ? Number(data.totalMinutes)  : null,
      ],
    )
    const recipeId = result.insertId

    await saveIngredients(conn, recipeId, data.ingredients)
    await saveSteps(conn, recipeId, data.steps)
    await saveAllergens(conn, recipeId, data.allergens)

    await conn.commit()
    return recipeId
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ─── Actualizar receta ───────────────────────────────────────────────────────

export async function updateRecipe(recipeId, data, photoPath) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const isVeg   = data.dietType === 'vegetariano' || data.dietType === 'vegano'
    const isVegan = data.dietType === 'vegano'
    const dishTypeId   = await resolveDishTypeId(conn, data.dishType)
    const photoClause  = photoPath ? ', photo = ?' : ''
    const photoParam   = photoPath ? [photoPath]   : []

    await conn.query(
      `UPDATE recipes SET
         name = ?, description = ?, servings = ?,
         dish_type_id = ?, country_id = ?,
         is_vegetarian = ?, is_vegan = ?, is_public = ?, observations = ?,
         prep_time_active_minutes = ?, prep_time_passive_minutes = ?, prep_time_total_minutes = ?
         ${photoClause}
       WHERE id = ?`,
      [
        data.name,
        data.description  ?? null,
        data.servings     ? Number(data.servings) : 1,
        dishTypeId,
        data.countryId    ? Number(data.countryId) : null,
        isVeg   ? 1 : 0,
        isVegan ? 1 : 0,
        data.isPublic     ? 1 : 0,
        data.observations ?? null,
        data.prepMinutes  ? Number(data.prepMinutes)  : null,
        data.cookMinutes  ? Number(data.cookMinutes)  : null,
        data.totalMinutes ? Number(data.totalMinutes) : null,
        ...photoParam,
        recipeId,
      ],
    )

    await conn.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId])
    await conn.query('DELETE FROM recipe_steps       WHERE recipe_id = ?', [recipeId])
    await conn.query('DELETE FROM recipe_allergens   WHERE recipe_id = ?', [recipeId])

    await saveIngredients(conn, recipeId, data.ingredients)
    await saveSteps(conn, recipeId, data.steps)
    await saveAllergens(conn, recipeId, data.allergens)

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function deleteRecipe(recipeId) {
  await pool.query('DELETE FROM recipes WHERE id = ?', [recipeId])
}

export async function recipeOwner(recipeId) {
  const [rows] = await pool.query('SELECT user_id FROM recipes WHERE id = ? LIMIT 1', [recipeId])
  return rows[0]?.user_id ?? null
}

// ─── Favoritos ───────────────────────────────────────────────────────────────

export async function addFavorite(userId, recipeId) {
  await pool.query(
    'INSERT IGNORE INTO favorite_recipes (user_id, recipe_id) VALUES (?, ?)',
    [userId, recipeId],
  )
}

export async function removeFavorite(userId, recipeId) {
  await pool.query(
    'DELETE FROM favorite_recipes WHERE user_id = ? AND recipe_id = ?',
    [userId, recipeId],
  )
}

// ─── Helpers privados ────────────────────────────────────────────────────────

/**
 * Resuelve el dish_type_id a partir de:
 *  - un número directo (ya es el ID)
 *  - un slug de texto como 'pastas', 'carnes'... (busca por nombre)
 * Si no encuentra nada devuelve null (BD tiene ON DELETE RESTRICT, así que
 * el insert fallará con error descriptivo).
 */
// Tabla de traducción slug → nombre exacto en la BD
const SLUG_TO_DISH_TYPE_NAME = {
  entrantes_aperitivos:   'Entrantes y aperitivos',
  ensaladas:              'Ensaladas',
  sopas_cremas:           'Sopas y cremas',
  guisos:                 'Guisos',
  estofados:              'Estofados',
  arroces:                'Arroces',
  pastas:                 'Pastas',
  legumbres:              'Legumbres',
  carnes:                 'Carnes',
  pescados_mariscos:      'Pescados y mariscos',
  verduras_salteados:     'Verduras y salteados',
  horno_gratinados:       'Horno y gratinados',
  salsas_acompanamientos: 'Salsas y acompañamientos',
  bocadillos_sandwiches:  'Bocadillos y sándwiches',
  pizzas_masas:           'Pizzas y masas',
  postres:                'Postres',
  reposteria:             'Repostería',
  bebidas:                'Bebidas',
}

async function resolveDishTypeId(conn, dishType) {
  if (!dishType) return null

  // Si ya es un número lo devolvemos directamente
  const asNumber = Number(dishType)
  if (!isNaN(asNumber) && Number.isInteger(asNumber) && asNumber > 0) return asNumber

  // Primero intentamos con la tabla de traducción slug → nombre exacto
  const exactName = SLUG_TO_DISH_TYPE_NAME[String(dishType).toLowerCase()]
  if (exactName) {
    const [byExact] = await conn.query(
      'SELECT id FROM dish_types WHERE name = ? LIMIT 1',
      [exactName],
    )
    if (byExact[0]) return byExact[0].id
  }

  // Fallback: nombre exacto como viene
  const [byName] = await conn.query(
    'SELECT id FROM dish_types WHERE name = ? LIMIT 1',
    [dishType],
  )
  if (byName[0]) return byName[0].id

  // Último recurso: búsqueda LOWER (para nombres parciales o con variantes)
  const normalized = String(dishType).toLowerCase().replace(/_/g, ' ')
  const [byLower] = await conn.query(
    'SELECT id FROM dish_types WHERE LOWER(name) LIKE ? LIMIT 1',
    [`%${normalized}%`],
  )
  return byLower[0]?.id ?? null
}

/**
 * Resuelve el allergen_id usando la misma función nameToSlug que genera el catálogo.
 * 'Leche y lácteos' → slug 'leche_y_lacteos', que es exactamente lo que manda el frontend.
 * Al usar la misma función en ambos sentidos, slug y nombre siempre coinciden.
 */
async function resolveAllergenId(conn, slug) {
  if (!slug) return null
  const inputSlug = nameToSlug(String(slug))

  // Cargar todos los alérgenos y comparar sus slugs generados dinámicamente
  const [rows] = await conn.query('SELECT id, name FROM allergens')
  for (const row of rows) {
    if (nameToSlug(row.name) === inputSlug) return row.id
  }

  // Fallback: el frontend puede mandar el nombre directamente (ej: 'Gluten')
  const [byName] = await conn.query(
    'SELECT id FROM allergens WHERE name = ? LIMIT 1',
    [String(slug).trim()],
  )
  return byName[0]?.id ?? null
}

// Valores válidos del ENUM unit en la BD
const VALID_UNITS = new Set([
  'kg', 'g', 'mg', 'l', 'ml', 'taza', 'cucharada',
  'cucharadita', 'vaso', 'pieza', 'unidad', 'pizca', 'al_gusto',
])

function normalizeUnit(value) {
  const unit = String(value ?? '').trim()
  return VALID_UNITS.has(unit) ? unit : null
}

async function saveIngredients(conn, recipeId, ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return
  const values = ingredients
    .map((ing, i) => {
      const text = String(ing?.ingredient_text ?? ing?.ingredient ?? '').trim()
      if (!text) return null
      const quantity = ing.quantity !== '' && ing.quantity != null ? ing.quantity : null
      const unit = normalizeUnit(ing.unit)
      return [recipeId, text, quantity, unit, i]
    })
    .filter(Boolean)
  if (values.length === 0) return
  await conn.query(
    'INSERT INTO recipe_ingredients (recipe_id, ingredient_text, quantity, unit, order_index) VALUES ?',
    [values],
  )
}

async function saveSteps(conn, recipeId, steps) {
  if (!Array.isArray(steps) || steps.length === 0) return
  const values = steps
    .map((s, i) => {
      const text = (typeof s === 'string' ? s : String(s?.description ?? '')).trim()
      return text ? [recipeId, i + 1, text] : null
    })
    .filter(Boolean)
  if (values.length === 0) return
  await conn.query(
    'INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES ?',
    [values],
  )
}

async function saveAllergens(conn, recipeId, allergens) {
  if (!Array.isArray(allergens) || allergens.length === 0) return
  const values = []
  for (const slug of allergens) {
    const id = await resolveAllergenId(conn, slug)
    if (id) values.push([recipeId, id])
  }
  if (values.length === 0) return
  await conn.query(
    'INSERT IGNORE INTO recipe_allergens (recipe_id, allergen_id) VALUES ?',
    [values],
  )
}

// ─── Normalización BD → objeto frontend ─────────────────────────────────────

function normalizeRecipeRow(row) {
  // Convierte el nombre del tipo de plato de la BD al slug del frontend
  const dishTypeSlug = row.dish_type_name ? nameToSlug(row.dish_type_name) : ''

  // Deriva el dietType de los booleanos de la BD
  let dietType = 'normal'
  if (row.is_vegan)        dietType = 'vegano'
  else if (row.is_vegetarian) dietType = 'vegetariano'

  return {
    id:               row.id,
    title:            row.title ?? row.name,
    shortDescription: row.description
      ? row.description.slice(0, 120) + (row.description.length > 120 ? '...' : '')
      : '',
    fullDescription: row.description ?? '',
    // Si photo es una ruta relativa (/uploads/...) y hay API_BASE_URL configurada,
    // devolvemos la URL absoluta para que el frontend pueda usarla directamente.
    imageUrl: row.photo
      ? (row.photo.startsWith('http')
          ? row.photo
          : `${process.env.API_BASE_URL || ''}${row.photo}`)
      : null,
    // Campos que usa el frontend (RecipeFormPage, RecipeDetailPage, recipeService)
    dishType:        dishTypeSlug,
    dishTypeName:    row.dish_type_name ?? '',   // nombre legible: 'Sopas y cremas'
    dietType,
    countryId:       row.country_id ? String(row.country_id) : '',
    countryName:     row.country_name ?? '',
    servings:        row.servings != null ? String(row.servings) : '',
    prepMinutes:     row.prep_time_active_minutes  != null ? String(row.prep_time_active_minutes)  : '',
    cookMinutes:     row.prep_time_passive_minutes != null ? String(row.prep_time_passive_minutes) : '',
    totalMinutes:    row.prep_time_total_minutes   != null ? String(row.prep_time_total_minutes)   : '',
    // Aliases snake_case para compatibilidad con recipeService.js
    prep_minutes:    row.prep_time_active_minutes  != null ? String(row.prep_time_active_minutes)  : '',
    cook_minutes:    row.prep_time_passive_minutes != null ? String(row.prep_time_passive_minutes) : '',
    total_minutes:   row.prep_time_total_minutes   != null ? String(row.prep_time_total_minutes)   : '',
    is_vegetarian:   Boolean(row.is_vegetarian),
    is_vegan:        Boolean(row.is_vegan),
    is_public:       Boolean(row.is_public),
    isFavorite:      Boolean(row.isFavorite),
    isQuick:         Boolean(row.prep_time_total_minutes && row.prep_time_total_minutes <= 30),
    author:          row.author    ?? null,
    authorId:        row.user_id   ?? null,
    updated_at:      row.updated_at,
  }
}

function getDietTypeLabel(row) {
  if (row?.is_vegan) {
    return 'Vegana'
  }

  if (row?.is_vegetarian) {
    return 'Vegetariana'
  }

  return 'Omnívora'
}
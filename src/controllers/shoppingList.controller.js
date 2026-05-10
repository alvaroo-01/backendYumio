import pool from '../config/db.js'
import { getRecipeById } from '../models/recipe.model.js'
import { ok, created, badRequest, notFound, serverError } from '../utils/response.js'

// ─── Helper: obtener o crear la lista activa del usuario ─────────────────────

async function getOrCreateList(userId) {
  const [lists] = await pool.query(
    'SELECT id FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId],
  )
  if (lists[0]) return lists[0].id

  const [result] = await pool.query(
    'INSERT INTO shopping_lists (user_id, name) VALUES (?, ?)',
    [userId, 'Mi lista de la compra'],
  )
  return result.insertId
}

// ─── GET /shopping-list ───────────────────────────────────────────────────────
// Devuelve todos los items de la lista activa del usuario

export async function getShoppingList(req, res) {
  try {
    const [lists] = await pool.query(
      'SELECT id, name, created_at FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id],
    )

    if (!lists[0]) return ok(res, { list: null, items: [] })

    const list = lists[0]
    const [items] = await pool.query(
      `SELECT
         sli.id, sli.ingredient_text, sli.quantity, sli.unit,
         sli.recipe_id, r.name AS recipe_name, r.servings AS recipe_servings
       FROM shopping_list_items sli
       LEFT JOIN recipes r ON r.id = sli.recipe_id
       WHERE sli.shopping_list_id = ?
       ORDER BY sli.recipe_id IS NULL ASC, sli.recipe_id ASC, sli.id ASC`,
      [list.id],
    )

    return ok(res, { list, items })
  } catch (err) {
    console.error('[shoppingList.getShoppingList]', err)
    return serverError(res)
  }
}

// ─── GET /shopping-list/recipe/:recipeId ─────────────────────────────────────
// Devuelve los items de la lista activa filtrados por una receta concreta

export async function getShoppingListByRecipe(req, res) {
  try {
    const recipeId = Number(req.params.recipeId)
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return badRequest(res, 'ID de receta no válido.')
    }

    const [lists] = await pool.query(
      'SELECT id FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id],
    )
    if (!lists[0]) return ok(res, { items: [] })

    const [items] = await pool.query(
      `SELECT
         sli.id, sli.ingredient_text, sli.quantity, sli.unit,
         sli.recipe_id, r.name AS recipe_name
       FROM shopping_list_items sli
       LEFT JOIN recipes r ON r.id = sli.recipe_id
       WHERE sli.shopping_list_id = ? AND sli.recipe_id = ?
       ORDER BY sli.id ASC`,
      [lists[0].id, recipeId],
    )

    return ok(res, { items })
  } catch (err) {
    console.error('[shoppingList.getShoppingListByRecipe]', err)
    return serverError(res)
  }
}

// ─── POST /recipes/:id/shopping-list ─────────────────────────────────────────
// Añade los ingredientes de una receta (escalados) a la lista activa

export async function addToShoppingList(req, res) {
  try {
    const recipeId = Number(req.params.id)
    const servings = Number(req.body.servings)

    if (!Number.isInteger(servings) || servings < 1) {
      return badRequest(res, 'Las raciones deben ser un número entero mayor o igual a 1.')
    }

    const recipe = await getRecipeById(recipeId, req.user.id)
    if (!recipe) return notFound(res, 'Receta no encontrada.')

    const baseServings = Number(recipe.servings) || 1
    const multiplier = servings / baseServings
    const listId = await getOrCreateList(req.user.id)

    const providedIngredients = Array.isArray(req.body.ingredients) ? req.body.ingredients : []
    const ingredientRows = providedIngredients.length > 0
      ? providedIngredients
      : (recipe.ingredientRows ?? []).map((ing) => {
          const rawQty = Number(ing.quantity) || 0
          const scaledQty = rawQty > 0 ? Math.round(rawQty * multiplier * 100) / 100 : null
          return {
            ingredient: ing.ingredient,
            ingredient_text: ing.ingredient,
            quantity: scaledQty,
            unit: ing.unit || null,
          }
        })

    await pool.query(
      'DELETE FROM shopping_list_items WHERE shopping_list_id = ? AND recipe_id = ?',
      [listId, recipeId],
    )

    const values = ingredientRows
      .map((ing) => {
        const ingredientText = String(ing?.ingredient_text ?? ing?.ingredient ?? '').trim()
        if (!ingredientText) {
          return null
        }

        const parsedQuantity = Number(ing.quantity)
        const quantity = Number.isFinite(parsedQuantity) ? Math.round(parsedQuantity * 100) / 100 : null
        const unit = String(ing.unit ?? '').trim() || null
        return [listId, ingredientText, quantity, unit, recipeId]
      })
      .filter(Boolean)

    if (values.length > 0) {
      await pool.query(
        'INSERT INTO shopping_list_items (shopping_list_id, ingredient_text, quantity, unit, recipe_id) VALUES ?',
        [values],
      )
    }

    return ok(res, {
      message: `Ingredientes de "${recipe.title}" actualizados en tu lista de la compra.`,
      listId,
      servings,
    })
  } catch (err) {
    console.error('[shoppingList.addToShoppingList]', err)
    return serverError(res)
  }
}

// ─── POST /shopping-list ──────────────────────────────────────────────────────
// Añade un item manual a la lista (sin receta asociada, ej: papel higiénico)

export async function addManualItem(req, res) {
  try {
    const ingredientText = String(req.body.ingredient_text ?? req.body.ingredient ?? '').trim()
    if (!ingredientText) {
      return badRequest(res, 'El campo ingredient_text es obligatorio.')
    }

    const quantity = req.body.quantity != null ? String(req.body.quantity).trim() || null : null
    const unit     = req.body.unit     != null ? String(req.body.unit).trim()     || null : null
    const recipeId = req.body.recipe_id != null ? Number(req.body.recipe_id) : null

    let recipeName = null
    if (recipeId != null) {
      if (!Number.isInteger(recipeId) || recipeId <= 0) {
        return badRequest(res, 'ID de receta no válido.')
      }

      const recipe = await getRecipeById(recipeId, req.user.id)
      if (!recipe) {
        return notFound(res, 'Receta no encontrada.')
      }

      recipeName = recipe.title ?? null
    }

    const listId = await getOrCreateList(req.user.id)

    const [result] = await pool.query(
      `INSERT INTO shopping_list_items
         (shopping_list_id, ingredient_text, quantity, unit, recipe_id)
       VALUES (?, ?, ?, ?, ?)`,
      [listId, ingredientText, quantity, unit, recipeId],
    )

    return created(res, {
      message: 'Elemento añadido a la lista de la compra.',
      item: {
        id: result.insertId,
        ingredient_text: ingredientText,
        quantity,
        unit,
        recipe_id: recipeId,
        recipe_name: recipeName,
      },
    })
  } catch (err) {
    console.error('[shoppingList.addManualItem]', err)
    return serverError(res)
  }
}

// ─── DELETE /shopping-list/item/:id ──────────────────────────────────────────
// Elimina un item concreto por su ID

export async function deleteItemById(req, res) {
  try {
    const itemId = Number(req.params.id)
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return badRequest(res, 'ID de item no válido.')
    }

    // Verificar que el item pertenece a una lista del usuario
    const [rows] = await pool.query(
      `SELECT sli.id FROM shopping_list_items sli
       JOIN shopping_lists sl ON sl.id = sli.shopping_list_id
       WHERE sli.id = ? AND sl.user_id = ?`,
      [itemId, req.user.id],
    )
    if (!rows[0]) return notFound(res, 'Item no encontrado.')

    await pool.query('DELETE FROM shopping_list_items WHERE id = ?', [itemId])
    return ok(res, { message: 'Elemento eliminado.' })
  } catch (err) {
    console.error('[shoppingList.deleteItemById]', err)
    return serverError(res)
  }
}

// ─── DELETE /shopping-list/ingredient/:name ───────────────────────────────────
// Elimina todos los items que tengan ese texto de ingrediente (exacto, case-insensitive)

export async function deleteItemsByName(req, res) {
  try {
    const name = String(req.params.name ?? '').trim()
    if (!name) return badRequest(res, 'El nombre del ingrediente es obligatorio.')

    const [lists] = await pool.query(
      'SELECT id FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id],
    )
    if (!lists[0]) return ok(res, { message: 'No hay lista activa.', deleted: 0 })

    const [result] = await pool.query(
      `DELETE FROM shopping_list_items
       WHERE shopping_list_id = ?
         AND LOWER(ingredient_text) = LOWER(?)`,
      [lists[0].id, name],
    )

    return ok(res, {
      message: `${result.affectedRows} elemento(s) eliminado(s).`,
      deleted: result.affectedRows,
    })
  } catch (err) {
    console.error('[shoppingList.deleteItemsByName]', err)
    return serverError(res)
  }
}

// ─── DELETE /shopping-list ────────────────────────────────────────────────────
// Vacía toda la lista activa

export async function clearShoppingList(req, res) {
  try {
    const [lists] = await pool.query(
      'SELECT id FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id],
    )
    if (lists[0]) {
      await pool.query('DELETE FROM shopping_list_items WHERE shopping_list_id = ?', [lists[0].id])
    }
    return ok(res, { message: 'Lista de la compra vaciada.' })
  } catch (err) {
    console.error('[shoppingList.clearShoppingList]', err)
    return serverError(res)
  }
}
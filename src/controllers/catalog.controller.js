import {
  getAllCountries,
  getAllAllergens,
  DIET_TYPES,
  DISH_TYPES_STATIC,
  ALLERGENS_STATIC,
  INGREDIENT_UNITS,
} from '../models/catalog.model.js'
import { ok, serverError } from '../utils/response.js'

// GET /catalogs
export async function getCatalogs(_req, res) {
  try {
    const countries = await getAllCountries()

    // Normalizar países al formato {id, value, label, iso_name} que espera el frontend
    const normalizedCountries = countries.map((c) => ({
      id: String(c.id),
      value: String(c.id),
      label: String(c.iso_name ?? c.name ?? '').trim(),
      iso_name: String(c.iso_name ?? c.name ?? '').trim(),
      alfa2: c.alfa2 ?? null,
    }))

    // Alérgenos: preferimos los de la BD (con slug), fallback a estáticos
    let allergenList = ALLERGENS_STATIC
    try {
      const dbAllergens = await getAllAllergens()
      if (dbAllergens.length > 0) {
        allergenList = dbAllergens.map((a) => ({
          id:    a.slug,         // el frontend usa el slug como value/id
          value: a.slug,
          label: a.name,
        }))
      }
    } catch { /* usar fallback estático */ }

    return ok(res, {
      countries: normalizedCountries,
      dietTypes: DIET_TYPES,
      dishTypes: DISH_TYPES_STATIC,
      allergens: allergenList,
      ingredientUnits: INGREDIENT_UNITS,
    })
  } catch (err) {
    console.error('[catalogs.get]', err)
    return serverError(res)
  }
}

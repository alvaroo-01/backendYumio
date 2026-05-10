import pool from '../config/db.js'

export async function getAllCountries() {
  const [rows] = await pool.query(
    'SELECT id, name, iso_name, alfa2, alfa3, numerico FROM paises ORDER BY iso_name ASC',
  )
  return rows
}

export async function getAllAllergens() {
  const [rows] = await pool.query('SELECT id, name FROM allergens ORDER BY name ASC')
  // Añade el slug que usa el frontend (ej: 'Leche y lácteos' → 'leche_lacteos')
  return rows.map((r) => ({ ...r, slug: nameToSlug(r.name) }))
}

export function nameToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

export async function getAllDishTypes() {
  const [rows] = await pool.query('SELECT id, name, slug FROM dish_types ORDER BY name ASC')
  return rows
}

// Catálogos estáticos que no necesitan BD
// Coinciden con DEFAULT_CATALOGS del frontend para que el fallback sea idéntico al backend

export const DIET_TYPES = [
  { id: 'normal',       value: 'normal',       label: 'Omnivora' },
  { id: 'vegetariano',  value: 'vegetariano',  label: 'Vegetariano' },
  { id: 'vegano',       value: 'vegano',       label: 'Vegano' },
]

export const DISH_TYPES_STATIC = [
  { id: 'entrantes_aperitivos',    value: 'entrantes_aperitivos',    label: 'Entrantes y aperitivos' },
  { id: 'ensaladas',               value: 'ensaladas',               label: 'Ensaladas' },
  { id: 'sopas_cremas',            value: 'sopas_cremas',            label: 'Sopas y cremas' },
  { id: 'guisos',                  value: 'guisos',                  label: 'Guisos' },
  { id: 'estofados',               value: 'estofados',               label: 'Estofados' },
  { id: 'arroces',                 value: 'arroces',                 label: 'Arroces' },
  { id: 'pastas',                  value: 'pastas',                  label: 'Pastas' },
  { id: 'legumbres',               value: 'legumbres',               label: 'Legumbres' },
  { id: 'carnes',                  value: 'carnes',                  label: 'Carnes' },
  { id: 'pescados_mariscos',       value: 'pescados_mariscos',       label: 'Pescados y mariscos' },
  { id: 'verduras_salteados',      value: 'verduras_salteados',      label: 'Verduras y salteados' },
  { id: 'horno_gratinados',        value: 'horno_gratinados',        label: 'Horno y gratinados' },
  { id: 'salsas_acompanamientos',  value: 'salsas_acompanamientos',  label: 'Salsas y acompanamientos' },
  { id: 'bocadillos_sandwiches',   value: 'bocadillos_sandwiches',   label: 'Bocadillos y sandwiches' },
  { id: 'pizzas_masas',            value: 'pizzas_masas',            label: 'Pizzas y masas' },
  { id: 'postres',                 value: 'postres',                 label: 'Postres' },
  { id: 'reposteria',              value: 'reposteria',              label: 'Reposteria' },
  { id: 'bebidas',                 value: 'bebidas',                 label: 'Bebidas' },
]

export const ALLERGENS_STATIC = [
  { id: 'gluten',           value: 'gluten',           label: 'Gluten' },
  { id: 'crustaceos',       value: 'crustaceos',       label: 'Crustaceos' },
  { id: 'huevos',           value: 'huevos',           label: 'Huevos' },
  { id: 'pescado',          value: 'pescado',           label: 'Pescado' },
  { id: 'cacahuetes',       value: 'cacahuetes',       label: 'Cacahuetes' },
  { id: 'soja',             value: 'soja',             label: 'Soja' },
  { id: 'leche_lacteos',    value: 'leche_lacteos',    label: 'Leche y lacteos' },
  { id: 'frutos_cascara',   value: 'frutos_cascara',   label: 'Frutos de cascara' },
  { id: 'apio',             value: 'apio',             label: 'Apio' },
  { id: 'mostaza',          value: 'mostaza',          label: 'Mostaza' },
  { id: 'sesamo',           value: 'sesamo',           label: 'Sesamo' },
  { id: 'sulfitos',         value: 'sulfitos',         label: 'Sulfitos' },
  { id: 'moluscos',         value: 'moluscos',         label: 'Moluscos' },
]

export const INGREDIENT_UNITS = [
  { id: 'kg',          value: 'kg',          label: 'kg' },
  { id: 'g',           value: 'g',           label: 'g' },
  { id: 'mg',          value: 'mg',          label: 'mg' },
  { id: 'l',           value: 'l',           label: 'l' },
  { id: 'ml',          value: 'ml',          label: 'ml' },
  { id: 'taza',        value: 'taza',        label: 'taza' },
  { id: 'cucharada',   value: 'cucharada',   label: 'cucharada' },
  { id: 'cucharadita', value: 'cucharadita', label: 'cucharadita' },
  { id: 'vaso',        value: 'vaso',        label: 'vaso' },
  { id: 'pieza',       value: 'pieza',       label: 'pieza' },
  { id: 'unidad',      value: 'unidad',      label: 'unidad' },
  { id: 'pizca',       value: 'pizca',       label: 'pizca' },
  { id: 'al_gusto',    value: 'al_gusto',    label: 'al_gusto' },
]

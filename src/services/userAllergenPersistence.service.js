function toSlug(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

function normalizeRequestedAllergens(input) {
  const rawItems = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : []

  return rawItems
    .map((item) => {
      const trimmed = String(item ?? '').trim()
      if (!trimmed) {
        return null
      }

      const asNumber = Number(trimmed)
      if (Number.isInteger(asNumber) && asNumber > 0) {
        return { type: 'id', value: asNumber }
      }

      return { type: 'text', value: trimmed }
    })
    .filter(Boolean)
}

export function resolveAllergenIds(allCatalogAllergens, requestedAllergensInput) {
  const normalizedRequested = normalizeRequestedAllergens(requestedAllergensInput)
  if (normalizedRequested.length === 0) {
    return []
  }

  const byId = new Map()
  const byName = new Map()
  const bySlug = new Map()

  for (const allergen of allCatalogAllergens) {
    const id = Number(allergen?.id)
    const name = String(allergen?.name ?? '').trim()

    if (!Number.isInteger(id) || id <= 0 || !name) {
      continue
    }

    byId.set(id, id)
    byName.set(name.toLowerCase(), id)
    bySlug.set(toSlug(name), id)
  }

  const resolved = new Set()

  for (const requested of normalizedRequested) {
    if (requested.type === 'id') {
      if (byId.has(requested.value)) {
        resolved.add(requested.value)
      }
      continue
    }

    const key = String(requested.value).toLowerCase()
    if (byName.has(key)) {
      resolved.add(byName.get(key))
      continue
    }

    const slug = toSlug(requested.value)
    if (bySlug.has(slug)) {
      resolved.add(bySlug.get(slug))
    }
  }

  return Array.from(resolved)
}

export async function syncAndLoadUserAllergens({
  userId,
  requestedAllergens,
  fetchAllAllergens,
  persistUserAllergens,
  getUserAllergens,
}) {
  const catalogAllergens = await fetchAllAllergens()
  const allergenIds = resolveAllergenIds(catalogAllergens, requestedAllergens)

  await persistUserAllergens(userId, allergenIds)
  const allergens = await getUserAllergens(userId)

  return {
    allergenIds,
    allergens,
  }
}

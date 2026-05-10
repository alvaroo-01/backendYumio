import test from 'node:test'
import assert from 'node:assert/strict'
import { serializeRecipeDetail } from '../src/models/recipe.model.js'

test('serializeRecipeDetail devuelve dietType y dishType legibles y conserva valores internos', () => {
  const base = {
    id: 10,
    dishType: 'pizzas_y_masas',
    dietType: 'vegano',
  }

  const recipe = {
    dish_type_name: 'Pizzas y masas',
    is_vegetarian: 1,
    is_vegan: 1,
    prep_time_active_minutes: 10,
    prep_time_passive_minutes: 20,
    prep_time_total_minutes: 30,
    observations: 'Hornear bien',
  }

  const result = serializeRecipeDetail(base, recipe, [], [], [])

  assert.equal(result.dishType, 'Pizzas y masas')
  assert.equal(result.dishTypeValue, 'pizzas_y_masas')
  assert.equal(result.dietType, 'Vegana')
  assert.equal(result.dietTypeValue, 'vegano')
  assert.equal(result.prepMinutes, '10')
  assert.equal(result.cookMinutes, '20')
  assert.equal(result.totalMinutes, '30')
})

test('serializeRecipeDetail devuelve Omnívora cuando la receta no es vegetariana ni vegana', () => {
  const result = serializeRecipeDetail(
    { dishType: 'carnes', dietType: 'normal' },
    {
      dish_type_name: 'Carnes',
      is_vegetarian: 0,
      is_vegan: 0,
      prep_time_active_minutes: null,
      prep_time_passive_minutes: null,
      prep_time_total_minutes: null,
      observations: null,
    },
    [],
    [],
    [],
  )

  assert.equal(result.dietType, 'Omnívora')
  assert.equal(result.dietTypeValue, 'normal')
  assert.equal(result.dishType, 'Carnes')
})

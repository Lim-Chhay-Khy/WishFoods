import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import RecipeDetails from './RecipeDetails.jsx'
import { getRecipe } from '../services/apiService.js'

// Pretend to be the API instead of calling Flask.
vi.mock('../services/apiService.js', () => ({ getRecipe: vi.fn() }))
vi.mock('../components/FavoriteButton.jsx', () => ({ default: () => <button type="button">Save</button> }))

function renderRecipe() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/recipe/1']}>
      <Routes>
        <Route path="/recipe/:id" element={<RecipeDetails />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('shows the recipe ingredients and steps', async () => {
  getRecipe.mockResolvedValue({
    food: { id: 1, name: 'Chicken Fried Rice', emoji: '🍛', description: 'Quick.', cuisine: 'Asian',
      difficulty: 'Easy', priceLevel: '$', dietary: ['halal'] },
    recipe: { prepTime: 10, cookTime: 15, totalTime: 25, servings: 2,
      ingredients: ['2 cups cooked rice', '2 eggs'], instructions: ['Heat oil.', 'Add rice.'] },
  })
  renderRecipe()
  expect(await screen.findByRole('heading', { name: 'Chicken Fried Rice' })).toBeInTheDocument()
  expect(screen.getByText('2 cups cooked rice')).toBeInTheDocument()
  expect(screen.getByText('Add rice.')).toBeInTheDocument()
})

test('shows a friendly message when the recipe does not exist', async () => {
  getRecipe.mockRejectedValue(Object.assign(new Error('Food not found'), { status: 404 }))
  renderRecipe()
  expect(await screen.findByText("We couldn't find this recipe.")).toBeInTheDocument()
})

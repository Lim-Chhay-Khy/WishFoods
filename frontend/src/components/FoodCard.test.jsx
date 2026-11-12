import React from 'react'
import { screen } from '@testing-library/react'
import { vi } from 'vitest'
import FoodCard from './FoodCard.jsx'
import { renderWithRouter } from '../test/renderWithRouter.jsx'

// FoodCard contains a FavoriteButton, which needs the login and favorites
// contexts. We replace them with simple fakes for these tests.
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ isAuthenticated: false }) }))
vi.mock('../context/FavoritesContext.jsx', () => ({
  useFavorites: () => ({ findFavorite: () => undefined, saveFavorite: vi.fn(), deleteFavorite: vi.fn() }),
}))

const food = {
  id: 1, name: 'Chicken Fried Rice', emoji: '🍛', description: 'Quick and filling.', cuisine: 'Asian',
  country: 'China', region: 'East Asia', cookingTime: 25, difficulty: 'Easy', priceLevel: '$',
  dietary: ['halal'], canCook: true, availableAtRestaurant: true, reason: 'You said you are tired.',
}

test('shows the food name, price, origin and reason', () => {
  renderWithRouter(<FoodCard food={food} />)
  expect(screen.getByRole('heading', { name: 'Chicken Fried Rice' })).toBeInTheDocument()
  expect(screen.getByText('$')).toBeInTheDocument()
  expect(screen.getByText(/China · East Asia/)).toBeInTheDocument()
  expect(screen.getByText('You said you are tired.')).toBeInTheDocument()
})

test('Cook is disabled for restaurant-only food', () => {
  renderWithRouter(<FoodCard food={{ ...food, canCook: false, cookingTime: null }} />)
  expect(screen.getByRole('button', { name: 'Cook' })).toBeDisabled()
  expect(screen.getByText('Eat out')).toBeInTheDocument()
})

test('button labels can be changed (used by the Smart page)', () => {
  renderWithRouter(<FoodCard food={food} cookLabel="View Recipe" restaurantLabel="Find Nearby" />)
  expect(screen.getByRole('button', { name: 'View Recipe' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Find Nearby' })).toBeInTheDocument()
})

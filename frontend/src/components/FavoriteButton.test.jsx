import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import FavoriteButton from './FavoriteButton.jsx'
import { renderWithRouter } from '../test/renderWithRouter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'

// Fake versions of the two contexts; each test decides what they return.
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../context/FavoritesContext.jsx', () => ({ useFavorites: vi.fn() }))

function setUp({ loggedIn, saved }) {
  const saveFavorite = vi.fn().mockResolvedValue('Saved to Favorites!')
  const deleteFavorite = vi.fn().mockResolvedValue('Removed from Favorites.')
  useAuth.mockReturnValue({ isAuthenticated: loggedIn })
  useFavorites.mockReturnValue({
    findFavorite: () => (saved ? { id: 'fav-1' } : undefined),
    saveFavorite,
    deleteFavorite,
  })
  renderWithRouter(<FavoriteButton type="food" id={4} />)
  return { saveFavorite, deleteFavorite }
}

test('asks logged-out users to log in', async () => {
  const { saveFavorite } = setUp({ loggedIn: false, saved: false })
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(screen.getByText(/Please log in to save favorites/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
  expect(saveFavorite).not.toHaveBeenCalled()
})

test('saves a food for logged-in users', async () => {
  const { saveFavorite } = setUp({ loggedIn: true, saved: false })
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(saveFavorite).toHaveBeenCalledWith('food', 4)
  expect(await screen.findByText('Saved to Favorites!')).toBeInTheDocument()
})

test('removes a food that is already saved', async () => {
  const { deleteFavorite } = setUp({ loggedIn: true, saved: true })
  const button = screen.getByRole('button', { name: /saved/i })
  expect(button).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(button)
  expect(deleteFavorite).toHaveBeenCalledWith('fav-1')
})

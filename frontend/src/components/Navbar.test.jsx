import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Navbar from './Navbar.jsx'
import { renderWithRouter } from '../test/renderWithRouter.jsx'
import { useAuth } from '../context/AuthContext.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

test('logged-out users see Login and Register', () => {
  useAuth.mockReturnValue({ isAuthenticated: false, logout: vi.fn() })
  renderWithRouter(<Navbar />)
  expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Favorites' })).not.toBeInTheDocument()
})

test('logged-in users see their pages and can log out', async () => {
  const logout = vi.fn()
  useAuth.mockReturnValue({ isAuthenticated: true, logout })
  renderWithRouter(<Navbar />)
  expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Logout' }))
  expect(logout).toHaveBeenCalled()
})

test('the current page is marked for screen readers', () => {
  useAuth.mockReturnValue({ isAuthenticated: false, logout: vi.fn() })
  renderWithRouter(<Navbar />, { route: '/discover' })
  expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page')
})

test('the mobile menu button opens and closes the menu', async () => {
  useAuth.mockReturnValue({ isAuthenticated: false, logout: vi.fn() })
  renderWithRouter(<Navbar />)
  const toggle = screen.getByRole('button', { name: 'Open menu' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(toggle)
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
})

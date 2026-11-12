import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute.jsx'
import { useAuth } from '../context/AuthContext.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))

function renderAt(path) {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/favorites" element={<ProtectedRoute><p>Secret favorites</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

test('redirects logged-out users to the login page', () => {
  useAuth.mockReturnValue({ isAuthenticated: false, loading: false })
  renderAt('/favorites')
  expect(screen.getByText('Login page')).toBeInTheDocument()
  expect(screen.queryByText('Secret favorites')).not.toBeInTheDocument()
})

test('shows the page to logged-in users', () => {
  useAuth.mockReturnValue({ isAuthenticated: true, loading: false })
  renderAt('/favorites')
  expect(screen.getByText('Secret favorites')).toBeInTheDocument()
})

test('waits while a saved login is being checked', () => {
  useAuth.mockReturnValue({ isAuthenticated: false, loading: true })
  renderAt('/favorites')
  expect(screen.getByText(/Checking your account/)).toBeInTheDocument()
})

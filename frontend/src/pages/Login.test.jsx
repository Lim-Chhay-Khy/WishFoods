import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Login from './Login.jsx'
import Register from './Register.jsx'
import { renderWithRouter } from '../test/renderWithRouter.jsx'

const login = vi.fn()
const register = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ isAuthenticated: false, login, register }),
}))

beforeEach(() => {
  login.mockReset()
  register.mockReset()
})

test('Login shows errors when fields are empty', async () => {
  renderWithRouter(<Login />)
  await userEvent.click(screen.getByRole('button', { name: 'Log In' }))
  expect(screen.getByText('Email is required.')).toBeInTheDocument()
  expect(screen.getByText('Password is required.')).toBeInTheDocument()
  expect(login).not.toHaveBeenCalled()
})

test('Login shows one message for a wrong email or password', async () => {
  login.mockRejectedValue(Object.assign(new Error('Incorrect email or password.'), { status: 401 }))
  renderWithRouter(<Login />)
  await userEvent.type(screen.getByLabelText('Email'), 'jackie@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'wrongPassword')
  await userEvent.click(screen.getByRole('button', { name: 'Log In' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
})

test('Register checks password length and matching', async () => {
  renderWithRouter(<Register />)
  await userEvent.type(screen.getByLabelText('Full Name'), 'Jackie')
  await userEvent.type(screen.getByLabelText('Email'), 'jackie@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'short')
  await userEvent.type(screen.getByLabelText('Confirm Password'), 'different')
  await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))
  expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
  expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  expect(register).not.toHaveBeenCalled()
})

test('Register sends valid details', async () => {
  register.mockResolvedValue({})
  renderWithRouter(<Register />)
  await userEvent.type(screen.getByLabelText('Full Name'), 'Jackie')
  await userEvent.type(screen.getByLabelText('Email'), 'jackie@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'examplePassword')
  await userEvent.type(screen.getByLabelText('Confirm Password'), 'examplePassword')
  await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))
  expect(register).toHaveBeenCalledWith('Jackie', 'jackie@example.com', 'examplePassword')
})

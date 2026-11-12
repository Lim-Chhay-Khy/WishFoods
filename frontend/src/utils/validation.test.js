import { friendlyError, validateLogin, validateRegister } from './validation.js'
import { buildApiUrl } from '../services/apiService.js'

test('validateRegister accepts good details', () => {
  expect(validateRegister({ name: 'Jackie', email: 'j@example.com', password: 'examplePassword', confirmPassword: 'examplePassword' })).toEqual({})
})

test('validateLogin catches a bad email', () => {
  expect(validateLogin({ email: 'not-an-email', password: 'x' }).email).toBe('Please enter a valid email address.')
})

test('server problems become friendly messages', () => {
  expect(friendlyError({ status: 0 })).toBe("We couldn't connect to the server.")
  expect(friendlyError({ status: 500, message: 'Traceback...' })).toBe('Something went wrong. Please try again.')
})

test('the API address works with or without /api', () => {
  expect(buildApiUrl('http://localhost:5000')).toBe('http://localhost:5000/api')
  expect(buildApiUrl('https://moodbite.onrender.com/api/')).toBe('https://moodbite.onrender.com/api')
  expect(buildApiUrl(undefined)).toBe('http://localhost:5000/api')
})

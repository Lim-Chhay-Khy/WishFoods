// Form checks that run in the browser BEFORE sending anything to Flask,
// so the user gets instant feedback. Flask checks again on the server,
// because anyone could send requests without using this page.
//
// Each function returns an object of error messages, e.g.
//   { email: 'Please enter a valid email address.' }
// An empty object {} means everything is fine.

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const MIN_PASSWORD_LENGTH = 8

function checkName(name, errors) {
  if (!name.trim()) errors.name = 'Name is required.'
}

function checkEmail(email, errors) {
  if (!email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address.'
}

export function validateLogin({ email, password }) {
  const errors = {}
  checkEmail(email, errors)
  if (!password) errors.password = 'Password is required.'
  return errors
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {}
  checkName(name, errors)
  checkEmail(email, errors)
  if (!password) errors.password = 'Password is required.'
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export function validateProfile({ name, email }) {
  const errors = {}
  checkName(name, errors)
  checkEmail(email, errors)
  return errors
}

// Turns an error from apiService into a friendly sentence.
export function friendlyError(error) {
  if (error.status === 0) return "We couldn't connect to the server."
  if (error.status >= 500) return 'Something went wrong. Please try again.'
  return error.message
}

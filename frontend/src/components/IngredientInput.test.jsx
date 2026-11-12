import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IngredientInput from './IngredientInput.jsx'

// IngredientInput doesn't keep its own list, so wrap it with some state.
function Wrapper() {
  const [ingredients, setIngredients] = useState([])
  return <IngredientInput ingredients={ingredients} onChange={setIngredients} />
}

test('typing an ingredient and pressing Enter adds it', async () => {
  render(<Wrapper />)
  await userEvent.type(screen.getByLabelText(/add an ingredient/i), 'Chicken{Enter}')
  expect(screen.getByRole('button', { name: 'Remove chicken' })).toBeInTheDocument()
})

test('the same ingredient is not added twice', async () => {
  render(<Wrapper />)
  const input = screen.getByLabelText(/add an ingredient/i)
  await userEvent.type(input, 'rice{Enter}rice{Enter}')
  expect(screen.getAllByRole('button', { name: 'Remove rice' })).toHaveLength(1)
})

test('quick-add and remove buttons work', async () => {
  render(<Wrapper />)
  await userEvent.click(screen.getByRole('button', { name: '+ eggs' }))
  expect(screen.getByRole('button', { name: 'Remove eggs' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Remove eggs' }))
  expect(screen.queryByRole('button', { name: 'Remove eggs' })).not.toBeInTheDocument()
})

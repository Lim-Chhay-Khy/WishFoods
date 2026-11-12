import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import MoodCard from './MoodCard.jsx'

const tired = { id: 'tired', label: 'Tired', emoji: '😴' }

test('clicking a mood sends its id', async () => {
  const onSelect = vi.fn()
  render(<MoodCard mood={tired} selected={false} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: /tired/i }))
  expect(onSelect).toHaveBeenCalledWith('tired')
})

test('the selected mood is marked as pressed', () => {
  render(<MoodCard mood={tired} selected onSelect={() => {}} />)
  expect(screen.getByRole('button', { name: /tired/i })).toHaveAttribute('aria-pressed', 'true')
})

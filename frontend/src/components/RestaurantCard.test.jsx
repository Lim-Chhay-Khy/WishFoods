import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import RestaurantCard from './RestaurantCard.jsx'

vi.mock('./FavoriteButton.jsx', () => ({ default: () => <button type="button">Save Favorite</button> }))

const googlePlace = {
  id: 'ChIJabc', placeId: 'ChIJabc', name: 'Lucky Rice', emoji: '🍽', cuisine: 'Chinese Restaurant',
  rating: 4.5, ratingCount: 1234, priceLevel: '$', address: '1 King St W, Toronto', distance: 0.8,
  openNow: true, dineIn: true, takeout: true, delivery: null, googleMapsUrl: 'https://maps.google.com/?cid=1',
}

test('shows real restaurant details and a directions link', () => {
  render(<RestaurantCard restaurant={googlePlace} number={1} />)
  expect(screen.getByRole('heading', { name: /Lucky Rice/ })).toBeInTheDocument()
  expect(screen.getByText(/0.8 km away/)).toBeInTheDocument()
  expect(screen.getByText(/Open now/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Directions/ })).toHaveAttribute(
    'href', expect.stringContaining('destination_place_id=ChIJabc'))
  // Delivery is unknown (null), so it isn't shown at all.
  expect(screen.queryByText(/Delivery/)).not.toBeInTheDocument()
})

test('sample restaurants are clearly labelled', () => {
  render(<RestaurantCard restaurant={{ ...googlePlace, placeId: null, id: 3, googleMapsUrl: null }} />)
  expect(screen.getByText(/Sample restaurant/)).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Directions/ })).not.toBeInTheDocument()
})

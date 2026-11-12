import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../components/BackButton.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import LocationBar from '../components/LocationBar.jsx'
import RestaurantCard from '../components/RestaurantCard.jsx'
import RestaurantMap from '../components/RestaurantMap.jsx'
import useApi from '../hooks/useApi.js'
import { getNearbyRestaurants } from '../services/apiService.js'
import { getUserLocation } from '../utils/location.js'
import './Restaurants.css'

// Route: /restaurants/:foodId
// Stage 5: real restaurants near the user, from Google Places (through
// Flask: GET /api/foods/:id/nearby). If Google isn't set up or can't be
// reached, Flask sends the sample restaurants instead.
//
// 1. Ask the browser for the user's location.
// 2. Search near it — or in a city the user types.
// 3. Show the results on a map and as cards.
export default function Restaurants() {
  const { foodId } = useParams()
  const navigate = useNavigate()
  // What to search: { lat, lng } or { near: 'Toronto' }. null = still locating.
  const [search, setSearch] = useState(null)
  const [statusText, setStatusText] = useState('Finding your location...')

  function locateUser() {
    setSearch(null)
    setStatusText('Finding your location...')
    getUserLocation()
      .then((location) => {
        setSearch(location)
        setStatusText('Showing restaurants near you')
      })
      .catch((error) => {
        setSearch({}) // search anyway; Flask will send sample restaurants
        setStatusText(`${error.message} Type a city below instead.`)
      })
  }

  function searchCity(city) {
    setSearch({ near: city })
    setStatusText(`Showing restaurants in ${city}`)
  }

  // Step 1 happens once, when the page opens.
  useEffect(locateUser, [])

  const { data, loading, error, retry } = useApi(
    () => (search ? getNearbyRestaurants(foodId, search) : Promise.resolve(null)),
    [foodId, search],
  )

  if (error?.status === 404) {
    return (
      <div className="page">
        <EmptyState emoji="🔍" title="Food not found." message="We couldn't find that dish.">
          <Button onClick={() => navigate('/recommendations')}>Back to Recommendations</Button>
        </EmptyState>
      </div>
    )
  }

  const busy = !search || loading

  return (
    <div className="page fade-in">
      <BackButton to="/recommendations" label="Back to Recommendations" />
      <div className="page-header">
        <h1>{data ? `Restaurants that serve ${data.food.name}` : 'Finding restaurants...'}</h1>
      </div>

      <LocationBar statusText={statusText} onSearchCity={searchCity} onUseLocation={locateUser} busy={busy} />

      {busy && <LoadingMessage text={search ? 'Finding restaurants near you...' : 'Finding your location...'} />}
      {!busy && error && <ErrorMessage title="Sorry, we couldn't load restaurants." error={error} onRetry={retry} />}
      {!busy && data && <RestaurantResults data={data} userLocation={search?.lat !== undefined ? search : null} />}
    </div>
  )
}

// The map + cards, once the results are in.
function RestaurantResults({ data, userLocation }) {
  const { food, source, message, center, restaurants } = data
  const onMap = source === 'google' && center

  return (
    <>
      {message && <p className="notice">{message}</p>}

      {restaurants.length === 0 ? (
        <EmptyState emoji="🍽" title="No matching restaurants were found nearby."
          message="Try searching another city, or go back and choose a different dish." />
      ) : (
        <>
          {onMap && <RestaurantMap center={center} restaurants={restaurants} userLocation={userLocation} />}
          <div className="card-grid">
            {restaurants.map((restaurant, index) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} number={onMap ? index + 1 : null} />
            ))}
          </div>
        </>
      )}

      <p className="restaurants__credit">
        {source === 'google'
          ? `Restaurant data from Google. Results for “${food.name}”.`
          : 'These are made-up sample restaurants.'}
      </p>
    </>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import FoodCard from '../components/FoodCard.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import RestaurantCard from '../components/RestaurantCard.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import './Favorites.css'

// Route: /favorites  (login required — see ProtectedRoute in App.jsx)
// Stage 4: favorites come from Flask (GET /api/favorites), saved per user.
export default function Favorites() {
  const navigate = useNavigate()
  const { favorites, loading, error, loadFavorites, deleteFavorite } = useFavorites()
  const [message, setMessage] = useState('')

  // Always show the latest list when the page opens.
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // Hide the "Removed from Favorites." message after 3 seconds.
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [message])

  async function handleRemove(favoriteId) {
    try {
      setMessage(await deleteFavorite(favoriteId))
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (loading && favorites.length === 0) return <LoadingMessage text="Loading your favorites..." />
  if (error) {
    return (
      <div className="page">
        <ErrorMessage title="Sorry, we couldn't load your favorites." error={error} onRetry={loadFavorites} />
      </div>
    )
  }

  const foodFavorites = favorites.filter((favorite) => favorite.type === 'food')
  // Sample restaurants and real Google restaurants ("place") share a section.
  const restaurantFavorites = favorites.filter(
    (favorite) => favorite.type === 'restaurant' || favorite.type === 'place',
  )

  if (favorites.length === 0) {
    return (
      <div className="page">
        {message && <p className="notice">{message}</p>}
        <EmptyState
          emoji="♡"
          title="You haven't saved anything yet."
          message="Explore food recommendations and save your favorites here."
        >
          <Button onClick={() => navigate('/mood')}>Discover Food</Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Your Favorites</h1>
        <p>Saved to your account, so they follow you to any device.</p>
      </div>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <FavoriteSection title="Favorite Foods" count={foodFavorites.length}>
        {foodFavorites.map((favorite) => (
          <FoodCard key={favorite.id} food={favorite.food} onRemove={() => handleRemove(favorite.id)} />
        ))}
      </FavoriteSection>

      <FavoriteSection title="Favorite Restaurants" count={restaurantFavorites.length}>
        {restaurantFavorites.map((favorite) => (
          <RestaurantCard
            key={favorite.id}
            restaurant={favorite.restaurant}
            onRemove={() => handleRemove(favorite.id)}
          />
        ))}
      </FavoriteSection>
    </div>
  )
}

// A heading + a grid of cards, or a short message when that section is empty.
function FavoriteSection({ title, count, children }) {
  return (
    <section className="favorites-section">
      <h2>
        {title} <span className="favorites-section__count">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="favorites-section__empty">Nothing saved here yet.</p>
      ) : (
        <div className="card-grid">{children}</div>
      )}
    </section>
  )
}

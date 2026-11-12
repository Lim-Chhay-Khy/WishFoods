import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../components/BackButton.jsx'
import Button from '../components/Button.jsx'
import DietaryTags from '../components/DietaryTags.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'
import FoodImage from '../components/FoodImage.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import RecipeStats from '../components/RecipeStats.jsx'
import useApi from '../hooks/useApi.js'
import { getRecipe } from '../services/apiService.js'
import './RecipeDetails.css'

// Route: /recipe/:id   (id is the food id, e.g. /recipe/1)
// Data comes from GET /api/foods/:id/recipe
export default function RecipeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, retry } = useApi(() => getRecipe(id), [id])

  if (loading) {
    return <LoadingMessage text="Loading recipe..." />
  }

  // 404 from Flask = this food or recipe doesn't exist.
  if (error?.status === 404) {
    return (
      <div className="page">
        <EmptyState emoji="🔍" title="We couldn't find this recipe." message={error.message}>
          <Button variant="outline" onClick={() => navigate('/recommendations')}>
            Back to Recommendations
          </Button>
        </EmptyState>
      </div>
    )
  }

  // Any other problem (server down, database error...).
  if (error) {
    return (
      <div className="page">
        <ErrorMessage title="Sorry, we couldn't load this recipe." error={error} onRetry={retry} />
      </div>
    )
  }

  const { food, recipe } = data

  return (
    <div className="page fade-in recipe-page">
      <BackButton to="/recommendations" label="Back to Recommendations" />
      <FoodImage src={food.imageUrl} emoji={food.emoji} alt={food.name} size="large" />

      <header className="recipe-page__header">
        <div>
          <h1>{food.name}</h1>
          <p className="recipe-page__description">{food.description}</p>
        </div>
        <FavoriteButton type="food" id={food.id} label="Save to Favorites" />
      </header>

      <RecipeStats food={food} recipe={recipe} />

      <section className="recipe-page__section">
        <h2>Dietary information</h2>
        <DietaryTags tags={food.dietary} />
      </section>

      <div className="recipe-page__columns">
        <section className="recipe-page__section">
          <h2>Ingredients</h2>
          <ul className="recipe-page__ingredients">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </section>

        <section className="recipe-page__section">
          <h2>Instructions</h2>
          <ol className="recipe-page__steps">
            {recipe.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

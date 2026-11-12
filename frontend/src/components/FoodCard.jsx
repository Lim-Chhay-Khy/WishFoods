import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button.jsx'
import FoodImage from './FoodImage.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import DietaryTags from './DietaryTags.jsx'
import RecommendationReason from './RecommendationReason.jsx'
import './FoodCard.css'

// Used on the Recommendations page and in the "Favorite Foods" section.
//   food:     a food object from the Flask API (plus `reason` when it
//             comes from the recommendation engine)
//   onRemove: optional — when given (Favorites page), shows a
//             "Remove Favorite" button instead of the Save button
//   cookLabel / restaurantLabel: optional button text (Stage 6 uses
//             "View Recipe" and "Find Nearby")
export default function FoodCard({ food, onRemove, cookLabel = 'Cook', restaurantLabel = 'Find Restaurant' }) {
  const navigate = useNavigate()
  const timeText = food.cookingTime === null ? 'Eat out' : `${food.cookingTime} min`

  return (
    <article className="card food-card">
      <FoodImage src={food.imageUrl} emoji={food.emoji} alt={food.name} />
      <div className="card__body">
        <div className="food-card__top">
          <h3 className="food-card__name">{food.name}</h3>
          <span className="food-card__price">{food.priceLevel}</span>
        </div>
        <p className="food-card__description">{food.description}</p>

        <dl className="food-card__meta">
          <div>
            <dt>Cuisine</dt>
            <dd>{food.cuisine}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{timeText}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{food.difficulty}</dd>
          </div>
        </dl>

        <DietaryTags tags={food.dietary} />
        {food.matchedIngredients?.length > 0 && (
          <p className="food-card__uses">🧺 Uses your {food.matchedIngredients.join(', ')}</p>
        )}
        <RecommendationReason reason={food.reason} />

        <div className="card__actions">
          <Button
            variant="secondary"
            disabled={!food.canCook}
            title={food.canCook ? 'See the recipe' : 'This dish is restaurant-only'}
            onClick={() => navigate(`/recipe/${food.id}`)}
          >
            {cookLabel}
          </Button>
          <Button
            variant="outline"
            disabled={!food.availableAtRestaurant}
            title={food.availableAtRestaurant ? 'See restaurants' : 'This dish is home-cooked only'}
            onClick={() => navigate(`/restaurants/${food.id}`)}
          >
            {restaurantLabel}
          </Button>
          {onRemove ? (
            <Button variant="outline" onClick={onRemove}>
              Remove Favorite
            </Button>
          ) : (
            <FavoriteButton type="food" id={food.id} />
          )}
        </div>
      </div>
    </article>
  )
}

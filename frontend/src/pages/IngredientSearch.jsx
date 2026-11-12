import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import FoodCard from '../components/FoodCard.jsx'
import IngredientInput from '../components/IngredientInput.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import PreferenceSelector from '../components/PreferenceSelector.jsx'
import { DIETARY_OPTIONS, TIME_OPTIONS } from '../data/options.js'
import { smartRecommend } from '../services/apiService.js'
import '../components/SmartInput.css'
import './SmartRecommend.css'

// Route: /ingredients  (Stage 7) — "Use My Ingredients".
// Reuses the Stage 6 endpoint (POST /api/ai/recommend) with the
// ingredients already structured, so the same engine scores the recipes
// (+1 point for each ingredient a recipe uses).
export default function IngredientSearch() {
  const [ingredients, setIngredients] = useState([])
  const [timeId, setTimeId] = useState('any')
  const [dietary, setDietary] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState('')

  function toggleDietary(id) {
    setDietary((list) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id]))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (ingredients.length === 0) {
      setFormError('Add at least one ingredient.')
      return
    }
    setFormError('')
    setStatus('loading')
    try {
      const data = await smartRecommend({
        // The message is saved in History, and "View Again" can re-read it.
        message: `I have ${ingredients.join(', ')}`,
        preferences: {
          ingredients,
          choice: 'cook',
          time: TIME_OPTIONS.find((option) => option.id === timeId)?.maxMinutes ?? null,
          dietary,
        },
      })
      setResult(data)
      setStatus('done')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }

  // Ingredients MoodBite didn't recognise (so they can't be matched).
  const recognised = result?.parsed_preferences?.ingredients || []
  const unknown = result ? ingredients.filter((item) => !recognised.some((known) => item.includes(known.replace(/s$/, '')))) : []

  return (
    <div className="page fade-in">
      <div className="page-header">
        <span className="step-label">Use My Ingredients</span>
        <h1>What do you have at home?</h1>
        <p>Add your ingredients and MoodBite will find recipes that use them.</p>
      </div>

      <form className="ingredient-search" onSubmit={handleSubmit} noValidate>
        <IngredientInput ingredients={ingredients} onChange={setIngredients} />
        {formError && <p className="smart-input__error" role="alert">{formError}</p>}

        <PreferenceSelector title="How much time do you have?" options={TIME_OPTIONS} selected={[timeId]} onToggle={setTimeId} />
        <PreferenceSelector title="Any dietary needs?" options={DIETARY_OPTIONS.filter((option) => option.id !== 'none')}
          selected={dietary} onToggle={toggleDietary} />

        <div className="continue-row">
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Finding recipes...' : 'Find Recipes'}
          </Button>
        </div>
      </form>

      <div className="smart-page__results">
        {status === 'loading' && <LoadingMessage text="Finding recipes with your ingredients..." />}
        {status === 'error' && <ErrorMessage title="Something went wrong. Please try again." error={error} />}
        {status === 'done' && result && (
          <>
            {unknown.length > 0 && (
              <p className="notice">We don't know these ingredients yet, so they weren't matched: {unknown.join(', ')}.</p>
            )}
            {result.recommendations.length === 0 ? (
              <EmptyState emoji="🧺" title="No recipes match these choices."
                message="Try removing a dietary filter, or tell MoodBite what you feel like instead.">
                <Link className="btn btn--outline" to="/smart-recommend">Tell MoodBite</Link>
              </EmptyState>
            ) : (
              <div className="card-grid">
                {result.recommendations.map((food) => (
                  <FoodCard key={food.id} food={food} cookLabel="View Recipe" restaurantLabel="Find Nearby" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

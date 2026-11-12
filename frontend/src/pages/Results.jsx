import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FoodCard from '../components/FoodCard.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import useApi from '../hooks/useApi.js'
import { getRecommendations } from '../services/apiService.js'
import './Results.css'

// Route: /recommendations
// Stage 3: the scoring now happens in Flask (POST /api/recommendations).
export default function Results() {
  const navigate = useNavigate()
  const answers = useAppContext()
  const { mood, preferences, cookOrEat, timeLimit, budget, dietary, surpriseMe } = answers

  // Ask Flask again only when one of the user's answers changes.
  const { data, loading, error, retry } = useApi(
    () => getRecommendations(answers),
    [mood, preferences, cookOrEat, timeLimit, budget, dietary, surpriseMe],
  )

  const answeredQuestions = Boolean(mood) && !surpriseMe

  function handleStartOver() {
    answers.resetSelections()
    navigate('/')
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>{answeredQuestions ? 'Here is what MoodBite recommends' : 'Here are a few ideas'}</h1>
        <p>
          {answeredQuestions
            ? 'Based on how you feel, what you are craving, and your time and budget.'
            : 'A mix of popular picks since you skipped the questions.'}
        </p>
      </div>

      <ResultsContent
        recommendations={data?.recommendations}
        savedToHistory={data?.savedToHistory}
        loading={loading}
        error={error}
        retry={retry}
        answeredQuestions={answeredQuestions}
      />

      <div className="continue-row">
        <Button variant="outline" onClick={handleStartOver}>
          Start Over
        </Button>
      </div>
    </div>
  )
}

// Picks what to show: loading text, an error, an empty message, or cards.
function ResultsContent({ recommendations, savedToHistory, loading, error, retry, answeredQuestions }) {
  const navigate = useNavigate()

  if (loading) {
    return <LoadingMessage text="Finding meals for you..." />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Sorry, we couldn't load your recommendations. Please try again."
        error={error}
        onRetry={retry}
      />
    )
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        emoji="🥲"
        title="No foods fit all of your choices"
        message="Your dietary preferences and cook / restaurant choice removed every food. Try changing one of them."
      >
        <Button onClick={() => navigate('/preferences')}>Change Preferences</Button>
        <Button variant="outline" onClick={() => navigate('/choice')}>
          Change Cook / Restaurant
        </Button>
      </EmptyState>
    )
  }

  const hasPerfectMatch = recommendations.some((food) => food.isPerfectMatch)

  return (
    <>
      {answeredQuestions && !hasPerfectMatch && (
        <p className="notice">Nothing matched every answer perfectly, so here are the closest matches.</p>
      )}
      {savedToHistory && (
        <p className="results__saved">
          ✓ Saved to your <Link to="/history">History</Link>
        </p>
      )}
      <div className="card-grid">
        {recommendations.map((food) => (
          <FoodCard key={food.id} food={food} />
        ))}
      </div>
    </>
  )
}

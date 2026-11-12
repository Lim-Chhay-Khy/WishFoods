import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import FoodCard from '../components/FoodCard.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import ParsedPreferences from '../components/ParsedPreferences.jsx'
import PreferenceEditor from '../components/PreferenceEditor.jsx'
import SmartInput from '../components/SmartInput.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import { smartRecommend } from '../services/apiService.js'
import './SmartRecommend.css'

const LOADING_TEXT = {
  understanding: 'Understanding your request...',
  matching: 'Finding the best matches...',
}

// Route: /smart-recommend  (Stage 6)
// 1. The user types what they want.
// 2. Flask turns it into structured answers (POST /api/ai/recommend).
// 3. We show "MoodBite understood: ..." and the recommended foods.
// The Home page can send a message here with { message, autoSubmit: true }.
export default function SmartRecommend() {
  const location = useLocation()
  const navigate = useNavigate()
  const { smartSession, setSmartSession } = useAppContext()

  // Start with: a message from Home, or the last session (after pressing Back).
  const [message, setMessage] = useState(location.state?.message ?? smartSession?.message ?? '')
  const [result, setResult] = useState(location.state?.autoSubmit ? null : smartSession?.result ?? null)
  const [status, setStatus] = useState('idle') // idle | understanding | matching | done | error
  const [error, setError] = useState(null)
  const [inputError, setInputError] = useState('')
  const [editing, setEditing] = useState(false)
  const lastRequest = useRef(null)
  const autoSubmitted = useRef(false)

  async function run(body) {
    lastRequest.current = body
    setStatus('understanding')
    setError(null)
    setEditing(false)
    // One request does both steps; the second message is just a friendly update.
    const timer = setTimeout(() => setStatus((now) => (now === 'understanding' ? 'matching' : now)), 900)
    try {
      const data = await smartRecommend(body)
      setResult(data)
      setSmartSession({ message: body.message, result: data })
      setStatus('done')
    } catch (err) {
      setError(err)
      setStatus('error')
    } finally {
      clearTimeout(timer)
    }
  }

  function handleSubmit(text) {
    if (!text.trim()) {
      setInputError('Please type what you feel like eating.')
      return
    }
    setInputError('')
    run({ message: text.trim() })
  }

  // Message sent from the Home page: search right away (only once).
  useEffect(() => {
    if (location.state?.autoSubmit && !autoSubmitted.current) {
      autoSubmitted.current = true
      handleSubmit(location.state.message || '')
      navigate(location.pathname, { replace: true, state: null }) // so Back/refresh doesn't repeat it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const busy = status === 'understanding' || status === 'matching'

  return (
    <div className="page fade-in smart-page">
      <div className="page-header">
        <span className="step-label">Tell MoodBite</span>
        <h1>How are you feeling?</h1>
        <p>Describe your mood, budget, time, cravings, or dietary needs in your own words.</p>
      </div>

      <SmartInput value={message} onChange={setMessage} onSubmit={handleSubmit} busy={busy} error={inputError}
        showExamples={!result} />

      <div className="smart-page__results">
        {busy && <LoadingMessage text={LOADING_TEXT[status]} />}
        {status === 'error' && (
          <ErrorMessage title="Sorry, we couldn't load your recommendations. Please try again." error={error}
            onRetry={() => run(lastRequest.current)} />
        )}
        {!busy && status !== 'error' && result && (
          <SmartResults result={result} editing={editing} setEditing={setEditing}
            onEdited={(preferences) => run({ message, preferences })} />
        )}
      </div>

      <p className="smart-page__switch">
        Prefer to answer a few questions? <Link to="/mood">Use Quick Questions</Link>
      </p>
    </div>
  )
}

// What we understood + the food cards.
function SmartResults({ result, editing, setEditing, onEdited }) {
  const prefs = result.parsed_preferences

  if (!result.understood) {
    return (
      <EmptyState emoji="🤔" title="We couldn't understand enough of your request."
        message="Try mentioning things like your mood, budget, food craving, or whether you want to cook." />
    )
  }

  // Button text that fits what the user asked for.
  const cookLabel = 'View Recipe'
  const restaurantLabel = 'Find Nearby'

  return (
    <>
      {editing ? (
        <PreferenceEditor prefs={prefs} onSubmit={onEdited} onCancel={() => setEditing(false)} />
      ) : (
        <ParsedPreferences prefs={prefs} parser={result.parser} onEdit={() => setEditing(true)} />
      )}

      {result.recommendations.length === 0 ? (
        <EmptyState emoji="🥲" title="No foods fit all of your choices" message={result.message}>
          <Button onClick={() => setEditing(true)}>Edit Preferences</Button>
        </EmptyState>
      ) : (
        <>
          <div className="smart-page__matches-top">
            <h2>Your matches</h2>
            {result.savedToHistory && (
              <p className="results__saved">
                ✓ Saved to your <Link to="/history">History</Link>
              </p>
            )}
          </div>
          <div className="card-grid">
            {result.recommendations.map((food) => (
              <FoodCard key={food.id} food={food} cookLabel={cookLabel} restaurantLabel={restaurantLabel} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

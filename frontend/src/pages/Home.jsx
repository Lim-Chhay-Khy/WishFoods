import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import SmartInput from '../components/SmartInput.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import './Home.css'

const FEATURES = [
  { icon: '😊', title: 'Mood Recommendations', text: 'Answer a few quick questions about your mood and cravings.', to: '/mood' },
  { icon: '🧺', title: 'Ingredient Matching', text: 'Tell us what you have and get recipes that use it.', to: '/ingredients' },
  { icon: '📖', title: 'Recipes', text: 'Step-by-step instructions, times and costs for every dish you can cook.', to: '/discover' },
  { icon: '🌍', title: 'Global Food Discovery', text: 'Browse dishes from nine regions of the world.', to: '/discover' },
  { icon: '📍', title: 'Real Nearby Restaurants', text: 'Find places near you that serve your dish, on a map.', to: '/discover' },
]

export default function Home() {
  const navigate = useNavigate()
  const { resetSelections, setSurpriseMe } = useAppContext()
  const [message, setMessage] = useState('')
  const [inputError, setInputError] = useState('')

  function handleQuickQuestions() {
    resetSelections()
    navigate('/mood')
  }

  function handleSurpriseMe() {
    resetSelections()
    setSurpriseMe(true)
    navigate('/recommendations')
  }

  // Send the typed message to the Smart Recommend page.
  function handleSmartSubmit(text) {
    if (!text.trim()) {
      setInputError('Please type what you feel like eating.')
      return
    }
    navigate('/smart-recommend', { state: { message: text.trim(), autoSubmit: true } })
  }

  return (
    <div className="home">
      <section className="home__hero fade-in" aria-labelledby="home-title">
        <span className="home__eyebrow" aria-hidden="true">🍲</span>
        <h1 id="home-title" className="home__heading">Can't decide what to eat?</h1>
        <p className="home__subtitle">
          MoodBite helps you discover meals based on your mood, ingredients, budget, time and cravings.
        </p>
        <div className="home__actions">
          <Button onClick={handleQuickQuestions}>Find My Food</Button>
          <Button variant="secondary" onClick={() => navigate('/ingredients')}>
            Use My Ingredients
          </Button>
          <Button variant="outline" onClick={() => navigate('/smart-recommend')}>
            Tell MoodBite
          </Button>
        </div>
        <button type="button" className="home__surprise" onClick={handleSurpriseMe}>
          or just surprise me 🎲
        </button>
      </section>

      <section className="home__smart fade-in" aria-labelledby="home-smart-title">
        <h2 id="home-smart-title">Tell MoodBite what you feel like eating</h2>
        <p>Describe your mood, budget, time, cravings, or dietary needs in your own words.</p>
        <SmartInput value={message} onChange={(text) => { setMessage(text); setInputError('') }}
          onSubmit={handleSmartSubmit} error={inputError} showExamples={false} />
      </section>

      <section className="home__features" aria-labelledby="home-features-title">
        <h2 id="home-features-title">What MoodBite can do</h2>
        <ul>
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <Link to={feature.to} className="home__feature">
                <span className="home__feature-icon" aria-hidden="true">{feature.icon}</span>
                <span className="home__feature-title">{feature.title}</span>
                <span className="home__feature-text">{feature.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

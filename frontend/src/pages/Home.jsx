import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import SmartInput from '../components/SmartInput.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import './Home.css'

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

  // Stage 6: send the typed message to the Smart Recommend page.
  function handleSmartSubmit(text) {
    if (!text.trim()) {
      setInputError('Please type what you feel like eating.')
      return
    }
    navigate('/smart-recommend', { state: { message: text.trim(), autoSubmit: true } })
  }

  return (
    <div className="home">
      <div className="home__hero fade-in">
        <span className="home__eyebrow">🍲</span>
        <h1 className="home__heading">What do you feel like eating today?</h1>
        <p className="home__subtitle">Tell us how you feel and MoodBite will help you decide.</p>
        <div className="home__actions">
          <Button onClick={handleQuickQuestions}>Quick Questions</Button>
          <Button variant="secondary" onClick={() => navigate('/smart-recommend')}>
            Tell MoodBite
          </Button>
          <Button variant="outline" onClick={handleSurpriseMe}>
            Surprise Me
          </Button>
        </div>
      </div>

      <section className="home__smart fade-in" aria-labelledby="home-smart-title">
        <h2 id="home-smart-title">Tell MoodBite what you feel like eating</h2>
        <p>Describe your mood, budget, time, cravings, or dietary needs in your own words.</p>
        <SmartInput value={message} onChange={(text) => { setMessage(text); setInputError('') }}
          onSubmit={handleSmartSubmit} error={inputError} showExamples={false} />
      </section>
    </div>
  )
}

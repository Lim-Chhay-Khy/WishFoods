import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import './About.css'

const TECHNOLOGIES = [
  { area: 'Frontend', items: 'React, JavaScript, React Router, HTML, CSS (Vite)' },
  { area: 'Backend', items: 'Python, Flask, REST API (JSON), JWT login, Werkzeug password hashing' },
  { area: 'Database', items: 'MongoDB (MongoDB Atlas in the cloud)' },
  { area: 'Other', items: 'Google Places API, Google Maps, browser geolocation, keyword-based NLP, pytest, Vitest, Git & GitHub' },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="page fade-in about-page">
      <div className="page-header">
        <h1>About MoodBite</h1>
        <p>A smart way to answer “What should I eat today?”</p>
      </div>

      <section>
        <h2>Why it was created</h2>
        <p>
          MoodBite was created to solve a simple everyday problem: people are hungry but often don’t
          know what they want to eat. Scrolling through menus or recipes takes longer than the meal.
        </p>
      </section>

      <section>
        <h2>What it does</h2>
        <p>
          MoodBite combines your mood, ingredients, budget, dietary preferences, cooking time and cuisine
          interests to recommend suitable meals — then shows you the recipe or real restaurants nearby.
        </p>
        <ul>
          <li>Answer quick questions, or describe what you want in your own words.</li>
          <li>Find recipes that use the ingredients you already have.</li>
          <li>Browse dishes from around the world by region and cuisine.</li>
          <li>See nearby restaurants on a map and get directions.</li>
          <li>Save favorites and look back at your recommendation history.</li>
        </ul>
      </section>

      <section>
        <h2>Technologies used</h2>
        <dl className="about-page__tech">
          {TECHNOLOGIES.map((row) => (
            <div key={row.area}>
              <dt>{row.area}</dt>
              <dd>{row.items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="about-page__note">
        MoodBite is a student portfolio project. Recommendations are suggestions based on your answers —
        always check ingredients yourself if you have allergies.
      </p>

      <div className="continue-row">
        <Button onClick={() => navigate('/mood')}>Find My Food</Button>
      </div>
    </div>
  )
}

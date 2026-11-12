import React from 'react'
import Button from './Button.jsx'
import { COOK_OR_RESTAURANT, DIETARY_OPTIONS, MOODS, PREFERENCES, TIME_OPTIONS } from '../data/options.js'
import './ParsedPreferences.css'

const PARSER_NAMES = {
  keywords: 'Understood with keyword matching',
  ai: 'Understood with AI',
  edited: 'Using the preferences you edited',
}

function labelFor(options, id) {
  return options.find((option) => option.id === id)?.label || id
}

// Builds the list of chips, e.g. [{ icon: '😴', label: 'Mood', value: 'Tired' }]
function buildItems(prefs) {
  const items = []
  if (prefs.mood) {
    const mood = MOODS.find((option) => option.id === prefs.mood)
    items.push({ icon: mood?.emoji || '🙂', label: 'Mood', value: mood?.label || prefs.mood })
  }
  if (prefs.preferences.length > 0) {
    const cravings = prefs.preferences.map((tag) => {
      const label = labelFor(PREFERENCES, tag)
      const word = prefs.craving_words?.[tag]
      // Show the user's own word only when it adds something: "Sweet (dessert)", not "Spicy (spicy)".
      return word && word.toLowerCase() !== label.toLowerCase() ? `${label} (${word})` : label
    })
    items.push({ icon: '🍜', label: 'Craving', value: cravings.join(', ') })
  }
  if (prefs.cuisine) items.push({ icon: '🌏', label: 'Cuisine', value: prefs.cuisine })
  if (prefs.dishes?.length > 0) items.push({ icon: '🥢', label: 'Dish', value: prefs.dishes.join(', ') })
  if (prefs.budget) items.push({ icon: '💰', label: 'Budget', value: `${prefs.budget_label || prefs.budget} (${prefs.budget})` })
  if (prefs.time) {
    const time = TIME_OPTIONS.find((option) => option.maxMinutes === prefs.time)
    items.push({ icon: '⏱', label: 'Time', value: time?.label || `${prefs.time} minutes` })
  }
  if (prefs.choice && prefs.choice !== 'either') {
    const choice = COOK_OR_RESTAURANT.find((option) => option.id === prefs.choice)
    items.push({ icon: choice?.emoji || '🍽', label: 'Choice', value: choice?.label || prefs.choice })
  }
  if (prefs.dietary.length > 0) {
    items.push({ icon: '🥗', label: 'Dietary', value: prefs.dietary.map((id) => labelFor(DIETARY_OPTIONS, id)).join(', ') })
  }
  if (prefs.ingredients?.length > 0) items.push({ icon: '🧺', label: 'You have', value: prefs.ingredients.join(', ') })
  return items
}

// "MoodBite understood: ..." — shows the structured answers we got from
// the message, so the user can check them and fix anything wrong.
//   prefs:  parsed_preferences from POST /api/ai/recommend
//   parser: "keywords" | "ai" | "edited"
//   onEdit: opens the Edit Preferences form
export default function ParsedPreferences({ prefs, parser, onEdit }) {
  const items = buildItems(prefs)

  return (
    <section className="parsed-preferences" aria-label="What MoodBite understood">
      <div className="parsed-preferences__top">
        <h2>MoodBite understood:</h2>
        <Button variant="outline" onClick={onEdit}>
          Edit Preferences
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="parsed-preferences__none">Nothing specific yet.</p>
      ) : (
        <ul className="parsed-preferences__list">
          {items.map((item) => (
            <li key={item.label}>
              <span aria-hidden="true">{item.icon}</span>
              <span className="parsed-preferences__label">{item.label}:</span> {item.value}
            </li>
          ))}
        </ul>
      )}
      <p className="parsed-preferences__parser">{PARSER_NAMES[parser] || ''}</p>
    </section>
  )
}

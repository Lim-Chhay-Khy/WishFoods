import React, { useState } from 'react'
import Button from './Button.jsx'
import PreferenceSelector from './PreferenceSelector.jsx'
import {
  BUDGET_OPTIONS,
  COOK_OR_RESTAURANT,
  DIETARY_OPTIONS,
  MOODS,
  PREFERENCES,
  TIME_OPTIONS,
} from '../data/options.js'
import './PreferenceEditor.css'

// Adds the item if it's missing, removes it if it's already there.
function toggle(list, id) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id]
}

// "Edit Preferences": lets the user fix what MoodBite understood, using
// the same buttons as the Quick Questions.
//   prefs:    parsed_preferences from the API
//   onSubmit: called with the corrected preferences (API format)
//   onCancel: closes the editor
export default function PreferenceEditor({ prefs, onSubmit, onCancel }) {
  const [mood, setMood] = useState(prefs.mood)
  const [cravings, setCravings] = useState(prefs.preferences)
  const [choice, setChoice] = useState(prefs.choice || 'either')
  const [timeId, setTimeId] = useState(
    TIME_OPTIONS.find((option) => option.maxMinutes === prefs.time)?.id || 'any',
  )
  const [budget, setBudget] = useState(prefs.budget || 'any')
  const [dietary, setDietary] = useState(prefs.dietary)
  const [ingredientsText, setIngredientsText] = useState((prefs.ingredients || []).join(', '))

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      mood,
      preferences: cravings,
      choice,
      time: TIME_OPTIONS.find((option) => option.id === timeId)?.maxMinutes ?? null,
      budget: budget === 'any' ? null : budget,
      dietary,
      // "chicken, rice" -> ["chicken", "rice"]
      ingredients: ingredientsText.split(',').map((item) => item.trim()).filter(Boolean),
      // keep what the user can't edit here
      cuisine: prefs.cuisine,
      dishes: prefs.dishes,
      craving_words: prefs.craving_words,
    })
  }

  return (
    <form className="preference-editor" onSubmit={handleSubmit}>
      <h2>Edit Preferences</h2>
      <PreferenceSelector title="Mood" options={MOODS} selected={mood ? [mood] : []}
        onToggle={(id) => setMood(id === mood ? null : id)} />
      <PreferenceSelector title="Cravings" options={PREFERENCES.filter((option) => option.id !== 'unsure')}
        selected={cravings} onToggle={(id) => setCravings(toggle(cravings, id))} />
      <PreferenceSelector title="Cook or restaurant?" options={COOK_OR_RESTAURANT} selected={[choice]}
        onToggle={setChoice} />
      <PreferenceSelector title="Time" options={TIME_OPTIONS} selected={[timeId]} onToggle={setTimeId} />
      <PreferenceSelector title="Budget" options={BUDGET_OPTIONS} selected={[budget]} onToggle={setBudget} />
      <PreferenceSelector title="Dietary" hint="Foods that don't fit are removed completely."
        options={DIETARY_OPTIONS.filter((option) => option.id !== 'none')}
        selected={dietary} onToggle={(id) => setDietary(toggle(dietary, id))} />

      <div className="preference-editor__ingredients">
        <label htmlFor="ingredients">Ingredients you have (separate with commas)</label>
        <input id="ingredients" value={ingredientsText} onChange={(event) => setIngredientsText(event.target.value)}
          placeholder="e.g. chicken, rice, eggs" maxLength={200} />
      </div>

      <div className="preference-editor__actions">
        <Button type="submit">Update Results</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

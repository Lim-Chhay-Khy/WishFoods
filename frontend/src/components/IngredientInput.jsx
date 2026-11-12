import React, { useState } from 'react'
import './IngredientInput.css'

const SUGGESTIONS = ['chicken', 'rice', 'eggs', 'tomatoes', 'onions', 'garlic', 'tofu', 'pasta', 'cheese', 'avocado']
const MAX_INGREDIENTS = 12

// Type an ingredient and press Enter (or a comma) to add it as a chip.
//   ingredients: the current list (the parent keeps it in state)
//   onChange:    called with the new list
export default function IngredientInput({ ingredients, onChange }) {
  const [text, setText] = useState('')

  function add(value) {
    const item = value.trim().toLowerCase()
    if (!item || ingredients.includes(item) || ingredients.length >= MAX_INGREDIENTS) return
    onChange([...ingredients, item])
  }

  function remove(item) {
    onChange(ingredients.filter((value) => value !== item))
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault() // don't submit the form or type the comma
      add(text)
      setText('')
    } else if (event.key === 'Backspace' && !text && ingredients.length > 0) {
      remove(ingredients[ingredients.length - 1]) // quick way to undo
    }
  }

  return (
    <div className="ingredient-input">
      <label htmlFor="ingredient-text">Add an ingredient you have</label>
      <div className="ingredient-input__box">
        <ul className="ingredient-input__chips" aria-label="Your ingredients">
          {ingredients.map((item) => (
            <li key={item}>
              {item}
              <button type="button" onClick={() => remove(item)} aria-label={`Remove ${item}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <input
          id="ingredient-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { add(text); setText('') }}
          placeholder={ingredients.length ? 'Add another...' : 'e.g. chicken, then press Enter'}
          maxLength={30}
        />
      </div>

      <div className="ingredient-input__suggestions">
        <span>Quick add:</span>
        {SUGGESTIONS.filter((item) => !ingredients.includes(item)).map((item) => (
          <button key={item} type="button" onClick={() => add(item)}>
            + {item}
          </button>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
import Button from './Button.jsx'
import './SmartInput.css'

export const MAX_MESSAGE_LENGTH = 500

export const EXAMPLE_PROMPTS = [
  'I feel stressed and want something healthy but filling.',
  'I have chicken and rice at home and only 20 minutes to cook.',
  "I'm happy today and want spicy Korean food under $25.",
  "I don't want to cook. Find me something warm nearby.",
]

// The text box where users describe what they want in their own words.
//   value / onChange: the text (the parent page keeps it in state)
//   onSubmit:         called with the text to search for
//   busy:             true while MoodBite is working
//   error:            a message to show under the box
//   showExamples:     show the "Try:" example buttons
export default function SmartInput({ value, onChange, onSubmit, busy = false, error, showExamples = true }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(value)
  }

  function useExample(example) {
    onChange(example)
    onSubmit(example)
  }

  return (
    <form className="smart-input" onSubmit={handleSubmit} noValidate>
      <label htmlFor="smart-message" className="smart-input__label">
        Describe what you feel like eating
      </label>
      <textarea
        id="smart-message"
        rows={4}
        maxLength={MAX_MESSAGE_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="I'm tired after school, I only have $20, and I want something warm and spicy."
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'smart-message-error' : undefined}
      />
      <div className="smart-input__row">
        <span className="smart-input__count">
          {value.length}/{MAX_MESSAGE_LENGTH}
        </span>
        <Button type="submit" disabled={busy}>
          {busy ? 'Working...' : 'Find Food For Me'}
        </Button>
      </div>
      {error && (
        <p id="smart-message-error" className="smart-input__error">
          {error}
        </p>
      )}

      {showExamples && (
        <div className="smart-input__examples">
          <p>Try:</p>
          {EXAMPLE_PROMPTS.map((example) => (
            <button key={example} type="button" onClick={() => useExample(example)} disabled={busy}>
              “{example}”
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

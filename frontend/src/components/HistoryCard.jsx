import React from 'react'
import Button from './Button.jsx'
import { BUDGET_OPTIONS, COOK_OR_RESTAURANT, DIETARY_OPTIONS, MOODS, PREFERENCES, TIME_OPTIONS } from '../data/options.js'
import './HistoryCard.css'

// Turns ids like "comfort" into labels like "Comfort Food".
function labelsFor(options, ids) {
  return ids.map((id) => options.find((option) => option.id === id)?.label || id).join(', ')
}

function formatDate(isoText) {
  return new Date(isoText).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// One past recommendation session on the History page.
//   entry:       a history item from GET /api/history
//   onViewAgain: runs the same answers again
//   onDelete:    removes this item
export default function HistoryCard({ entry, onViewAgain, onDelete }) {
  const details = [
    { label: 'Mood', value: entry.mood ? labelsFor(MOODS, [entry.mood]) : 'Not mentioned' },
    { label: 'Preference', value: labelsFor(PREFERENCES, entry.preferences) || 'Any' },
    { label: 'Choice', value: labelsFor(COOK_OR_RESTAURANT, [entry.choice]) },
    {
      label: 'Time',
      value: TIME_OPTIONS.find((option) => option.maxMinutes === entry.time)?.label || `${entry.time} minutes`,
    },
    { label: 'Budget', value: entry.budget ? labelsFor(BUDGET_OPTIONS, [entry.budget]) : 'No preference' },
    { label: 'Dietary', value: labelsFor(DIETARY_OPTIONS, entry.dietary) || 'No restrictions' },
  ]
  // Stage 6 extras, only shown when present
  if (entry.cuisine) details.push({ label: 'Cuisine', value: entry.cuisine })
  if (entry.ingredients.length > 0) details.push({ label: 'Ingredients', value: entry.ingredients.join(', ') })

  return (
    <article className="card history-card">
      <div className="card__body">
        <h3 className="history-card__date">{formatDate(entry.createdAt)}</h3>
        {entry.originalMessage && <p className="history-card__message">“{entry.originalMessage}”</p>}

        <dl className="history-card__details">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="history-card__heading">Recommended:</p>
          <ul className="history-card__foods">
            {entry.recommendedFoods.map((food) => (
              <li key={food.id}>
                <span aria-hidden="true">{food.emoji}</span> {food.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="card__actions">
          <Button variant="secondary" onClick={() => onViewAgain(entry)}>
            View Again
          </Button>
          <Button variant="outline" onClick={() => onDelete(entry.id)}>
            Delete
          </Button>
        </div>
      </div>
    </article>
  )
}

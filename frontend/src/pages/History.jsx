import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import HistoryCard from '../components/HistoryCard.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import useApi from '../hooks/useApi.js'
import { clearHistory, deleteHistoryItem, getHistory } from '../services/apiService.js'

// Route: /history  (login required)
// Data comes from GET /api/history, newest first.
export default function History() {
  const navigate = useNavigate()
  const { loadAnswers } = useAppContext()
  const { data: history, loading, error, retry } = useApi(getHistory, [])
  // Items deleted on this visit, hidden right away without reloading.
  const [deletedIds, setDeletedIds] = useState([])
  const [cleared, setCleared] = useState(false)
  const [actionError, setActionError] = useState('')

  // Show the results again:
  //  - typed (smart) sessions run the message again on the Smart page
  //  - Quick Questions sessions put the old answers back into AppContext
  function handleViewAgain(entry) {
    if (entry.source === 'smart' && entry.originalMessage) {
      navigate('/smart-recommend', { state: { message: entry.originalMessage, autoSubmit: true } })
      return
    }
    loadAnswers(entry)
    navigate('/recommendations')
  }

  async function handleDelete(id) {
    try {
      await deleteHistoryItem(id)
      setDeletedIds((ids) => [...ids, id])
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleClearAll() {
    try {
      await clearHistory()
      setCleared(true)
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (loading) return <LoadingMessage text="Loading your history..." />
  if (error) {
    return (
      <div className="page">
        <ErrorMessage title="Sorry, we couldn't load your history." error={error} onRetry={retry} />
      </div>
    )
  }

  const visible = cleared ? [] : history.filter((entry) => !deletedIds.includes(entry.id))

  if (visible.length === 0) {
    return (
      <div className="page">
        <EmptyState
          emoji="🕒"
          title="No recommendation history yet."
          message="Try MoodBite and your previous recommendations will appear here."
        >
          <Button onClick={() => navigate('/mood')}>Find My Food</Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Your History</h1>
        <p>Your past recommendation sessions, newest first.</p>
      </div>

      {actionError && <p className="notice">{actionError}</p>}

      <div className="card-grid">
        {visible.map((entry) => (
          <HistoryCard key={entry.id} entry={entry} onViewAgain={handleViewAgain} onDelete={handleDelete} />
        ))}
      </div>

      <div className="continue-row">
        <Button variant="outline" onClick={handleClearAll}>
          Clear All History
        </Button>
      </div>
    </div>
  )
}

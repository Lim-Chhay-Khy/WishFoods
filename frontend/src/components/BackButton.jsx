import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './BackButton.css'

// Goes back to the previous page in the app (so a recipe opened from the
// Smart Recommend page goes back there). If the user opened this page
// directly (no previous page), it goes to `to` instead.
export default function BackButton({ to = '/', label = 'Back' }) {
  const navigate = useNavigate()
  const location = useLocation()

  function goBack() {
    // React Router uses the key "default" for the first page of a visit.
    if (location.key !== 'default') navigate(-1)
    else navigate(to)
  }

  return (
    <button type="button" className="back-button" onClick={goBack}>
      ← {label}
    </button>
  )
}

import React, { useState } from 'react'
import './FoodImage.css'

// Shows a photo if `src` is set and loads correctly; otherwise falls back
// to the emoji on a warm gradient. That way the app looks complete even
// before real photos are added to the data files.
//
// size: "card" (used on cards) | "large" (used on the recipe page)
export default function FoodImage({ src, emoji, alt, size = 'card' }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = src && !failed

  return (
    <div className={`food-image food-image--${size}`}>
      {showPhoto ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="food-image__emoji" role="img" aria-label={alt}>
          {emoji || '🍽'}
        </span>
      )}
    </div>
  )
}

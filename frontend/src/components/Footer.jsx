import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

// Change this if you rename the GitHub repository.
const GITHUB_URL = 'https://github.com/Lim-Chhay-Khy/Moodbite'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>
          <strong>MoodBite</strong> · Smart food recommendations
        </p>
        <nav aria-label="Footer" className="footer__links">
          <Link to="/discover">Discover</Link>
          <Link to="/about">About</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </nav>
      </div>
    </footer>
  )
}

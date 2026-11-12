import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

// `matches` lists the paths that should highlight each link, so
// "Discover" stays highlighted on every page of the food-finding flow.
const DISCOVER = {
  label: 'Discover',
  to: '/discover',
  matches: ['/discover', '/mood', '/preferences', '/choice', '/recommendations', '/smart-recommend',
    '/ingredients', '/recipe', '/restaurants'],
}
const HOME = { label: 'Home', to: '/', matches: ['/'] }

// Different links depending on whether someone is logged in.
const LOGGED_OUT_LINKS = [
  HOME,
  DISCOVER,
  { label: 'Login', to: '/login', matches: ['/login'] },
  { label: 'Register', to: '/register', matches: ['/register'] },
]
const LOGGED_IN_LINKS = [
  HOME,
  DISCOVER,
  { label: 'Favorites', to: '/favorites', matches: ['/favorites'] },
  { label: 'History', to: '/history', matches: ['/history'] },
  { label: 'Profile', to: '/profile', matches: ['/profile'] },
]

function isActive(link, pathname) {
  if (link.to === '/') return pathname === '/'
  return link.matches.some((path) => pathname.startsWith(path))
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false) // the ☰ menu on small screens
  const links = isAuthenticated ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS

  // Close the mobile menu after moving to another page...
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // ...or when the user presses Escape.
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (event) => event.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          MoodBite
        </Link>

        {/* Only visible on small screens (see Navbar.css) */}
        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav id="main-menu" aria-label="Main" className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}>
          {links.map((link) => {
            const active = isActive(link, location.pathname)
            return (
              <Link
                key={link.label}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className={`navbar__link${active ? ' navbar__link--active' : ''}`}
              >
                {link.label}
              </Link>
            )
          })}
          {isAuthenticated && (
            <button type="button" className="navbar__link navbar__logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

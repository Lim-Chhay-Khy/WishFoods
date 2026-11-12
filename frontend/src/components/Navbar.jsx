import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

// `matches` lists the paths that should highlight each link, so
// "Discover" stays highlighted on every page of the question flow.
const DISCOVER = {
  label: 'Discover',
  to: '/mood',
  matches: ['/mood', '/preferences', '/choice', '/recommendations', '/smart-recommend', '/recipe', '/restaurants'],
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
  const links = isAuthenticated ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS

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
        <nav className="navbar__links">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`navbar__link${isActive(link, location.pathname) ? ' navbar__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
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

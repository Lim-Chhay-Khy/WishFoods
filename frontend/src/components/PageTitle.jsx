import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Sets the browser tab title for each page, e.g. "Favorites · MoodBite".
// Screen readers announce the title too, so users know where they are.
const TITLES = [
  ['/smart-recommend', 'Tell MoodBite'],
  ['/recommendations', 'Recommendations'],
  ['/restaurants', 'Restaurants'],
  ['/ingredients', 'Use My Ingredients'],
  ['/preferences', 'Your Cravings'],
  ['/favorites', 'Favorites'],
  ['/discover', 'Discover'],
  ['/register', 'Create Account'],
  ['/history', 'History'],
  ['/profile', 'Profile'],
  ['/recipe', 'Recipe'],
  ['/choice', 'Cook or Eat Out'],
  ['/login', 'Log In'],
  ['/about', 'About'],
  ['/mood', 'Your Mood'],
]

export default function PageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const match = TITLES.find(([path]) => pathname.startsWith(path))
    document.title = match ? `${match[1]} · MoodBite` : 'MoodBite — Smart food recommendations'
  }, [pathname])

  return null
}

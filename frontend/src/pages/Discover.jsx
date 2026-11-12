import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import FoodCard from '../components/FoodCard.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import useApi from '../hooks/useApi.js'
import { getFoods } from '../services/apiService.js'
import './Discover.css'

export const REGIONS = [
  'East Asia',
  'Southeast Asia',
  'South Asia',
  'Middle East',
  'Europe',
  'Africa',
  'North America',
  'Latin America',
  'Oceania',
]
const PAGE_SIZE = 9 // show 9 foods at a time so the page isn't overwhelming

// Route: /discover  (Stage 7) — browse every food by region, cuisine or
// country. Data: GET /api/foods. Filtering happens in the browser because
// there are only a few dozen foods.
export default function Discover() {
  const { data: foods, loading, error, retry } = useApi(getFoods, [])
  const [region, setRegion] = useState('All')
  const [cuisine, setCuisine] = useState('All')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)

  // useMemo: only re-filter when the foods or the filters change.
  const inRegion = useMemo(
    () => (foods || []).filter((food) => region === 'All' || food.region === region),
    [foods, region],
  )
  const cuisines = useMemo(() => [...new Set(inRegion.map((food) => food.cuisine))].sort(), [inRegion])
  const results = useMemo(() => {
    const text = search.trim().toLowerCase()
    return inRegion.filter(
      (food) =>
        (cuisine === 'All' || food.cuisine === cuisine) &&
        (!text || [food.name, food.description, food.country, food.cuisine].join(' ').toLowerCase().includes(text)),
    )
  }, [inRegion, cuisine, search])

  function chooseRegion(name) {
    setRegion(name)
    setCuisine('All') // cuisines differ per region
    setShown(PAGE_SIZE)
  }

  if (loading) return <LoadingMessage text="Loading foods from around the world..." />
  if (error) {
    return (
      <div className="page">
        <ErrorMessage title="Something went wrong. Please try again." error={error} onRetry={retry} />
      </div>
    )
  }

  const countFor = (name) => (name === 'All' ? foods.length : foods.filter((food) => food.region === name).length)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Discover food from around the world</h1>
        <p>
          Browse by region, cuisine or country — or let MoodBite choose with{' '}
          <Link to="/mood">Quick Questions</Link> or <Link to="/smart-recommend">Tell MoodBite</Link>.
        </p>
      </div>

      <div className="discover__filters">
        <div className="discover__regions" role="group" aria-label="Filter by region">
          {['All', ...REGIONS].map((name) => (
            <button key={name} type="button" aria-pressed={region === name}
              className={`discover__region${region === name ? ' is-selected' : ''}`}
              onClick={() => chooseRegion(name)} disabled={countFor(name) === 0}>
              {name} <span className="discover__count">({countFor(name)})</span>
            </button>
          ))}
        </div>

        <div className="discover__row">
          <label className="discover__field">
            <span>Cuisine</span>
            <select value={cuisine} onChange={(event) => { setCuisine(event.target.value); setShown(PAGE_SIZE) }}>
              <option value="All">All cuisines</option>
              {cuisines.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="discover__field discover__field--grow">
            <span>Search</span>
            <input type="search" value={search} placeholder="e.g. noodles, Japan, curry"
              onChange={(event) => { setSearch(event.target.value); setShown(PAGE_SIZE) }} />
          </label>
        </div>
      </div>

      <p className="discover__summary" role="status">
        Showing {Math.min(shown, results.length)} of {results.length} {results.length === 1 ? 'food' : 'foods'}
      </p>

      {results.length === 0 ? (
        <EmptyState emoji="🌍" title="No foods match these filters." message="Try another region or clear the search." />
      ) : (
        <>
          <div className="card-grid">
            {results.slice(0, shown).map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
          {shown < results.length && (
            <div className="continue-row">
              <Button variant="outline" onClick={() => setShown(shown + PAGE_SIZE)}>
                Show More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

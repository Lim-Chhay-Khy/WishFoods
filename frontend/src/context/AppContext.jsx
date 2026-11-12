import React, { createContext, useContext, useState } from 'react'
import { TIME_OPTIONS } from '../data/options.js'

// This context holds everything the user has picked as they move through
// the question pages:
//   Mood page         -> mood
//   Preferences page  -> preferences (cravings) + dietary
//   Choice page       -> cookOrEat + timeLimit + budget
// Results.jsx reads all of it to generate recommendations.
const AppContext = createContext(null)

// Adds the item if it's missing, removes it if it's already there.
function toggleInList(list, item) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item]
}

export function AppProvider({ children }) {
  const [mood, setMood] = useState(null)
  const [preferences, setPreferences] = useState([])
  const [cookOrEat, setCookOrEat] = useState(null)
  const [surpriseMe, setSurpriseMe] = useState(false)

  // Stage 2 answers
  const [timeLimit, setTimeLimit] = useState(null) // id from TIME_OPTIONS
  const [budget, setBudget] = useState(null) // id from BUDGET_OPTIONS
  const [dietary, setDietary] = useState([]) // ids from DIETARY_OPTIONS

  // Stage 6: the last typed request and its results, so going to a recipe
  // and pressing Back shows the same results again.
  const [smartSession, setSmartSession] = useState(null) // { message, result }

  function resetSelections() {
    setMood(null)
    setPreferences([])
    setCookOrEat(null)
    setSurpriseMe(false)
    setTimeLimit(null)
    setBudget(null)
    setDietary([])
  }

  // Stage 4: "View Again" on the History page puts a saved session's
  // answers back, so the Recommendations page can run them again.
  // `entry` uses the API's format (time in minutes, budget null = any).
  function loadAnswers(entry) {
    setMood(entry.mood)
    setPreferences(entry.preferences)
    setCookOrEat(entry.choice)
    setTimeLimit(TIME_OPTIONS.find((option) => option.maxMinutes === entry.time)?.id ?? null)
    setBudget(entry.budget ?? 'any')
    setDietary(entry.dietary)
    setSurpriseMe(false)
  }

  function togglePreference(preference) {
    setPreferences((current) => toggleInList(current, preference))
  }

  // "No Restrictions" can't be combined with a real restriction, so:
  //   picking "none" clears everything else,
  //   picking anything else removes "none".
  function toggleDietary(option) {
    setDietary((current) => {
      if (option === 'none') return current.includes('none') ? [] : ['none']
      return toggleInList(current.filter((item) => item !== 'none'), option)
    })
  }

  const value = {
    mood,
    setMood,
    preferences,
    togglePreference,
    cookOrEat,
    setCookOrEat,
    surpriseMe,
    setSurpriseMe,
    timeLimit,
    setTimeLimit,
    budget,
    setBudget,
    dietary,
    toggleDietary,
    resetSelections,
    loadAnswers,
    smartSession,
    setSmartSession,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Small helper hook so pages can just call useAppContext() instead of
// importing useContext + AppContext every time.
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used inside an <AppProvider>')
  }
  return context
}

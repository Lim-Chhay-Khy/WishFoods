import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import MoodSelect from './pages/MoodSelect.jsx'
import PreferenceSelect from './pages/PreferenceSelect.jsx'
import CookOrRestaurant from './pages/CookOrRestaurant.jsx'
import Results from './pages/Results.jsx'
import SmartRecommend from './pages/SmartRecommend.jsx'
import RecipeDetails from './pages/RecipeDetails.jsx'
import Restaurants from './pages/Restaurants.jsx'
import Favorites from './pages/Favorites.jsx'
import History from './pages/History.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'

// Providers, from the outside in:
//   AuthProvider       who is logged in
//   FavoritesProvider  that user's favorites (needs AuthProvider)
//   AppProvider        the answers to the mood/preference questions
export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <AppProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mood" element={<MoodSelect />} />
            <Route path="/preferences" element={<PreferenceSelect />} />
            <Route path="/choice" element={<CookOrRestaurant />} />
            <Route path="/recommendations" element={<Results />} />
            <Route path="/smart-recommend" element={<SmartRecommend />} />
            <Route path="/recipe/:id" element={<RecipeDetails />} />
            <Route path="/restaurants/:foodId" element={<Restaurants />} />
            <Route path="/about" element={<About />} />

            {/* Stage 4: accounts */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Login required — ProtectedRoute sends visitors to /login */}
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Stage 1 URLs, kept so old links/bookmarks still work */}
            <Route path="/cook-or-restaurant" element={<Navigate to="/choice" replace />} />
            <Route path="/results" element={<Navigate to="/recommendations" replace />} />

            {/* Anything else */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}

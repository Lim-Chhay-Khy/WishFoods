import React, { useState } from 'react'
import { APIProvider, AdvancedMarker, InfoWindow, Map, Pin } from '@vis.gl/react-google-maps'
import './RestaurantMap.css'

// A BROWSER key (Maps JavaScript API). It's visible to anyone who opens
// the page, which is normal for map keys: protect it in Google Cloud by
// only allowing your website's address (see the README).
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
// A Map ID is needed for the modern markers. "DEMO_MAP_ID" is Google's
// free test id; you can make your own in Google Cloud later.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'

// Shows numbered pins for the restaurants (the numbers match the cards).
//   center:       { lat, lng } where the map starts
//   restaurants:  restaurants from the API (only ones with a location get a pin)
//   userLocation: { lat, lng } or null — shows a "you are here" dot
export default function RestaurantMap({ center, restaurants, userLocation }) {
  const [openId, setOpenId] = useState(null)
  const [failed, setFailed] = useState(false)

  if (!MAPS_API_KEY) {
    return (
      <p className="restaurant-map__note">
        Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env to see these restaurants on a map.
      </p>
    )
  }
  if (failed) {
    return <p className="restaurant-map__note">The map couldn’t load. Check your Maps API key.</p>
  }

  const pins = restaurants.filter((restaurant) => restaurant.location)
  const selected = pins.find((restaurant) => restaurant.id === openId)

  return (
    <div className="restaurant-map">
      <APIProvider apiKey={MAPS_API_KEY} onError={() => setFailed(true)}>
        <Map
          // A new key when the center changes makes the map jump there.
          key={`${center.lat},${center.lng}`}
          defaultCenter={center}
          defaultZoom={13}
          mapId={MAP_ID}
          gestureHandling="cooperative"
        >
          {userLocation && (
            <AdvancedMarker position={userLocation} title="You are here">
              <span className="restaurant-map__you" />
            </AdvancedMarker>
          )}

          {pins.map((restaurant) => (
            <AdvancedMarker
              key={restaurant.id}
              position={restaurant.location}
              title={restaurant.name}
              onClick={() => setOpenId(restaurant.id)}
            >
              <Pin
                glyph={String(restaurants.indexOf(restaurant) + 1)}
                background="#c9461f"
                borderColor="#a63716"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          ))}

          {selected && (
            <InfoWindow position={selected.location} onCloseClick={() => setOpenId(null)}>
              <div className="restaurant-map__info">
                <strong>{selected.name}</strong>
                {selected.rating != null && <span>★ {selected.rating}</span>}
                {selected.googleMapsUrl && (
                  <a href={selected.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  )
}

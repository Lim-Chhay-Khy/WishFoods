// Asks the browser for the user's location (the browser shows a
// permission pop-up the first time). Returns a Promise of { lat, lng }.
//
// The location is only sent to our Flask API for this one search. It is
// never saved.

const ERROR_MESSAGES = {
  1: 'Location permission was denied.',
  2: 'Your location isn’t available right now.',
  3: 'Finding your location took too long.',
}

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Your browser can’t share your location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new Error(ERROR_MESSAGES[error.code] || 'We couldn’t get your location.')),
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }, // reuse a location up to 5 minutes old
    )
  })
}

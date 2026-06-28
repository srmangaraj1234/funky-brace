// Google Maps utilities and loader helper.
// Connects to the script loading of VITE_GOOGLE_MAPS_API_KEY.

export function loadGoogleMaps() {
  console.log('Loading Google Maps API...');
  return Promise.resolve(window.google);
}

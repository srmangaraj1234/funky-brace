import { useState, useEffect } from 'react';

export default function useGeolocation(setUserLocation) {
  const [detectedLocation, setDetectedLocation] = useState("Bengaluru Ward");

  useEffect(() => {
    // Capture dynamic HTML5 Geolocation coordinates on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('Successfully captured user geolocation:', coords);
          setUserLocation(coords);

          // Reverse Geocode the coordinates to name the neighborhood/locality/city
          try {
            if (window.google && window.google.maps) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  const addressComponents = results[0].address_components;
                  let neighborhood = '';
                  let sublocality = '';
                  let city = '';
                  for (const comp of addressComponents) {
                    if (comp.types.includes('neighborhood')) {
                      neighborhood = comp.long_name;
                    }
                    if (comp.types.includes('sublocality') || comp.types.includes('sublocality_level_1')) {
                      sublocality = comp.long_name;
                    }
                    if (comp.types.includes('locality')) {
                      city = comp.long_name;
                    }
                  }
                  const locName = neighborhood || sublocality || city || results[0].formatted_address.split(',')[0];
                  if (locName) {
                    const finalLoc = city && locName !== city ? `${locName}, ${city}` : locName;
                    setDetectedLocation(finalLoc);
                  }
                }
              });
            }
          } catch (geocodingErr) {
            console.warn('Reverse geocoding of browser location failed:', geocodingErr);
          }
        },
        (error) => {
          console.warn('Geolocation capture failed or denied:', error.message);
          // If geolocation is unavailable, denied, or fails, do not substitute a fake location.
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setUserLocation(null);
    }
  }, [setUserLocation]);

  return { detectedLocation };
}

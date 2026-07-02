import { useState } from 'react';

export function useLocationService() {
  const parseCoordinatesFromAddress = (text) => {
    if (!text) return null;
    const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
    return null;
  };

  const geocodeAddress = (addr) => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        reject(new Error("Google Maps JavaScript API is not loaded yet."));
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addr }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ latitude: lat, longitude: lng });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  };

  const reverseGeocode = (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        reject(new Error("Google Maps JavaScript API is not loaded yet."));
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  };

  const detectLocation = ({ setAddress, setCoordinates, onDetectSuccess }) => {
    if (navigator.geolocation) {
      setAddress("Detecting location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { latitude: lat, longitude: lng };
          setCoordinates(coords);
          if (onDetectSuccess) {
            onDetectSuccess(coords);
          }
          
          try {
            const formattedAddress = await reverseGeocode(lat, lng);
            setAddress(formattedAddress);
          } catch (err) {
            console.warn("Reverse geocoding failed, falling back to raw coordinates:", err);
            setAddress(`Detected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        },
        (error) => {
          console.warn("Geolocation failed.", error);
          setAddress("");
          alert("Geolocation failed or was denied. Please type your location/address manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser. Please type your location/address manually.");
    }
  };

  return {
    parseCoordinatesFromAddress,
    geocodeAddress,
    reverseGeocode,
    detectLocation
  };
}

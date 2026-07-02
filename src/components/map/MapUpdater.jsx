import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

// MapUpdater helper to handle dynamic positioning and fits bounds
export default function MapUpdater({ userLocation, issues, resetTrigger }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  const performFit = () => {
    if (!map) return;

    if (issues && issues.length > 0) {
      // Automatically fit bounds to all reported issues so they are perfectly visible on screen
      const bounds = new window.google.maps.LatLngBounds();
      let hasCoords = false;
      issues.forEach((issue) => {
        if (issue.coordinates?.latitude && issue.coordinates?.longitude) {
          bounds.extend({
            lat: Number(issue.coordinates.latitude),
            lng: Number(issue.coordinates.longitude),
          });
          hasCoords = true;
        }
      });
      if (hasCoords) {
        map.fitBounds(bounds);
        // Prevent map from zooming in too tight if there's only one issue
        const listener = window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom() > 15) {
            map.setZoom(15);
          }
        });
      }
    } else if (userLocation) {
      // If no issues reported, center on the user's location
      map.panTo({ lat: Number(userLocation.latitude), lng: Number(userLocation.longitude) });
      map.setZoom(14);
    } else {
      // Broad global fallback
      map.setCenter({ lat: 20, lng: 0 });
      map.setZoom(2);
    }
  };

  // Run only once on mount / initial load
  useEffect(() => {
    if (!map) return;
    if (!hasFittedRef.current) {
      performFit();
      hasFittedRef.current = true;
    }
  }, [map, userLocation, issues]);

  // Run whenever the rocket/recenter button increments resetTrigger
  useEffect(() => {
    if (!map) return;
    if (resetTrigger > 0) {
      performFit();
    }
  }, [map, resetTrigger]);

  return null;
}

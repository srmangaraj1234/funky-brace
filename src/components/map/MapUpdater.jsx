import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useStore } from '../../store/index.js';

// MapUpdater helper to handle dynamic positioning and fit bounds
export default function MapUpdater({ userLocation, issues, resetTrigger }) {
  const map = useMap();
  const { loading } = useStore();
  const hasFittedRef = useRef(false);

  const performFit = () => {
    if (!map) return;

    if (issues && issues.length > 0) {
      // Fit bounds around all reported issues
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

        // Prevent excessive zoom when only one issue exists
        window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom() > 15) {
            map.setZoom(15);
          }
        });

        return;
      }
    }

    if (userLocation) {
      // No issues → center on user's location
      map.panTo({
        lat: Number(userLocation.latitude),
        lng: Number(userLocation.longitude),
      });
      map.setZoom(14);
      return;
    }

    // Final fallback when loading is complete and nothing exists
    map.setCenter({ lat: 22.59337, lng: 78.9629 });
    map.setZoom(5);
  };

  // Initial automatic fit
  useEffect(() => {
    if (!map || hasFittedRef.current) return;

    const hasIssues = Array.isArray(issues) && issues.length > 0;
    const hasGps = !!userLocation;

    // Wait while Firestore is still loading
    if (loading) return;

    // Firestore finished. Nothing exists -> show fallback.
    if (!hasIssues && !hasGps) {
      performFit();
      hasFittedRef.current = true;
      return;
    }

    // Real data is available -> fit once
    performFit();
    hasFittedRef.current = true;
  }, [map, loading, userLocation, issues]);

  // Recenter when the paper rocket button is clicked
  useEffect(() => {
    if (!map) return;

    if (resetTrigger > 0) {
      performFit();
    }
  }, [map, resetTrigger]);

  return null;
}

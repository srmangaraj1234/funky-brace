import { useMemo } from 'react';
import { getHaversineDistance } from '../utils/haversine.js';

export default function useDistanceLabel(user, userLocation, coordinates) {
  return useMemo(() => {
    if (!user) return null;
    if (!userLocation) return 'GPS off';
    if (!coordinates) return 'No location';
    
    const dist = getHaversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      coordinates.latitude,
      coordinates.longitude
    );
    
    if (dist == null || isNaN(dist)) return 'Unknown';
    if (dist < 1000) {
      return `${Math.round(dist)} m`;
    }
    return `${(dist / 1000).toFixed(1)} km`;
  }, [user, userLocation, coordinates]);
}

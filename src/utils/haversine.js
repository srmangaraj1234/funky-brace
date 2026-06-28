/**
 * Calculates the geodetic distance between two coordinates in meters
 * using the Haversine formula.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Geodetic distance in meters
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Checks if a coordinate is within a specified radius in meters of another coordinate.
 * @param {object} coord1 - { latitude, longitude }
 * @param {object} coord2 - { latitude, longitude }
 * @param {number} radiusMeters - Radius constraint (default 200m)
 * @returns {boolean} True if within radius
 */
export function isWithinRadius(coord1, coord2, radiusMeters = 200) {
  if (!coord1 || !coord2) return false;
  const dist = getHaversineDistance(
    coord1.latitude,
    coord1.longitude,
    coord2.latitude,
    coord2.longitude
  );
  return dist <= radiusMeters;
}

import { getHaversineDistance } from './haversine.js';

export const mapStatusLabel = (status) => {
  const mapping = {
    'Reported': 'Issue Raised',
    'Verified': 'Community Verified',
    'In Progress': 'Pending Action',
    'Resolved': 'Resolved'
  };
  return mapping[status] || status;
};

// Helper to compute distance string using the shared getHaversineDistance helper
export const getDistanceString = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const distanceMeters = getHaversineDistance(lat1, lon1, lat2, lon2);
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

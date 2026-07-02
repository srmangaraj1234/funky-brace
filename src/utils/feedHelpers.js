import { getHaversineDistance } from './haversine.js';

// Helper to parse Firestore Timestamp or date inputs to Date objects safely.
// Falls back to epoch (oldest possible) on any invalid/missing input so
// sorting never produces NaN.
export const parseDate = (dateInput) => {
  if (!dateInput) return new Date(0);
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    const d = dateInput.toDate();
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

// Filter, search, and sort logic. Distances for the 'nearby' filter are
// computed once per issue and cached, instead of being recalculated on
// every comparison inside .sort().
export const getFilteredIssues = (issues, searchQuery, activeFilter, userLocation) => {
  const safeIssues = issues || [];
  const query = (searchQuery || '').trim().toLowerCase();

  const matched = safeIssues.filter((issue) => {
    if (!query) return true;
    return (
      (issue.title && issue.title.toLowerCase().includes(query)) ||
      (issue.category && issue.category.toLowerCase().includes(query)) ||
      (issue.address && issue.address.toLowerCase().includes(query)) ||
      (issue.status && issue.status.toLowerCase().includes(query)) ||
      (issue.adminNotes && issue.adminNotes.toLowerCase().includes(query))
    );
  });

  const hasUserLocation =
    activeFilter === 'nearby' && userLocation && userLocation.latitude != null && userLocation.longitude != null;

  // Pre-compute distance once per issue (avoids recomputing on every
  // pairwise comparison the sort algorithm performs).
  const withDistance = matched.map((issue) => ({
    issue,
    distance: hasUserLocation
      ? getHaversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          issue.coordinates?.latitude,
          issue.coordinates?.longitude
        )
      : Infinity
  }));

  withDistance.sort((a, b) => {
    if (activeFilter === 'trending') {
      const upvotesDiff = (b.issue.upvotesCount || 0) - (a.issue.upvotesCount || 0);
      if (upvotesDiff !== 0) return upvotesDiff;
      return parseDate(b.issue.createdAt) - parseDate(a.issue.createdAt);
    }
    if (activeFilter === 'nearby' && hasUserLocation) {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return parseDate(b.issue.createdAt) - parseDate(a.issue.createdAt);
    }
    // Default ordering for 'all', 'new', and 'nearby' (without a known
    // location) is deterministic: newest first.
    return parseDate(b.issue.createdAt) - parseDate(a.issue.createdAt);
  });

  return withDistance.map((entry) => entry.issue);
};

import { useState } from 'react';
import { getHaversineDistance } from '../../../utils/haversine.js';

export function useDuplicateDetector(issues) {
  const [duplicateIssues, setDuplicateIssues] = useState([]);
  const [showDuplicatePanel, setShowDuplicatePanel] = useState(false);

  const checkDuplicates = (coords) => {
    if (!coords) return;
    const matches = issues.map(issue => {
      const dist = getHaversineDistance(
        coords.latitude,
        coords.longitude,
        issue.coordinates?.latitude,
        issue.coordinates?.longitude
      );
      return { ...issue, distance: dist };
    })
    .filter(issue => issue.distance <= 200 && issue.status !== 'Resolved')
    .sort((a, b) => a.distance - b.distance);

    if (matches.length > 0) {
      setDuplicateIssues(matches);
      setShowDuplicatePanel(true);
    } else {
      setDuplicateIssues([]);
      setShowDuplicatePanel(false);
    }
  };

  const resetDuplicates = () => {
    setDuplicateIssues([]);
    setShowDuplicatePanel(false);
  };

  return {
    duplicateIssues,
    showDuplicatePanel,
    setShowDuplicatePanel,
    checkDuplicates,
    resetDuplicates
  };
}

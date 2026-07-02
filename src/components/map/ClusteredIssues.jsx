import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';

// Standard Markers manager for individual issue pins
export default function ClusteredIssues({ issues, selectedIssueId, setSelectedIssueId }) {
  // To avoid overlapping markers, keep track of coordinates and apply a small spiral offset if they share the exact same location
  const coordCounts = {};

  return (
    <>
      {issues.map((issue) => {
        if (!issue.coordinates) return null;
        
        let lat = Number(issue.coordinates.latitude);
        let lng = Number(issue.coordinates.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return null;

        // Round coordinates to 5 decimal places (approx 1.1 meters) to group overlapping pins
        const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        if (coordCounts[coordKey] === undefined) {
          coordCounts[coordKey] = 0;
        } else {
          coordCounts[coordKey] += 1;
          const index = coordCounts[coordKey];
          // Distribute overlapping markers in a tiny circle around the core coordinate
          const angle = index * ((2 * Math.PI) / 8); // Spread across 8 directions
          const radius = 0.00015 * Math.ceil(index / 8); // Approx 15 meters offset per ring
          lat += Math.sin(angle) * radius;
          lng += Math.cos(angle) * radius;
        }

        const isSelected = selectedIssueId === issue.id;
        
        return (
          <AdvancedMarker
            key={issue.id}
            position={{ lat, lng }}
            onClick={() => setSelectedIssueId(issue.id)}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIssueId(issue.id);
              }}
              className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-4 ring-slate-800 scale-125 z-50 shadow-xl' : 'hover:scale-110'
              } ${
                issue.severity === 'high' ? 'bg-red-500' :
                issue.severity === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              title={`${issue.title} (${issue.severity} severity)`}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

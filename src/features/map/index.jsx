import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/index.js';
import { MapPin, Navigation, Plus, Minus, ThumbsUp, Image, AlertCircle, Globe } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { formatDate } from '../../utils/formatDate.js';
import { motion } from 'motion/react';
import { getHaversineDistance } from '../../utils/haversine.js';

const mapStatusLabel = (status) => {
  const mapping = {
    'Reported': 'Issue Raised',
    'Verified': 'Community Verified',
    'In Progress': 'Pending Action',
    'Resolved': 'Resolved'
  };
  return mapping[status] || status;
};

// MapUpdater helper to handle dynamic positioning and fits bounds
function MapUpdater({ userLocation, issues, resetTrigger }) {
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

// Standard Markers manager for individual issue pins
function ClusteredIssues({ issues, selectedIssueId, setSelectedIssueId }) {
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

export default function MapFeature() {
  const { issues, selectedIssueId, setSelectedIssueId, toggleUpvote, user, userLocation, searchQuery } = useStore();
  const [zoom, setZoom] = useState(14);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [mapTypeId, setMapTypeId] = useState('roadmap');
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  const filteredIssues = issues.filter((issue) => {
    const query = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !query || (
      (issue.title && issue.title.toLowerCase().includes(query)) ||
      (issue.category && issue.category.toLowerCase().includes(query)) ||
      (issue.address && issue.address.toLowerCase().includes(query)) ||
      (issue.status && issue.status.toLowerCase().includes(query))
    );

    const matchesPriority = priorityFilter === 'all' || (issue.severity && issue.severity.toLowerCase() === priorityFilter);

    return matchesSearch && matchesPriority;
  });

  const activeIssue = filteredIssues.find((i) => i.id === selectedIssueId) || issues.find((i) => i.id === selectedIssueId);

  const handleResetLocation = () => {
    // Reset selection and increment resetTrigger to force MapUpdater to re-fit map contents
    setSelectedIssueId(null);
    setResetTrigger((prev) => prev + 1);
  };

  // Helper to compute distance string using the shared getHaversineDistance helper
  const getDistanceString = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const distanceMeters = getHaversineDistance(lat1, lon1, lat2, lon2);
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)} m`;
    }
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  };

  const API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' && API_KEY !== 'undefined';

  return (
    <div className="space-y-4">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Civic Issue Map</h2>
          <p className="text-xs text-slate-400 font-semibold">
            {filteredIssues.length} total reports • {userLocation ? 'Showing nearby' : 'Global fit bounds'}
          </p>
        </div>
      </div>

      {/* 2. Map Canvas Box */}
      {!hasValidKey ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-[480px] flex flex-col justify-center items-center p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
            <MapPin className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h3 className="text-sm font-bold text-slate-800">Google Maps Key Required</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Please provide your <strong>VITE_GOOGLE_MAPS_API_KEY</strong> in AI Studio Secrets to enable the live interactive map.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-[10px] text-left text-slate-600 space-y-2 w-full">
            <p className="font-bold text-slate-700">How to add key:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Add <code>VITE_GOOGLE_MAPS_API_KEY</code></li>
              <li>Paste your key & press <strong>Enter</strong></li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-[480px] flex flex-col relative group">
          
          {/* Map Action Controls (Top Right) */}
          <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5">
            <button
              onClick={() => setZoom(Math.min(zoom + 1, 18))}
              className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs text-slate-600 active:scale-95 transition-all cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 1, 10))}
              className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs text-slate-600 active:scale-95 transition-all cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={handleResetLocation}
              className="p-2 bg-green-50 hover:bg-green-100 rounded-xl border border-green-100 shadow-xs text-green-600 active:scale-95 transition-all cursor-pointer"
              title="Recenter Map"
            >
              <Navigation className="w-4 h-4 fill-green-600 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setMapTypeId(mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap')}
              className={`p-2 rounded-xl border shadow-xs active:scale-95 transition-all cursor-pointer ${
                mapTypeId === 'hybrid'
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-600'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title={mapTypeId === 'hybrid' ? "Show Standard Map" : "Show Satellite View"}
            >
              <Globe className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Styled Google Maps View */}
          <div className="flex-1 relative overflow-hidden">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                zoom={zoom}
                mapTypeId={mapTypeId}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
                gestureHandling="greedy"
                disableDefaultUI={true}
              >
                {/* Dynamically pan/zoom the map to selected/current location */}
                <MapUpdater userLocation={userLocation} issues={filteredIssues} resetTrigger={resetTrigger} />

                {/* Pulsating user GPS location marker if available */}
                {userLocation && (
                  <AdvancedMarker position={{ lat: Number(userLocation.latitude), lng: Number(userLocation.longitude) }}>
                    <div className="relative flex items-center justify-center">
                      <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <div className="relative w-4.5 h-4.5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center" title="You are here">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  </AdvancedMarker>
                )}

                {/* Render Advanced Clustered Markers for issues */}
                <ClusteredIssues 
                  issues={filteredIssues} 
                  selectedIssueId={selectedIssueId} 
                  setSelectedIssueId={setSelectedIssueId} 
                />
              </Map>
            </APIProvider>
          </div>

          {/* Traffic light legend on bottom left (now an interactive filter control) */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-100/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/40 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-500 select-none max-w-[calc(100%-24px)] overflow-x-auto scrollbar-none">
            <button
              onClick={() => setPriorityFilter('all')}
              className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer whitespace-nowrap ${
                priorityFilter === 'all'
                  ? 'text-slate-800'
                  : 'hover:text-slate-700 text-slate-500'
              }`}
            >
              {priorityFilter === 'all' && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-lg border border-white/60 shadow-2xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 w-2 h-2 rounded-full bg-slate-400 border border-white shrink-0"></span>
              <span className="relative z-10">All</span>
            </button>
            <button
              onClick={() => setPriorityFilter('high')}
              className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer whitespace-nowrap ${
                priorityFilter === 'high'
                  ? 'text-rose-700'
                  : 'hover:text-slate-700 text-slate-500'
              }`}
            >
              {priorityFilter === 'high' && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-lg border border-white/60 shadow-2xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 w-2 h-2 rounded-full bg-red-500 border border-white shrink-0"></span>
              <span className="relative z-10">High Priority</span>
            </button>
            <button
              onClick={() => setPriorityFilter('medium')}
              className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer whitespace-nowrap ${
                priorityFilter === 'medium'
                  ? 'text-amber-700'
                  : 'hover:text-slate-700 text-slate-500'
              }`}
            >
              {priorityFilter === 'medium' && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-lg border border-white/60 shadow-2xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 w-2 h-2 rounded-full bg-yellow-500 border border-white shrink-0"></span>
              <span className="relative z-10">Medium Priority</span>
            </button>
            <button
              onClick={() => setPriorityFilter('low')}
              className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer whitespace-nowrap ${
                priorityFilter === 'low'
                  ? 'text-emerald-700'
                  : 'hover:text-slate-700 text-slate-500'
              }`}
            >
              {priorityFilter === 'low' && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-lg border border-white/60 shadow-2xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 w-2 h-2 rounded-full bg-green-500 border border-white shrink-0"></span>
              <span className="relative z-10">Low Priority</span>
            </button>
          </div>

          {/* Dynamic Pop-up Info Preview Drawer */}
          {activeIssue && (
            <div className="absolute bottom-14 left-3 right-3 z-30 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 animate-in slide-in-from-bottom-4 duration-300">
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                {activeIssue.imageUrl && activeIssue.imageIsSafe !== false ? (
                  <img
                    src={activeIssue.imageUrl}
                    alt={activeIssue.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-6 h-6 text-slate-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    activeIssue.severity === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                    activeIssue.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {activeIssue.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">
                    {activeIssue.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    activeIssue.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                    activeIssue.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {mapStatusLabel(activeIssue.status) || 'Issue Raised'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">{activeIssue.title}</h4>
                
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold flex-wrap">
                  <span className="truncate max-w-[150px]">{activeIssue.address}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-slate-500 font-bold">
                    {userLocation 
                      ? `${getDistanceString(userLocation.latitude, userLocation.longitude, activeIssue.coordinates?.latitude, activeIssue.coordinates?.longitude)} away`
                      : 'Distance unavailable'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span>{formatDate(activeIssue.createdAt)}</span>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3.5">
                <button
                  onClick={() => {
                    if (!user) {
                      if (window.confirm("Please Sign In with Google to upvote/validate issues. Would you like to sign in now?")) {
                        useStore.getState().loginWithGoogle();
                      }
                      return;
                    }
                    toggleUpvote(activeIssue.id, user.uid);
                  }}
                  className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all w-full sm:w-auto cursor-pointer ${
                    activeIssue.upvotedBy && Array.isArray(activeIssue.upvotedBy) && activeIssue.upvotedBy.includes(user?.uid)
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{activeIssue.upvotesCount}</span>
                </button>
                <button
                  onClick={() => setSelectedIssueId(null)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-all w-full sm:w-auto flex items-center justify-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

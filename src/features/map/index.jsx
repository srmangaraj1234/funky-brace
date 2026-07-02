import React, { useState } from 'react';
import { useStore } from '../../store/index.js';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

import MapUpdater from '../../components/map/MapUpdater.jsx';
import ClusteredIssues from '../../components/map/ClusteredIssues.jsx';
import MapControls from '../../components/map/MapControls.jsx';
import PriorityFilterBar from '../../components/map/PriorityFilterBar.jsx';
import IssuePreviewCard from '../../components/map/IssuePreviewCard.jsx';
import NoApiKeyFallback from '../../components/map/NoApiKeyFallback.jsx';
import { getDistanceString } from '../../utils/mapHelpers.js';

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
        <NoApiKeyFallback />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-[480px] flex flex-col relative group">
          
          {/* Map Action Controls (Top Right) */}
          <MapControls
            zoom={zoom}
            setZoom={setZoom}
            mapTypeId={mapTypeId}
            setMapTypeId={setMapTypeId}
            handleResetLocation={handleResetLocation}
          />

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
          <PriorityFilterBar
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
          />

          {/* Dynamic Pop-up Info Preview Drawer */}
          {activeIssue && (
            <IssuePreviewCard
              activeIssue={activeIssue}
              user={user}
              userLocation={userLocation}
              toggleUpvote={toggleUpvote}
              setSelectedIssueId={setSelectedIssueId}
              getDistanceString={getDistanceString}
            />
          )}
        </div>
      )}
    </div>
  );
}

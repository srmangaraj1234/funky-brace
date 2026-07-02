import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import StatsBar from './components/StatsBar.jsx';
import MapFeature from './features/map/index.jsx';
import FeedFeature from './features/feed/index.jsx';
import ReportFeature from './features/report/index.jsx';
import { useStore } from './store/index.js';

// Hooks
import useGreeting from './hooks/useGreeting.js';
import useGeolocation from './hooks/useGeolocation.js';
import useAuthSync from './hooks/useAuthSync.js';
import useResolutionBanner from './hooks/useResolutionBanner.js';

// Components
import ResolutionToast from './components/ResolutionToast.jsx';
import GreetingHeader from './components/GreetingHeader.jsx';
import GuestModeNotice from './components/GuestModeNotice.jsx';
import ResolvedIssueBanner from './components/ResolvedIssueBanner.jsx';

export default function App() {
  const { 
    setSelectedIssueId, 
    issues, 
    user, 
    setUser, 
    setRole, 
    setUserLocation,
    startSyncingIssues, 
    stopSyncingIssues 
  } = useStore();

  const [recentResolvedBanner, setRecentResolvedBanner] = useState(null);
  const [timeframe, setTimeframe] = useState('This week');

  // Custom Hooks
  const { greeting } = useGreeting();
  const { detectedLocation } = useGeolocation(setUserLocation);
  useAuthSync(setUser, setRole);
  const { resolutionBannerText, setResolutionBannerText } = useResolutionBanner(issues);

  // Sync Issues from Firestore on Mount
  useEffect(() => {
    startSyncingIssues();
    return () => {
      stopSyncingIssues();
    };
  }, [startSyncingIssues, stopSyncingIssues]);

  // Set initial selected issue once issues load
  useEffect(() => {
    if (issues.length > 0) {
      setSelectedIssueId(issues[0].id);
    }
  }, [issues, setSelectedIssueId]);

  // Track and update the bottom celebratory newly-resolved issue state
  useEffect(() => {
    const recentlyResolved = issues.find((i) => i.status === 'Resolved' && i.resolvedAt);
    if (recentlyResolved) {
      setRecentResolvedBanner(recentlyResolved);
    }
  }, [issues]);

  return (
    <div className="min-h-screen bg-[#fafcfb] text-slate-700 flex flex-col font-sans selection:bg-green-500/10 selection:text-green-900">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* Prominent High-Contrast Resolution Toast */}
      <ResolutionToast
        text={resolutionBannerText}
        onDismiss={() => setResolutionBannerText(null)}
      />

      {/* 2. Top Banner / Greeting Row */}
      <GreetingHeader
        detectedLocation={detectedLocation}
        greeting={greeting}
        user={user}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />

      {/* 3. Live Analytics Counters */}
      <StatsBar />

      {/* 4. High-Fidelity 3-Section Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-4">
        {/* Dynamic Warning for Anonymous Users */}
        {!user && <GuestModeNotice />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column - Geospatial Interactive Map */}
          <section className="lg:col-span-4 space-y-4">
            <MapFeature />
          </section>

          {/* Center Column - Current Issues Feed */}
          <section className="lg:col-span-4">
            <FeedFeature />
          </section>

          {/* Right Column - Raise New Issue Panel */}
          <section id="raise-issue-form" className="lg:col-span-4">
            <ReportFeature />
          </section>
        </div>
      </main>

      {/* 5. Bottom Section / High-contrast Resolved Issue Banner */}
      <ResolvedIssueBanner
        issue={recentResolvedBanner}
        onViewDetails={() => setSelectedIssueId(recentResolvedBanner.id)}
        onDismiss={() => setRecentResolvedBanner(null)}
      />
    </div>
  );
}

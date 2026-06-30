import React, { useEffect, useState, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import StatsBar from './components/StatsBar.jsx';
import MapFeature from './features/map/index.jsx';
import FeedFeature from './features/feed/index.jsx';
import ReportFeature from './features/report/index.jsx';
import { CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useStore } from './store/index.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase.js';

const getGreetingAndNextTransition = () => {
  const now = new Date();
  const hours = now.getHours();
  let greeting = "";
  let nextTransitionHour = 0;

  if (hours >= 5 && hours < 12) {
    greeting = "Good morning";
    nextTransitionHour = 12;
  } else if (hours >= 12 && hours < 17) {
    greeting = "Good afternoon";
    nextTransitionHour = 17;
  } else if (hours >= 17 && hours < 22) {
    greeting = "Good evening";
    nextTransitionHour = 22;
  } else {
    greeting = "Good night";
    nextTransitionHour = 5;
  }

  const nextTransitionDate = new Date(now);
  nextTransitionDate.setHours(nextTransitionHour, 0, 0, 0);
  
  if (nextTransitionDate <= now) {
    nextTransitionDate.setDate(nextTransitionDate.getDate() + 1);
  }

  const msToNextTransition = nextTransitionDate.getTime() - now.getTime();
  return { greeting, msToNextTransition };
};

export default function App() {
  const { 
    setSelectedIssueId, 
    issues, 
    user, 
    role,
    setUser, 
    setRole, 
    setUserLocation,
    startSyncingIssues, 
    stopSyncingIssues 
  } = useStore();

  const [recentResolvedBanner, setRecentResolvedBanner] = useState(null);
  const [resolutionBannerText, setResolutionBannerText] = useState(null);
  const [detectedLocation, setDetectedLocation] = useState("Bengaluru Ward");
  const prevResolvedIdsRef = useRef(null);

  const [timeframe, setTimeframe] = useState('This week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [greeting, setGreeting] = useState(() => {
    const { greeting } = getGreetingAndNextTransition();
    return greeting;
  });

  // Schedule dynamic greeting updates at the exact next transition
  useEffect(() => {
    let timeoutId;

    const scheduleNextUpdate = () => {
      const { greeting: currentGreeting, msToNextTransition } = getGreetingAndNextTransition();
      setGreeting(currentGreeting);

      timeoutId = setTimeout(() => {
        scheduleNextUpdate();
      }, msToNextTransition);
    };

    scheduleNextUpdate();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Close custom dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set initial selected issue
  useEffect(() => {
    if (issues.length > 0) {
      setSelectedIssueId(issues[0].id);
    }
  }, [issues, setSelectedIssueId]);

  // Sync Issues and Auth State
  useEffect(() => {
    // Start real-time Firestore sync for issues
    startSyncingIssues();

    // Capture dynamic HTML5 Geolocation coordinates on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('Successfully captured user geolocation:', coords);
          setUserLocation(coords);

          // Reverse Geocode the coordinates to name the neighborhood/locality/city
          try {
            if (window.google && window.google.maps) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  const addressComponents = results[0].address_components;
                  let neighborhood = '';
                  let sublocality = '';
                  let city = '';
                  for (const comp of addressComponents) {
                    if (comp.types.includes('neighborhood')) {
                      neighborhood = comp.long_name;
                    }
                    if (comp.types.includes('sublocality') || comp.types.includes('sublocality_level_1')) {
                      sublocality = comp.long_name;
                    }
                    if (comp.types.includes('locality')) {
                      city = comp.long_name;
                    }
                  }
                  const locName = neighborhood || sublocality || city || results[0].formatted_address.split(',')[0];
                  if (locName) {
                    const finalLoc = city && locName !== city ? `${locName}, ${city}` : locName;
                    setDetectedLocation(finalLoc);
                  }
                }
              });
            }
          } catch (geocodingErr) {
            console.warn('Reverse geocoding of browser location failed:', geocodingErr);
          }
        },
        (error) => {
          console.warn('Geolocation capture failed or denied:', error.message);
          // If geolocation is unavailable, denied, or fails, do not substitute a fake location.
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setUserLocation(null);
    }

    // Monitor Firebase Auth state change
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user authenticated:', firebaseUser.email);
        
        // Fetch or create user document in Firestore to check roles
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          let userRole = 'citizen';
          if (userDoc.exists()) {
            userRole = userDoc.data().role || 'citizen';
          }
          
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous Citizen',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'
          });
          setRole(userRole);
        } catch (dbErr) {
          if (dbErr.message && dbErr.message.includes('offline')) {
            console.warn('Firestore is offline. Proceeding with offline fallback user state.');
          } else {
            console.warn('Error fetching user document from Firestore (using fallback):', dbErr);
          }
          // Basic fallback if user collection permissions limit reading
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous Citizen',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'
          });
          setRole('citizen');
        }
      } else {
        console.log('Firebase user signed out.');
        setUser(null);
        setRole('citizen');
      }
    });

    return () => {
      stopSyncingIssues();
      unsubscribeAuth();
    };
  }, [startSyncingIssues, stopSyncingIssues, setUser, setRole, setUserLocation]);

  // Monitor resolved issues to update high-contrast banner for resolved issue
  useEffect(() => {
    const recentlyResolved = issues.find(i => i.status === 'Resolved' && i.resolvedAt);
    if (recentlyResolved) {
      setRecentResolvedBanner(recentlyResolved);
    }

    // Collect all currently resolved IDs
    const currentResolvedIds = new Set(
      issues.filter(i => i.status === 'Resolved').map(i => i.id)
    );

    // If it's the first time we load the issues, just initialize the ref and don't trigger banner
    if (prevResolvedIdsRef.current === null) {
      prevResolvedIdsRef.current = currentResolvedIds;
      return;
    }

    // Find any issue that is newly resolved
    const newlyResolvedId = [...currentResolvedIds].find(id => !prevResolvedIdsRef.current.has(id));
    if (newlyResolvedId) {
      const issue = issues.find(i => i.id === newlyResolvedId);
      if (issue) {
        setResolutionBannerText(`"${issue.title}" has been resolved!`);
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          setResolutionBannerText(null);
        }, 5000);
        
        // Always update the ref
        prevResolvedIdsRef.current = currentResolvedIds;
        return () => clearTimeout(timer);
      }
    }

    // Always update the ref
    prevResolvedIdsRef.current = currentResolvedIds;
  }, [issues]);

  return (
    <div className="min-h-screen bg-[#fafcfb] text-slate-700 flex flex-col font-sans selection:bg-green-500/10 selection:text-green-900">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* Prominent High-Contrast Resolution Banner */}
      {resolutionBannerText && (
        <div className="w-full bg-green-600 text-white font-extrabold py-3.5 px-4 md:px-8 shadow-lg flex items-center justify-between text-xs sm:text-sm animate-in slide-in-from-top duration-300 z-50">
          <div className="flex items-center space-x-2 max-w-5xl mx-auto w-full">
            <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <span className="truncate">{resolutionBannerText}</span>
          </div>
          <button 
            onClick={() => setResolutionBannerText(null)}
            className="p-1 text-white hover:bg-green-700 rounded-full transition-all shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Banner / Greeting Row */}
      <div className="px-4 md:px-8 pt-6 pb-2 max-w-7xl w-full mx-auto text-left">
        {/* Live Badge */}
        <div className="inline-flex items-center space-x-1.5 bg-green-50 border border-green-100/60 text-green-800 text-[11px] font-bold px-3 py-1 rounded-full mb-3 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Live — {detectedLocation} • Real-time Sync Active</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {greeting}, {user ? user.displayName.split(' ')[0] : 'Citizen'}.
            </h1>
            <p className="text-sm font-semibold text-slate-400">
              Here's what your neighborhood is reporting today.
            </p>
          </div>
          
          {/* Dropdown filter and Report issue button */}
          <div className="flex items-center space-x-3 self-start md:self-auto">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between space-x-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-full pl-5 pr-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all duration-200 select-none cursor-pointer"
              >
                <span>{timeframe}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-36 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100 text-left">
                  {['This week', 'This month', 'All-time'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTimeframe(option);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                        timeframe === option
                          ? 'bg-green-50 text-green-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const element = document.getElementById("raise-issue-form");
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center space-x-2 bg-[#111] hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md active:scale-98 transition-all"
            >
              <span>+ Report issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Analytics Counters (Derives directly from Firestore issues) */}
      <StatsBar />

      {/* 4. High-Fidelity 3-Section Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-4">
        {/* Dynamic Warning for Anonymous Users */}
        {!user && (
          <div className="mb-6 bg-green-50 border border-green-100/80 p-4 rounded-2xl text-left text-green-800 text-xs flex items-start space-x-3 shadow-xs">
            <span className="text-base">💡</span>
            <div>
              <p className="font-bold">You are currently in guest mode</p>
              <p className="text-slate-900 mt-0.5 leading-relaxed">
                Sign in with Google using the button in the top right to report civic issues and upvote existing reports.
              </p>
            </div>
          </div>
        )}

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
      {recentResolvedBanner && (
        <div className="w-full bg-green-50 border-t border-green-100/60 py-4 px-4 md:px-8 text-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 mt-8 relative animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm border border-green-300">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">Newly Resolved Issue! 🎉</span>
                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                  Status: Closed
                </span>
              </div>
              <p className="text-xs text-slate-700 font-extrabold max-w-2xl leading-normal mt-0.5">
                "{recentResolvedBanner.title}"
              </p>
              <p className="text-[11px] text-slate-500 font-semibold max-w-2xl leading-relaxed">
                Admin Note: {recentResolvedBanner.adminNotes || 'Successfully repaired by municipal team.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button 
              onClick={() => setSelectedIssueId(recentResolvedBanner.id)}
              className="flex items-center space-x-1 bg-[#111] hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              <span>View details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setRecentResolvedBanner(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

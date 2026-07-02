import React, { useState, useEffect, useRef } from 'react';

export default function GreetingHeader({
  detectedLocation,
  greeting,
  user,
  timeframe,
  setTimeframe
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
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
  );
}

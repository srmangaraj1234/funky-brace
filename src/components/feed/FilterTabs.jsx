import React from 'react';
import { ClipboardList, Compass, Flame, Clock } from 'lucide-react';

export default function FilterTabs({ activeFilter, setActiveFilter }) {
  return (
    <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/40">
      <button
        onClick={() => setActiveFilter('all')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeFilter === 'all'
            ? 'bg-white text-slate-800 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <ClipboardList className="w-3.5 h-3.5" />
        <span>All</span>
      </button>
      <button
        onClick={() => setActiveFilter('nearby')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeFilter === 'nearby'
            ? 'bg-white text-slate-800 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Compass className="w-3.5 h-3.5" />
        <span>Nearby</span>
      </button>
      <button
        onClick={() => setActiveFilter('trending')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeFilter === 'trending'
            ? 'bg-white text-slate-800 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Flame className="w-3.5 h-3.5 text-amber-500" />
        <span>Trending</span>
      </button>
      <button
        onClick={() => setActiveFilter('new')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeFilter === 'new'
            ? 'bg-white text-slate-800 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>New</span>
      </button>
    </div>
  );
}

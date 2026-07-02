import React from 'react';
import { motion } from 'motion/react';

export default function PriorityFilterBar({ priorityFilter, setPriorityFilter }) {
  return (
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
  );
}

import React from 'react';
import { getStatusCapsule, mapStatusLabel } from '../utils/statusStyle.js';

export default function IssueBadges({ category, severity, status }) {
  return (
    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5 z-10">
      <span className="text-[10px] font-bold text-slate-700 bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
        {category}
      </span>
      {severity === 'high' && (
        <span className="bg-rose-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
          High
        </span>
      )}
      {severity === 'medium' && (
        <span className="bg-amber-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
          Medium
        </span>
      )}
      {severity === 'low' && (
        <span className="bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
          Low
        </span>
      )}
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider shadow-sm ${getStatusCapsule(status)}`}>
        {mapStatusLabel(status)}
      </span>
    </div>
  );
}

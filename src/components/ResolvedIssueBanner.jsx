import React from 'react';
import { CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function ResolvedIssueBanner({ issue, onViewDetails, onDismiss }) {
  if (!issue) return null;

  return (
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
            "{issue.title}"
          </p>
          <p className="text-[11px] text-slate-500 font-semibold max-w-2xl leading-relaxed">
            Admin Note: {issue.adminNotes || 'Successfully repaired by municipal team.'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <button 
          onClick={onViewDetails}
          className="flex items-center space-x-1 bg-[#111] hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>View details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={onDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

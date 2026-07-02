import React from 'react';
import { AlertCircle, Image, ThumbsUp } from 'lucide-react';

const getDaysOpen = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function DuplicatePanel({ duplicateIssues, onDuplicateUpvote, onContinue }) {
  if (!duplicateIssues || duplicateIssues.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl text-left space-y-3.5 shadow-sm animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-start space-x-2.5">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-amber-800">Duplicate Issue Check — Similarity Detected</h4>
          <p className="text-[10px] text-amber-600 leading-relaxed font-semibold">
            An issue matching your coordinates was already logged recently. Would you prefer to upvote/validate it instead of filing a duplicate?
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {duplicateIssues.map((dup) => (
          <div key={dup.id} className="bg-white border border-amber-100 p-3 rounded-xl space-y-2 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-bold text-slate-800 truncate">{dup.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{dup.address}</p>
                <div className="flex items-center space-x-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-sm">
                    {dup.distance} meters away
                  </span>
                  <span>•</span>
                  <span>{getDaysOpen(dup.createdAt)} days open</span>
                  <span>•</span>
                  <span className="capitalize">{dup.severity} severity</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {dup.imageUrl && dup.imageIsSafe !== false ? (
                  <img 
                    src={dup.imageUrl} 
                    alt="Duplicate thumbnail" 
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <Image className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => onDuplicateUpvote(dup.id)}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-[10px] font-bold transition-all bg-green-600 text-white border-green-600 shadow-xs hover:bg-green-700 active:scale-95 cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-white" />
                <span>This is the same issue → Upvote</span>
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="py-2 px-3 rounded-lg border text-[10px] font-bold transition-all bg-white border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                Mine is different → Continue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

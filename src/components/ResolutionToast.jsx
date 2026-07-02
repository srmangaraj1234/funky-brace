import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function ResolutionToast({ text, onDismiss }) {
  if (!text) return null;

  return (
    <div className="w-full bg-green-600 text-white font-extrabold py-3.5 px-4 md:px-8 shadow-lg flex items-center justify-between text-xs sm:text-sm animate-in slide-in-from-top duration-300 z-50">
      <div className="flex items-center space-x-2 max-w-5xl mx-auto w-full">
        <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[2.5]" />
        <span className="truncate">{text}</span>
      </div>
      <button 
        onClick={onDismiss}
        className="p-1 text-white hover:bg-green-700 rounded-full transition-all shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

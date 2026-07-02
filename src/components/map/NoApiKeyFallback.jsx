import React from 'react';
import { MapPin } from 'lucide-react';

export default function NoApiKeyFallback() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-[480px] flex flex-col justify-center items-center p-6 text-center space-y-4">
      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
        <MapPin className="w-6 h-6 stroke-[2.2]" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-sm font-bold text-slate-800">Google Maps Key Required</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Please provide your <strong>VITE_GOOGLE_MAPS_API_KEY</strong> in AI Studio Secrets to enable the live interactive map.
        </p>
      </div>
      <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-[10px] text-left text-slate-600 space-y-2 w-full">
        <p className="font-bold text-slate-700">How to add key:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
          <li>Select <strong>Secrets</strong></li>
          <li>Add <code>VITE_GOOGLE_MAPS_API_KEY</code></li>
          <li>Paste your key & press <strong>Enter</strong></li>
        </ol>
      </div>
    </div>
  );
}

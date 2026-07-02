import React from 'react';
import { Plus, Minus, Navigation, Globe } from 'lucide-react';

export default function MapControls({ zoom, setZoom, mapTypeId, setMapTypeId, handleResetLocation }) {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5">
      <button
        onClick={() => setZoom(Math.min(zoom + 1, 18))}
        className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs text-slate-600 active:scale-95 transition-all cursor-pointer"
        title="Zoom In"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>
      <button
        onClick={() => setZoom(Math.max(zoom - 1, 10))}
        className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs text-slate-600 active:scale-95 transition-all cursor-pointer"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4 stroke-[2.5]" />
      </button>
      <button
        onClick={handleResetLocation}
        className="p-2 bg-green-50 hover:bg-green-100 rounded-xl border border-green-100 shadow-xs text-green-600 active:scale-95 transition-all cursor-pointer"
        title="Recenter Map"
      >
        <Navigation className="w-4 h-4 fill-green-600 stroke-[2.5]" />
      </button>
      <button
        onClick={() => setMapTypeId(mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap')}
        className={`p-2 rounded-xl border shadow-xs active:scale-95 transition-all cursor-pointer ${
          mapTypeId === 'hybrid'
            ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-600'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
        }`}
        title={mapTypeId === 'hybrid' ? "Show Standard Map" : "Show Satellite View"}
      >
        <Globe className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
}

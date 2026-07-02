import React from 'react';
import { ClipboardList } from 'lucide-react';

export default function EmptyState({ searchQuery }) {
  return (
    <div className="py-12 px-4 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
      <ClipboardList className="w-10 h-10 text-slate-300 mx-auto stroke-[1.5]" />
      <h3 className="text-slate-700 font-bold text-sm mt-3">No matching issues found</h3>
      <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
        {searchQuery
          ? `We couldn't find any issues matching "${searchQuery}". Try refining your search query or switching filters.`
          : 'There are no issues to show for this filter yet. Try switching filters.'}
      </p>
    </div>
  );
}

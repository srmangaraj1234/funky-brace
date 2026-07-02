import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import CustomStatusSelect from './CustomStatusSelect.jsx';

export default function AdminResolutionPanel({
  selectedIssue,
  status,
  setStatus,
  adminNotes,
  setAdminNotes,
  isSubmitting,
  errorToast,
  handleSaveActions
}) {
  if (!selectedIssue) return null;

  return (
    <div className="bg-green-50 border border-green-200 p-5 rounded-2xl text-slate-800 text-left space-y-4 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <h3 className="font-extrabold text-sm text-green-900">Administrative Resolution Panel</h3>
        </div>
        <span className="text-[10px] bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-200/50">
          Selected: {selectedIssue.id.substring(0, 8)}...
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        You are managing report: <strong className="text-slate-800">"{selectedIssue.title}"</strong>.
        Assign progress, resolve issues, and send automatic email updates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5 md:col-span-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Update Status</label>
          <CustomStatusSelect value={status} onChange={setStatus} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Official Action Notes</label>
          <textarea
            rows="1"
            placeholder="E.g., Assigned to utility team. Repair team dispatched to location..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
      </div>

      {errorToast && (
        <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {errorToast}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveActions}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
        >
          {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          <span>Save Actions</span>
        </button>
      </div>
    </div>
  );
}

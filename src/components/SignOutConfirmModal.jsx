import React from 'react';

export default function SignOutConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left"
      >
        <h3 className="text-base font-bold text-slate-800">Sign Out</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Are you sure you want to sign out of FixMyCity? You will need to sign back in to report issues or upvote community reports.
        </p>
        <div className="flex items-center justify-end space-x-2.5 mt-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

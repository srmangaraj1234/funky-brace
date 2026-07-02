import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessToast({ show }) {
  if (!show) return null;

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-2xl flex items-center space-x-3 text-left animate-in slide-in-from-bottom-5 duration-300">
      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">Status Updated Successfully</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          The issue record has been updated. The reporting citizen will be notified if email delivery succeeds.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { CheckCircle, Sparkles, FileText } from 'lucide-react';

export default function SubmissionSuccess({ submissionData, onDownloadReceipt, onResetForm }) {
  const { id, category, severity, address } = submissionData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center space-y-6 animate-in zoom-in-95 duration-350 text-left">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto border border-green-100">
        <CheckCircle className="w-8 h-8 stroke-[2.2]" />
      </div>
      <div className="space-y-1.5 text-center">
        <h3 className="text-lg font-bold text-slate-800">Issue Submitted! 🎉</h3>
        <p className="text-xs text-slate-400">Your issue was recorded with Reference ID: <strong className="text-slate-700">{id}</strong>.</p>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3.5 text-left">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span>AI Auto-Filing Details</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-400">Category</p>
            <p className="font-bold text-slate-800 capitalize mt-0.5">{category}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400">Severity</p>
            <p className="font-bold text-slate-800 capitalize mt-0.5">{severity}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-slate-400">Location</p>
            <p className="font-bold text-slate-800 mt-0.5 truncate">{address}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={onDownloadReceipt}
          className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-green-600/10 transition-all text-sm active:scale-98 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Download PDF Receipt</span>
        </button>
        <button
          onClick={onResetForm}
          className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
        >
          Report Another Issue
        </button>
      </div>
    </div>
  );
}

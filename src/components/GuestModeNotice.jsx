import React from 'react';

export default function GuestModeNotice() {
  return (
    <div className="mb-6 bg-green-50 border border-green-100/80 p-4 rounded-2xl text-left text-green-800 text-xs flex items-start space-x-3 shadow-xs">
      <span className="text-base">💡</span>
      <div>
        <p className="font-bold">You are currently in guest mode</p>
        <p className="text-slate-900 mt-0.5 leading-relaxed">
          Sign in with Google using the button in the top right to report civic issues and upvote existing reports.
        </p>
      </div>
    </div>
  );
}

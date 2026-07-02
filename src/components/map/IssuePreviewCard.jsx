import React from 'react';
import { ThumbsUp, Image } from 'lucide-react';
import { formatDate } from '../../utils/formatDate.js';
import { mapStatusLabel } from '../../utils/mapHelpers.js';
import { useStore } from '../../store/index.js';

export default function IssuePreviewCard({
  activeIssue,
  user,
  userLocation,
  toggleUpvote,
  setSelectedIssueId,
  getDistanceString,
}) {
  return (
    <div className="absolute bottom-14 left-3 right-3 z-30 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
        {activeIssue.imageUrl && activeIssue.imageIsSafe !== false ? (
          <img
            src={activeIssue.imageUrl}
            alt={activeIssue.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image className="w-6 h-6 text-slate-300" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            activeIssue.severity === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
            activeIssue.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
            'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            {activeIssue.severity}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">
            {activeIssue.category}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
            activeIssue.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
            activeIssue.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
            'bg-slate-50 text-slate-600 border-slate-100'
          }`}>
            {mapStatusLabel(activeIssue.status) || 'Issue Raised'}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">{activeIssue.title}</h4>
        
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold flex-wrap">
          <span className="truncate max-w-[150px]">{activeIssue.address}</span>
          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
          <span className="text-slate-500 font-bold">
            {userLocation 
              ? `${getDistanceString(userLocation.latitude, userLocation.longitude, activeIssue.coordinates?.latitude, activeIssue.coordinates?.longitude)} away`
              : 'Distance unavailable'}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
          <span>{formatDate(activeIssue.createdAt)}</span>
        </div>
      </div>

      <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3.5">
        <button
          onClick={() => {
            if (!user) {
              if (window.confirm("Please Sign In with Google to upvote/validate issues. Would you like to sign in now?")) {
                useStore.getState().loginWithGoogle();
              }
              return;
            }
            toggleUpvote(activeIssue.id, user.uid);
          }}
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all w-full sm:w-auto cursor-pointer ${
            activeIssue.upvotedBy && Array.isArray(activeIssue.upvotedBy) && activeIssue.upvotedBy.includes(user?.uid)
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{activeIssue.upvotesCount}</span>
        </button>
        <button
          onClick={() => setSelectedIssueId(null)}
          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-all w-full sm:w-auto flex items-center justify-center cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

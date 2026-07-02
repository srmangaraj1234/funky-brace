import React, { useState } from 'react';
import { useStore } from '../store/index.js';
import { ThumbsUp, MapPin, Clock, FileDown, Image, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate.js';
import useDistanceLabel from '../hooks/useDistanceLabel.js';
import { generateIssueReceipt } from '../services/pdfReceiptGenerator.js';
import IssueBadges from './IssueBadges.jsx';
import DeleteConfirmModal from './DeleteConfirmModal.jsx';
import { mapStatusLabel } from '../utils/statusStyle.js';

export default function IssueCard({ issue }) {
  const { selectedIssueId, setSelectedIssueId, toggleUpvote, user, role, userLocation } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isSelected = selectedIssueId === issue.id;
  const isUpvoted = issue.upvotedBy && Array.isArray(issue.upvotedBy) ? issue.upvotedBy.includes(user?.uid) : false;

  const distanceStr = useDistanceLabel(user, userLocation, issue.coordinates);

  const handleUpvote = (e) => {
    e.stopPropagation();
    if (!user) {
      if (window.confirm("Please Sign In with Google to upvote/validate issues. Would you like to sign in now?")) {
        useStore.getState().loginWithGoogle();
      }
      return;
    }
    toggleUpvote(issue.id, user.uid);
  };

  const handleDownloadReceipt = (e) => {
    e.stopPropagation();
    generateIssueReceipt(issue);
  };

  const handleDeleteConfirm = () => {
    useStore.getState().deleteIssue(issue.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      onClick={() => setSelectedIssueId(issue.id)}
      className={`bg-white border rounded-2xl transition-all duration-300 text-left cursor-pointer flex flex-col overflow-hidden ${
        isSelected
          ? 'border-green-500/80 shadow-md ring-3 ring-green-500/5'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Thumbnail / Image container */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100 flex items-center justify-center">
        {issue.imageUrl && issue.imageIsSafe !== false ? (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center select-none">
            <Image className="w-8 h-8 stroke-[1.5]" />
            <span className="text-xs font-semibold mt-2">No Image Provided</span>
          </div>
        )}

        {/* Bottom overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

        {/* Badges/Tags overlayed at the bottom of the image */}
        <IssueBadges
          category={issue.category}
          severity={issue.severity}
          status={issue.status}
        />
      </div>

      {/* Details body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-sm font-bold text-slate-800 leading-snug hover:text-green-600 transition-colors">
            {issue.title}
          </h3>

          {/* Location Pin */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-xs text-slate-500">{issue.address}</span>
          </div>

          {/* Description */}
          <p className={`text-xs text-slate-500/95 leading-relaxed ${isSelected ? '' : 'line-clamp-2'}`}>
            {issue.description || "No additional details provided."}
          </p>

          {isSelected && issue.adminNotes && (
            <div className="text-xs text-green-700 font-semibold bg-green-50/60 p-2.5 rounded-xl border border-green-100 animate-in fade-in duration-200 mt-2">
              <strong>Municipal Action:</strong> {issue.adminNotes}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-1" />

        {/* Bottom row: Meta details and Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Meta details (Left side) */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1 text-slate-500">
              <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
              <span>{issue.upvotesCount} upvotes</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(issue.createdAt)}</span>
            </span>
            {user && distanceStr && (
              <>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/60 shadow-2xs">
                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{distanceStr}</span>
                </span>
              </>
            )}
          </div>

          {/* Button controls (Right side) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {role !== 'admin' && (
              <button
                onClick={handleUpvote}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                  isUpvoted
                    ? 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-500'
                    : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                }`}
              >
                <span>↑ Validate</span>
              </button>
            )}

            {/* PDF Receipt download */}
            <button
              onClick={handleDownloadReceipt}
              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all border border-slate-200 bg-white"
              title="Download PDF Receipt"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>

            {/* Delete (Admin exclusive) */}
            {role === 'admin' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-all border border-rose-200 bg-white"
                title="Permanently Delete Issue"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Beautiful Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

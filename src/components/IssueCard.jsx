import React from 'react';
import { useStore } from '../store/index.js';
import { ThumbsUp, MapPin, Clock, AlertTriangle, FileDown, Sparkles, CheckCircle2, Image, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate.js';
import { getSeverityStyle } from '../utils/severityColor.js';
import { jsPDF } from 'jspdf';
import { getHaversineDistance } from '../utils/haversine.js';

const mapStatusLabel = (status) => {
  const mapping = {
    'Reported': 'Issue Raised',
    'Verified': 'Community Verified',
    'In Progress': 'Pending Action',
    'Resolved': 'Resolved'
  };
  return mapping[status] || status;
};

export default function IssueCard({ issue }) {
  const { selectedIssueId, setSelectedIssueId, toggleUpvote, user, role, userLocation } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const isSelected = selectedIssueId === issue.id;
  const isUpvoted = issue.upvotedBy && Array.isArray(issue.upvotedBy) ? issue.upvotedBy.includes(user?.uid) : false;

  const distanceStr = React.useMemo(() => {
    if (!user) return null;
    if (!userLocation) return 'GPS off';
    if (!issue.coordinates) return 'No location';
    const dist = getHaversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      issue.coordinates.latitude,
      issue.coordinates.longitude
    );
    if (dist == null || isNaN(dist)) return 'Unknown';
    if (dist < 1000) {
      return `${Math.round(dist)} m`;
    }
    return `${(dist / 1000).toFixed(1)} km`;
  }, [user, userLocation, issue.coordinates]);

  // Re-map status style for clean mockup capsule colors
  const getStatusCapsule = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-[#edf7ed] text-[#1e4620] border-[#d4edd6]';
      case 'In Progress':
        return 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]';
      case 'Verified':
        return 'bg-[#eff6ff] text-[#1e40af] border-[#dbeafe]';
      case 'Reported':
      default:
        return 'bg-[#fef2f2] text-[#991b1b] border-[#fee2e2]';
    }
  };

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
    try {
      const doc = new jsPDF();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, "F");
      
      // Header Banner
      doc.setFillColor(34, 197, 94); 
      doc.rect(0, 0, 210, 45, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.text("FIXMYCITY CIVIC RECORD", 20, 28);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text("OFFICIAL LOCAL CITIZEN DISPATCH REPORT", 20, 36);

      // Card Frame
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 55, 180, 220, 4, 4, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 55, 180, 220, 4, 4, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("REPORT DETAIL RECEIPT", 25, 70);

      doc.setDrawColor(226, 232, 240);
      doc.line(25, 75, 185, 75);

      const fields = [
        ["Report Identifier", issue.id],
        ["Civic Title", issue.title],
        ["Issue Category", issue.category],
        ["Severity Level", issue.severity.toUpperCase()],
        ["Current Location", issue.address],
        ["Reporting Date", formatDate(issue.createdAt)],
        ["Verification Status", mapStatusLabel(issue.status)],
        ["Community Upvotes", String(issue.upvotesCount)],
        ["Reporter Profile", issue.creatorName || "Anonymous Citizen"],
      ];

      let yPos = 90;
      doc.setFontSize(10);
      fields.forEach(([label, value]) => {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(label, 25, yPos);
        
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        
        const splitText = doc.splitTextToSize(value, 110);
        doc.text(splitText, 75, yPos);
        
        yPos += Math.max(12, splitText.length * 6);
      });

      doc.save(`FixMyCity-${issue.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
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
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5 z-10">
          <span className="text-[10px] font-bold text-slate-700 bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
            {issue.category}
          </span>
          {issue.severity === 'high' && (
            <span className="bg-rose-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
              High
            </span>
          )}
          {issue.severity === 'medium' && (
            <span className="bg-amber-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
              Medium
            </span>
          )}
          {issue.severity === 'low' && (
            <span className="bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
              Low
            </span>
          )}
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider shadow-sm ${getStatusCapsule(issue.status)}`}>
            {mapStatusLabel(issue.status)}
          </span>
        </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left"
          >
            <h3 className="text-base font-bold text-slate-800">Permanently Delete Issue?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This will permanently delete the issue from the database. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2.5 mt-5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  useStore.getState().deleteIssue(issue.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


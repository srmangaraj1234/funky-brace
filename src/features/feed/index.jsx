import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/index.js';
import IssueCard from '../../components/IssueCard.jsx';
import { Loader2 } from 'lucide-react';

import AdminResolutionPanel from '../../components/feed/AdminResolutionPanel.jsx';
import FilterTabs from '../../components/feed/FilterTabs.jsx';
import SuccessToast from '../../components/feed/SuccessToast.jsx';
import EmptyState from '../../components/feed/EmptyState.jsx';
import { getFilteredIssues } from '../../utils/feedHelpers.js';

export default function FeedFeature() {
  const {
    issues,
    activeFilter,
    setActiveFilter,
    searchQuery,
    selectedIssueId,
    userLocation,
    role,
    updateIssueStatus
  } = useStore();

  const [status, setStatus] = useState('Reported');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const selectedIssue = issues?.find((i) => i.id === selectedIssueId) || null;

  // Sync dropdown and notes when selected issue changes; reset to defaults
  // when nothing is selected (or the previously selected issue disappears).
  useEffect(() => {
    if (selectedIssue) {
      setStatus(selectedIssue.status || 'Reported');
      setAdminNotes(selectedIssue.adminNotes || '');
    } else {
      setStatus('Reported');
      setAdminNotes('');
    }
    // Depend on primitive values rather than the whole object, so this only
    // re-runs when the meaningful fields actually change.
  }, [selectedIssueId, selectedIssue?.status, selectedIssue?.adminNotes]);

  // Whether data has not arrived yet (vs. genuinely empty results)
  const isLoading = issues == null;

  // Filter, search, and sort logic. Distances for the 'nearby' filter are
  // computed once per issue and cached, instead of being recalculated on
  // every comparison inside .sort().
  const filteredIssues = useMemo(() => {
    return getFilteredIssues(issues, searchQuery, activeFilter, userLocation);
  }, [issues, searchQuery, activeFilter, userLocation]);

  const handleSaveActions = async () => {
    if (!selectedIssue) return;
    if (status === 'Resolved' && !adminNotes.trim()) {
      setErrorToast('Official Action Notes are required when marking an issue as Resolved.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }
    setIsSubmitting(true);

    try {
      await updateIssueStatus(selectedIssue.id, status, adminNotes);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorToast('Status update failed: ' + error.message);
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="current-issues-feed" className="space-y-6">
      {/* Feed Filters */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-3">
        <div className="text-left">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Current Issues</h2>
          <p className="text-xs text-slate-400 font-medium">
            {activeFilter === 'all' && 'All community reports in your city'}
            {activeFilter === 'nearby' && 'Closest reports to your location'}
            {activeFilter === 'trending' && 'Most upvoted and actively discussed'}
            {activeFilter === 'new' && 'Most recently reported issues'}
          </p>
        </div>

        {/* Filters bar */}
        <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </div>

      {/* Admin Quick Action Panel Overlay when user role is Municipal Admin */}
      {role === 'admin' && selectedIssue && (
        <AdminResolutionPanel
          selectedIssue={selectedIssue}
          status={status}
          setStatus={setStatus}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          isSubmitting={isSubmitting}
          errorToast={errorToast}
          handleSaveActions={handleSaveActions}
        />
      )}

      {/* Status update confirmation toast */}
      <SuccessToast show={successToast} />

      {/* Issues Cards List */}
      <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3 py-2" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading issues...</span>
            </div>
          </div>
        ) : filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
        ) : (
          <EmptyState searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}

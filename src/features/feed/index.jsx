import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../store/index.js';
import IssueCard from '../../components/IssueCard.jsx';
import { Compass, Flame, Clock, ClipboardList, CheckCircle2, ShieldCheck, RefreshCw, ChevronDown, Check, Loader2 } from 'lucide-react';
import { getHaversineDistance } from '../../utils/haversine.js';

function CustomStatusSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const options = [
    { value: 'Verified', label: 'Community Verified' },
    { value: 'In Progress', label: 'Pending Action' },
    { value: 'Resolved', label: 'Resolved' }
  ];

  // Close when clicking/tapping outside (pointerdown covers mouse, touch, and pen)
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  // Keep the active (highlighted) option in sync with the current value whenever the menu opens
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, value]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        handleSelect(options[activeIndex].value);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setActiveIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    }
  };

  let selectedLabel = 'Issue Raised';
  const foundOpt = options.find((opt) => opt.value === value);
  if (foundOpt) {
    selectedLabel = foundOpt.label;
  } else if (value === 'Reported') {
    selectedLabel = 'Issue Raised';
  } else {
    selectedLabel = value;
  }

  const listboxId = 'status-select-listbox';

  return (
    <div className="relative w-full" ref={containerRef} id="status-select-container">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `status-option-${options[activeIndex].value}` : undefined}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-all flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer ${
          isOpen ? 'border-green-500 ring-2 ring-green-500/20 bg-white' : 'border-slate-200 hover:bg-slate-50'
        }`}
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-green-600' : ''}`} />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 overflow-y-auto"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`status-option-${option.value}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(option.value)}
                className={`px-3.5 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-green-50 text-green-800 font-bold'
                    : isActive
                    ? 'bg-slate-50 text-slate-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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

  // Helper to parse Firestore Timestamp or date inputs to Date objects safely.
  // Falls back to epoch (oldest possible) on any invalid/missing input so
  // sorting never produces NaN.
  const parseDate = (dateInput) => {
    if (!dateInput) return new Date(0);
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      const d = dateInput.toDate();
      return isNaN(d.getTime()) ? new Date(0) : d;
    }
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  // Whether data has not arrived yet (vs. genuinely empty results)
  const isLoading = issues == null;

  // Filter, search, and sort logic. Distances for the 'nearby' filter are
  // computed once per issue and cached, instead of being recalculated on
  // every comparison inside .sort().
  const filteredIssues = useMemo(() => {
    const safeIssues = issues || [];
    const query = (searchQuery || '').trim().toLowerCase();

    const matched = safeIssues.filter((issue) => {
      if (!query) return true;
      return (
        (issue.title && issue.title.toLowerCase().includes(query)) ||
        (issue.category && issue.category.toLowerCase().includes(query)) ||
        (issue.address && issue.address.toLowerCase().includes(query)) ||
        (issue.status && issue.status.toLowerCase().includes(query)) ||
        (issue.adminNotes && issue.adminNotes.toLowerCase().includes(query))
      );
    });

    const hasUserLocation =
      activeFilter === 'nearby' && userLocation && userLocation.latitude != null && userLocation.longitude != null;

    // Pre-compute distance once per issue (avoids recomputing on every
    // pairwise comparison the sort algorithm performs).
    const withDistance = matched.map((issue) => ({
      issue,
      distance: hasUserLocation
        ? getHaversineDistance(
            userLocation.latitude,
            userLocation.longitude,
            issue.coordinates?.latitude,
            issue.coordinates?.longitude
          )
        : Infinity
    }));

    withDistance.sort((a, b) => {
      if (activeFilter === 'trending') {
        const upvotesDiff = (b.issue.upvotesCount || 0) - (a.issue.upvotesCount || 0);
        if (upvotesDiff !== 0) return upvotesDiff;
        return parseDate(b.issue.createdAt) - parseDate(a.issue.createdAt);
      }
      if (activeFilter === 'nearby' && hasUserLocation) {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return parseDate(b.issue.createdAt) - parseDate(a.issue.createdAt);
      }
      // Default ordering for 'all', 'new', and 'nearby' (without a known
      // location) is deterministic: newest first.
      return parseDate(b.issue.createdAt) - parseDate(a.issue.createdAt);
    });

    return withDistance.map((entry) => entry.issue);
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
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/40">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>All</span>
          </button>
          <button
            onClick={() => setActiveFilter('nearby')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'nearby'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Nearby</span>
          </button>
          <button
            onClick={() => setActiveFilter('trending')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'trending'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Trending</span>
          </button>
          <button
            onClick={() => setActiveFilter('new')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'new'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Action Panel Overlay when user role is Municipal Admin */}
      {role === 'admin' && selectedIssue && (
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
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm active:scale-98"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Actions</span>
            </button>
          </div>
        </div>
      )}

      {/* Status update confirmation toast. Only describes what we actually
          know happened (the status record was saved) rather than asserting
          an email was delivered, which this code never confirms. */}
      {successToast && (
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-2xl flex items-center space-x-3 text-left animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Status Updated Successfully</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              The issue record has been updated. The reporting citizen will be notified if email delivery succeeds.
            </p>
          </div>
        </div>
      )}

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
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto stroke-[1.5]" />
            <h3 className="text-slate-700 font-bold text-sm mt-3">No matching issues found</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `We couldn't find any issues matching "${searchQuery}". Try refining your search query or switching filters.`
                : 'There are no issues to show for this filter yet. Try switching filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}





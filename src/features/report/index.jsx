import React, { useState } from 'react';
import { useStore } from '../../store/index.js';
import { Sparkles } from 'lucide-react';

import SubmissionSuccess from './components/SubmissionSuccess.jsx';
import IntakeForm from './components/IntakeForm.jsx';
import DuplicatePanel from './components/DuplicatePanel.jsx';
import SignInModal from './components/SignInModal.jsx';

import { useLocationService } from './hooks/useLocationService.js';
import { useDuplicateDetector } from './hooks/useDuplicateDetector.js';
import { useImageIntake } from './hooks/useImageIntake.js';
import { generatePDFReceipt } from './services/pdfGenerator.js';


export default function ReportFeature() {
  const { addIssue, issues, user, toggleUpvote } = useStore();

  // Custom Sign-In Modal States
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInReason, setSignInReason] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Potholes');
  const [severity, setSeverity] = useState('medium');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);

  // Location service and duplicate detection hooks
  const { parseCoordinatesFromAddress, geocodeAddress, detectLocation } = useLocationService();
  const {
    duplicateIssues,
    showDuplicatePanel,
    setShowDuplicatePanel,
    checkDuplicates,
    resetDuplicates
  } = useDuplicateDetector(issues);

  // Image intake hook managing file, preview, and server-side analysis
  const {
    file,
    setFile,
    previewUrl,
    setPreviewUrl,
    isAnalyzing,
    setIsAnalyzing,
    aiAnalysis,
    setAiAnalysis,
    handleFileUpload,
  } = useImageIntake({
    user,
    setSignInReason,
    setShowSignInModal,
    coordinates,
    checkDuplicates,
    setTitle,
    setCategory,
    setSeverity,
    setDescription,
  });

  // Submission screens
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capture Geolocation and trigger duplicate checks
  const handleDetectLocation = () => {
    detectLocation({
      setAddress,
      setCoordinates,
      onDetectSuccess: (coords) => checkDuplicates(coords)
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('[TRACE] handleFormSubmit() is entered.');
    if (!user) {
      setSignInReason("Please sign in with Google to report a civic issue.");
      setShowSignInModal(true);
      return;
    }
    if (!title || !address) {
      alert('Please fill out the title and location before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCoords = coordinates;
      if (!finalCoords) {
        // Try parsing coordinates from the address text first (e.g. "Detected Location (12.3456, 78.9101)")
        const parsed = parseCoordinatesFromAddress(address);
        if (parsed) {
          finalCoords = parsed;
          setCoordinates(parsed);
          console.log('[TRACE] Successfully parsed coordinates from address text:', finalCoords);
        }
      }

      if (!finalCoords) {
        try {
          console.log('[TRACE] No coordinates found. Attempting to geocode address manually:', address);
          finalCoords = await geocodeAddress(address);
          setCoordinates(finalCoords);
          console.log('[TRACE] Geocoding succeeded:', finalCoords);
        } catch (geocodeErr) {
          console.warn('[TRACE] Geocoding failed (potentially due to billing/API limits or invalid address):', geocodeErr);
          // Fall back to central coordinates instead of blocking the user completely
          finalCoords = { latitude: 12.9716, longitude: 77.5946 };
          setCoordinates(finalCoords);
          console.log('[TRACE] Gracefully fell back to central location:', finalCoords);
        }
      }

      const newIssue = {
        title,
        description,
        category,
        severity,
        address,
        coordinates: finalCoords,
        createdBy: user.uid,
        creatorName: user.displayName || 'Anonymous Citizen',
        creatorEmail: user.email || 'citizen@example.com',
        imageUrl: null, // Will be populated with the actual Firebase Storage download URL inside addIssue
        imageIsSafe: aiAnalysis ? aiAnalysis.safeSearch === 'Safe' : true,
        status: 'Reported'
      };

      console.log('[TRACE] addIssue(newIssue, imageFile) is called.');
      if (file) {
        console.log(`[TRACE] imageFile exists: true | Name: "${file.name}" | MIME: "${file.type}" | Size: ${file.size} bytes`);
      } else {
        console.log('[TRACE] imageFile exists: false');
      }

      const submitted = await addIssue(newIssue, file);
      setLastSubmittedId(submitted.id);
      setIsSubmitted(true);
    } catch (err) {
      console.error('[TRACE] Submission failed in handleFormSubmit:', err);
      // Ensure we display the exact Firebase details if available
      const errMsg = err.code ? `[Firebase Error ${err.code}] ${err.message}` : err.message;
      alert('Submission failed: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download official submission PDF receipt using specialized service
  const handleDownloadReceipt = () => {
    generatePDFReceipt({
      lastSubmittedId,
      title,
      category,
      severity,
      address,
      user
    });
  };

  const handleResetForm = () => {
    setFile(null);
    setPreviewUrl('');
    setAiAnalysis(null);
    setShowManualForm(false);
    setTitle('');
    setDescription('');
    setCategory('Potholes');
    setSeverity('medium');
    setAddress('');
    setCoordinates(null);
    resetDuplicates();
    setIsSubmitted(false);
    setIsSubmitting(false);
  };

  const handleDuplicateUpvote = (issueId) => {
    if (!user) {
      alert('Please Sign In to vote on or validate issues.');
      return;
    }
    toggleUpvote(issueId, user.uid);
    alert('Upvoted successfully! This matches your issue, so we closed your duplicate intake flow.');
    handleResetForm();
  };


  if (isSubmitted) {
    return (
      <SubmissionSuccess
        submissionData={{
          id: lastSubmittedId,
          category,
          severity,
          address
        }}
        onDownloadReceipt={handleDownloadReceipt}
        onResetForm={handleResetForm}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Raise New Issue</h2>
          <p className="text-xs text-slate-400 font-semibold">Auto-analyzed with Gemini Flash</p>
        </div>
        <div className="bg-green-50 text-green-700 p-1.5 rounded-lg border border-green-100">
          <Sparkles className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Intake Form */}
      <IntakeForm
        user={user}
        file={file}
        showManualForm={showManualForm}
        setShowManualForm={setShowManualForm}
        previewUrl={previewUrl}
        isAnalyzing={isAnalyzing}
        aiAnalysis={aiAnalysis}
        title={title}
        setTitle={setTitle}
        category={category}
        setCategory={setCategory}
        severity={severity}
        setSeverity={setSeverity}
        address={address}
        setAddress={setAddress}
        setCoordinates={setCoordinates}
        description={description}
        setDescription={setDescription}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onFileUpload={handleFileUpload}
        onDetectLocation={handleDetectLocation}
        onShowSignIn={(reason) => {
          setSignInReason(reason);
          setShowSignInModal(true);
        }}
        onResetFile={() => {
          setFile(null);
          setPreviewUrl('');
          setAiAnalysis(null);
        }}
      />

      {/* Real-time Proximity Duplicate Alert Drawer */}
      {showDuplicatePanel && duplicateIssues.length > 0 && (
        <DuplicatePanel
          duplicateIssues={duplicateIssues}
          onDuplicateUpvote={handleDuplicateUpvote}
          onContinue={() => setShowDuplicatePanel(false)}
        />
      )}

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        signInReason={signInReason}
      />
    </div>
  );
}

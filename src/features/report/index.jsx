import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/index.js';
import { Upload, MapPin, Sparkles, AlertCircle, CheckCircle, FileText, RefreshCw, ThumbsUp, Image } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatDate } from '../../utils/formatDate.js';
import { compressImage } from '../../utils/imageCompressor.js';

export default function ReportFeature() {
  const { addIssue, issues, user, toggleUpvote } = useStore();
  const fileInputRef = useRef(null);

  // Intake State Machine
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Potholes');
  const [severity, setSeverity] = useState('medium');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);

  // Duplicate states
  const [duplicateIssues, setDuplicateIssues] = useState([]);
  const [showDuplicatePanel, setShowDuplicatePanel] = useState(false);

  // Submission screens
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate distance in meters between two lat/lng coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Parse latitude and longitude coordinates directly from address text if present
  const parseCoordinatesFromAddress = (text) => {
    if (!text) return null;
    const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
    return null;
  };

  // Geocode address text into latitude and longitude coordinates
  const geocodeAddress = (addr) => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        reject(new Error("Google Maps JavaScript API is not loaded yet."));
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addr }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ latitude: lat, longitude: lng });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  };

  // Reverse-geocode latitude and longitude coordinates into a human-readable street address
  const reverseGeocode = (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        reject(new Error("Google Maps JavaScript API is not loaded yet."));
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  };

  // Check proximity duplicates (defined as within 200m per PRD)
  const checkDuplicates = (coords) => {
    if (!coords) return;
    const matches = issues.map(issue => {
      const dist = calculateDistance(
        coords.latitude,
        coords.longitude,
        issue.coordinates?.latitude,
        issue.coordinates?.longitude
      );
      return { ...issue, distance: dist };
    })
    .filter(issue => issue.distance <= 200 && issue.status !== 'Resolved')
    .sort((a, b) => a.distance - b.distance);

    if (matches.length > 0) {
      setDuplicateIssues(matches);
      setShowDuplicatePanel(true);
    } else {
      setDuplicateIssues([]);
      setShowDuplicatePanel(false);
    }
  };

  // Capture Geolocation and trigger duplicate checks
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      // Temporarily set a loading indicator address
      setAddress("Detecting location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { latitude: lat, longitude: lng };
          setCoordinates(coords);
          checkDuplicates(coords);
          
          try {
            const formattedAddress = await reverseGeocode(lat, lng);
            setAddress(formattedAddress);
          } catch (err) {
            console.warn("Reverse geocoding failed, falling back to raw coordinates:", err);
            setAddress(`Detected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        },
        (error) => {
          console.warn("Geolocation failed.", error);
          setAddress("");
          alert("Geolocation failed or was denied. Please type your location/address manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser. Please type your location/address manually.");
    }
  };

  // Analyze uploaded photo with server-side proxy
  const handleFileUpload = async (e) => {
    if (!e) return;
    const uploadedFile = e.target?.files?.[0] || e;
    if (!uploadedFile) return;

    // Front-end MIME type validation
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const fileExtension = uploadedFile.name ? uploadedFile.name.split('.').pop().toLowerCase() : '';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

    let isValid = false;
    const mimeType = uploadedFile.type ? uploadedFile.type.toLowerCase() : '';
    
    if (mimeType && mimeType !== 'application/octet-stream') {
      // Validate by MIME type first
      isValid = allowedMimeTypes.includes(mimeType) || mimeType.startsWith('image/');
    } else {
      // Fallback to file extension only if browser doesn't provide a reliable MIME type
      isValid = allowedExtensions.includes(fileExtension);
    }

    if (!isValid) {
      alert('Invalid file type. Only JPG, JPEG, PNG, WEBP, HEIC, and HEIF images are allowed.');
      return;
    }

    // Front-end size check (3MB limit)
    if (uploadedFile.size > 3 * 1024 * 1024) {
      alert('The maximum supported image size is 3 MB. Please upload a smaller photo.');
      return;
    }

    // Call actual server-side endpoint
    setIsAnalyzing(true);
    setAiAnalysis(null);

    let fileToUse = uploadedFile;
    try {
      fileToUse = await compressImage(uploadedFile);
    } catch (compressionErr) {
      console.warn('Image compression failed or bypassed, using original file:', compressionErr);
    }

    setFile(fileToUse);
    const objectUrl = URL.createObjectURL(fileToUse);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append('image', fileToUse);

    try {
      const response = await fetch('/api/intake/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server returned error response');
      }

      const data = await response.json();
      if (data.status === 'success' && data.analysis) {
        const analysis = data.analysis;
        
        setAiAnalysis({
          category: analysis.category,
          safeSearch: analysis.isAppropriate ? "Safe" : "Unsafe"
        });

        // Suppress displaying unsafe images
        if (analysis.isAppropriate === false) {
          alert("The uploaded image was flagged as potentially inappropriate or unrelated. You can still report the issue, but the image will not be displayed publicly.");
          setPreviewUrl(''); // Clear public display
        }

        setTitle(analysis.title);
        setCategory(analysis.category);
        setSeverity(analysis.severity);
        setDescription(analysis.description);
        
        // Use user coordinates if already captured to check for duplicates
        if (coordinates) {
          checkDuplicates(coordinates);
        }
      } else {
        throw new Error(data.message || 'Intake analysis returned no details');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('AI image analysis error: ' + error.message + '. You can still fill the form manually.');
      
      // Basic fallback fields
      setTitle('Civic Issue');
      setCategory('Others');
      setSeverity('medium');
      setDescription('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileUpload(droppedFile);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('[TRACE] handleFormSubmit() is entered.');
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
        createdBy: user?.uid || 'anonymous_guest',
        creatorName: user?.displayName || 'Anonymous Citizen',
        creatorEmail: user?.email || 'citizen@example.com',
        isAnonymous: !user,
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

  // Download official submission PDF receipt using jsPDF (Features clean, single-page A4 layout)
  const handleDownloadReceipt = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, "F");
      
      // Header Banner
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, 210, 45, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("FIXMYCITY CIVIC RECEIPT", 20, 28);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text("MUNICIPAL INTAKE SYSTEM RECEIPT RECORD", 20, 36);

      // Card Body Frame
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 55, 180, 210, 4, 4, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 55, 180, 210, 4, 4, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("SUBMISSION DISPATCH RECEIPT", 25, 70);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(25, 75, 185, 75);

      const items = [
        ["Submission ID", lastSubmittedId],
        ["Title of Issue", title],
        ["Assigned Category", category],
        ["Assessed Severity", severity.toUpperCase()],
        ["Identified Location", address],
        ["Reporting Date", formatDate(new Date())],
        ["Citizen Profile", user ? `${user.displayName} (${user.email})` : "Anonymous Citizen"],
        ["Platform Source", "AI Studio Hyperlocal Portal"],
        ["Status State", "Reported (Pending Validation)"]
      ];

      let y = 90;
      doc.setFontSize(10);
      items.forEach(([lbl, val]) => {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(lbl, 25, y);
        
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        
        const wrapped = doc.splitTextToSize(val, 110);
        doc.text(wrapped, 75, y);
        
        y += Math.max(12, wrapped.length * 6);
      });

      doc.line(25, 220, 185, 220);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(34, 197, 94);
      doc.text("COMMUNITY GRIEVANCE COMPLIANCE", 25, 230);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("This PDF guarantees filing. If verified, municipal crews execute repairs within 7 business days.", 25, 236);

      doc.save(`FixMyCity-Submission-${lastSubmittedId}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handleResetForm = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    setDuplicateIssues([]);
    setShowDuplicatePanel(false);
    setIsSubmitted(false);
    setIsSubmitting(false);
  };

  const getDaysOpen = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-6 animate-in zoom-in-95 duration-350 text-left">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto border border-green-100">
          <CheckCircle className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="space-y-1.5 text-center">
          <h3 className="text-lg font-bold text-slate-800">Issue Submitted! 🎉</h3>
          <p className="text-xs text-slate-400">Your issue was recorded with Reference ID: <strong className="text-slate-700">{lastSubmittedId}</strong>.</p>
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
            onClick={handleDownloadReceipt}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-green-600/10 transition-all text-sm active:scale-98"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Receipt</span>
          </button>
          <button
            onClick={handleResetForm}
            className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 rounded-xl border border-slate-200 transition-all"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-5 text-left">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-800">Raise New Issue</h3>
            <p className="text-[11px] text-slate-400 font-medium">Auto-analyzed with Gemini Flash</p>
          </div>
          <div className="bg-green-50 text-green-700 p-1.5 rounded-lg border border-green-100">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {/* File Drag-and-drop Area */}
        {!file && !showManualForm ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/10 transition-all duration-200 relative group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              accept="image/*"
              className="hidden"
            />
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto border border-green-100/50 group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <Upload className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-xs font-bold text-slate-700 mt-3.5">Drag & drop an image here</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">or click to browse from device</p>
            <p className="text-[9px] text-slate-300 font-medium mt-2">JPG, PNG up to 3MB</p>
            
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManualForm(true);
                }}
                className="text-xs text-green-600 hover:text-green-700 font-bold transition-all inline-flex items-center space-x-1"
              >
                <span>Or report without a photo (fill manually)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview / Manual Mode Indicator */}
            {!file ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                  <Image className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">Reporting without a photo</p>
                  <p className="text-[10px] text-slate-400">You are manually filling in details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-green-600 hover:text-green-700 font-semibold hover:bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 transition-all"
                >
                  Attach a photo instead
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden h-40 border border-slate-100 shadow-inner bg-slate-50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4">
                    <span className="text-xl">⚠️</span>
                    <p className="text-[10px] font-bold mt-1 text-center">Image Display Suppressed (Moderated)</p>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-green-400 stroke-[2.5]" />
                    <p className="text-xs font-bold tracking-wide">Gemini analyzing safety & category...</p>
                  </div>
                )}
                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(''); setAiAnalysis(null); }}
                    className="absolute bottom-3 right-3 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-md transition-all active:scale-95 border border-slate-200"
                  >
                    Change Image
                  </button>
                )}
              </div>
            )}

            {/* AI Analysis Form */}
            {aiAnalysis && (
              <div className="bg-green-50/30 border border-green-100 rounded-xl p-3.5 space-y-1 text-xs animate-in fade-in duration-200">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-green-700 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Gemini Auto-Analysis</span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed mt-1">
                  Detected Category: <strong className="text-green-800">{aiAnalysis.category}</strong>. Safe search verification: <strong className="text-green-800">{aiAnalysis.safeSearch}</strong>.
                </div>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Deep asphalt crack near crossroads"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
                >
                  <option value="Potholes">Potholes</option>
                  <option value="Streetlight Non-Functional">Streetlight Non-Functional</option>
                  <option value="Water Leak">Water Leak</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((lvl) => {
                    let activeStyles = '';
                    if (lvl === 'high') {
                      activeStyles = 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca] shadow-xs';
                    } else if (lvl === 'medium') {
                      activeStyles = 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] shadow-xs';
                    } else { // low
                      activeStyles = 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] shadow-xs';
                    }

                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverity(lvl)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all capitalize ${
                          severity === lvl
                            ? activeStyles
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Selector / Geolocation */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Click detect location or enter address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setCoordinates(null);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="p-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-100 transition-all flex items-center justify-center shrink-0"
                    title="Detect Current Location"
                  >
                    <MapPin className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Additional details</label>
                <textarea
                  rows="2"
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-green-600/10 transition-all text-sm active:scale-98 flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
                <span>{isSubmitting ? 'Saving...' : 'Submit Issue Report'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Real-time Proximity Duplicate Alert Drawer (Non-blocking and listed clearly below intake) */}
      {showDuplicatePanel && duplicateIssues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl text-left space-y-3.5 shadow-sm animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-800">Duplicate Issue Check — Similarity Detected</h4>
              <p className="text-[10px] text-amber-600 leading-relaxed font-semibold">
                An issue matching your coordinates was already logged recently. Would you prefer to upvote/validate it instead of filing a duplicate?
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {duplicateIssues.map((dup) => (
              <div key={dup.id} className="bg-white border border-amber-100 p-3 rounded-xl space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-slate-800 truncate">{dup.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{dup.address}</p>
                    <div className="flex items-center space-x-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-sm">
                        {dup.distance} meters away
                      </span>
                      <span>•</span>
                      <span>{getDaysOpen(dup.createdAt)} days open</span>
                      <span>•</span>
                      <span className="capitalize">{dup.severity} severity</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {dup.imageUrl && dup.imageIsSafe !== false ? (
                      <img 
                        src={dup.imageUrl} 
                        alt="Duplicate thumbnail" 
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Image className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateUpvote(dup.id)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-[10px] font-bold transition-all bg-green-600 text-white border-green-600 shadow-xs hover:bg-green-700 active:scale-95"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-white" />
                    <span>This is the same issue → Upvote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDuplicatePanel(false)}
                    className="py-2 px-3 rounded-lg border text-[10px] font-bold transition-all bg-white border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95"
                  >
                    Mine is different → Continue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

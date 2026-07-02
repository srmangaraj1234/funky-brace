import React, { useRef } from 'react';
import { Upload, Image, Sparkles, MapPin, RefreshCw } from 'lucide-react';
import CustomCategorySelect from './CustomCategorySelect.jsx';

export default function IntakeForm({
  user,
  file,
  showManualForm,
  setShowManualForm,
  previewUrl,
  isAnalyzing,
  aiAnalysis,
  title,
  setTitle,
  category,
  setCategory,
  severity,
  setSeverity,
  address,
  setAddress,
  setCoordinates,
  description,
  setDescription,
  isSubmitting,
  onSubmit,
  onFileUpload,
  onDetectLocation,
  onShowSignIn,
  onResetFile
}) {
  const fileInputRef = useRef(null);

  const triggerFileSelect = () => {
    if (!user) {
      onShowSignIn("Please sign in with Google to analyze images and report civic issues.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      onFileUpload(droppedFile);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5 text-left">
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
            onChange={(e) => onFileUpload(e.target.files?.[0])}
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
                if (!user) {
                  onShowSignIn("Please sign in with Google to report a civic issue.");
                  return;
                }
                setShowManualForm(true);
              }}
              className="text-xs text-green-600 hover:text-green-700 font-bold transition-all inline-flex items-center space-x-1 cursor-pointer"
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
                className="text-xs text-green-600 hover:text-green-700 font-semibold hover:bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
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
                  onClick={onResetFile}
                  className="absolute bottom-3 right-3 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-md transition-all active:scale-95 border border-slate-200 cursor-pointer"
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
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                placeholder="E.g., Deep asphalt crack near crossroads"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
              <CustomCategorySelect value={category} onChange={setCategory} />
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
                      className={`py-2 text-xs font-bold rounded-xl border transition-all capitalize cursor-pointer ${
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
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={onDetectLocation}
                  className="p-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-100 transition-all flex items-center justify-center shrink-0 cursor-pointer"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-green-600/10 transition-all text-sm active:scale-98 flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
            >
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
              <span>{isSubmitting ? 'Saving...' : 'Submit Issue Report'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

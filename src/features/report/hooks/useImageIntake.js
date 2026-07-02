import { useState, useEffect } from 'react';
import { auth } from '../../../services/firebase.js';
import { compressImage } from '../../../utils/imageCompressor.js';

export function useImageIntake({
  user,
  setSignInReason,
  setShowSignInModal,
  coordinates,
  checkDuplicates,
  setTitle,
  setCategory,
  setSeverity,
  setDescription,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileUpload = async (e) => {
    if (!e) return;
    const uploadedFile = e.target?.files?.[0] || e;
    if (!uploadedFile) return;

    if (!user) {
      setSignInReason("Please sign in with Google to analyze images and report civic issues.");
      setShowSignInModal(true);
      return;
    }

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
      let idToken = '';
      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn('Failed to retrieve Firebase ID Token for image analysis:', tokenErr);
        }
      }

      const response = await fetch('/api/intake/analyze', {
        method: 'POST',
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            throw new Error(errData.message || 'Server returned error response');
          } catch (e) {
            // ignore
          }
        }
        throw new Error(`Server returned error response (${response.status})`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response (possibly HTML/Vite fallback)');
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

  return {
    file,
    setFile,
    previewUrl,
    setPreviewUrl,
    isAnalyzing,
    setIsAnalyzing,
    aiAnalysis,
    setAiAnalysis,
    handleFileUpload,
  };
}

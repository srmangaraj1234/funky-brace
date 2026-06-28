/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Falls back gracefully to the original file if compression fails or format is unsupported.
 * 
 * @param {File} file - The original uploaded file.
 * @param {number} maxWidth - Maximum width of the compressed image.
 * @param {number} maxHeight - Maximum height of the compressed image.
 * @param {number} quality - Compression quality between 0.0 and 1.0 (JPEG/WebP).
 * @returns {Promise<File>} - The compressed File, or the original File as a fallback.
 */
export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
  // If not a standard web-compatible image, skip compression and return original file
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  const fileSizeMB = file.size / (1024 * 1024);

  // Images ≤ 1 MB: Upload the original image without modification
  if (fileSizeMB <= 1.0) {
    console.log(`Image size is ${(file.size / 1024).toFixed(1)}KB (≤ 1MB). Uploading original without modification.`);
    return file;
  }

  // Images > 3 MB: Reject the upload. Do not attempt compression.
  if (fileSizeMB > 3.0) {
    throw new Error('The maximum supported image size is 3 MB. Please upload a smaller photo.');
  }

  // Images between 1 MB and 3 MB: Compress before upload.
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Resize the longest side to a maximum of approximately 1600 pixels while preserving the aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('Canvas 2D context not available. Falling back to original image.');
            resolve(file);
            return;
          }

          // Draw image onto canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG only when the source format supports it without losing required transparency.
          // PNG and GIF support transparency, so we keep their original format (PNG).
          // Otherwise, we convert to JPEG with approximately 75-80% quality.
          const hasTransparency = ['image/png', 'image/gif'].includes(file.type);
          const outputType = hasTransparency ? 'image/png' : 'image/jpeg';
          
          // For webp, it supports transparency and quality compression, so we can use webp with quality
          const finalOutputType = file.type === 'image/webp' ? 'image/webp' : outputType;
          
          // canvas.toBlob takes quality only for image/jpeg and image/webp
          const finalQuality = (finalOutputType === 'image/jpeg' || finalOutputType === 'image/webp') ? quality : undefined;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn('Canvas blob generation failed. Falling back to original image.');
                resolve(file);
                return;
              }
              // Create a new file from the blob with the original name
              const compressedFile = new File([blob], file.name, {
                type: finalOutputType,
                lastModified: Date.now(),
              });
              
              console.log(`Image compressed successfully (${finalOutputType}): ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(compressedFile);
            },
            finalOutputType,
            finalQuality
          );
        } catch (err) {
          console.error('Error during image compression process:', err);
          resolve(file); // Fallback to original
        }
      };
      img.onerror = (err) => {
        console.warn('Failed to load image for compression. Falling back to original.', err);
        resolve(file); // Fallback
      };
    };
    reader.onerror = (err) => {
      console.error('FileReader error during compression. Falling back to original.', err);
      resolve(file); // Fallback
    };
  });
}

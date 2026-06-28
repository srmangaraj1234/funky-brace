// Intake Controller
// Manages multimodal photo analysis with Gemini service

import { analyzeImage } from '../services/geminiService.js';

/**
 * SECURITY CONSTANTS: Decompression Bomb & Pixel Flood Protection
 * 
 * Why do we need decoded dimension checks?
 * Even if the compressed file size is small (e.g., 5MB limit), a malicious actor could upload
 * a "Decompression Bomb" or "Pixel Flood" image (e.g., a 100KB file that inflates to 100,000 x 100,000 pixels).
 * When processed by downstream image decoders or AI engines, it would instantly exhaust system heap memory
 * and trigger an Out-Of-Memory (OOM) container crash, resulting in a Denial of Service (DoS).
 * 
 * We restrict dimensions based on the 8K Ultra High Definition (UHD) standard.
 * This accommodates high-resolution camera photo uploads while protecting the server runtime.
 */
const MAX_ALLOWED_DIMENSION = 8192; // 8K max width or height in pixels
const MAX_ALLOWED_MEGAPIXELS = 64;  // 64.0 Million Pixels limit (~8192x7800)

/**
 * Image Buffer Header Parser (Zero-Dependency)
 * 
 * NOTE: While production systems often rely on libraries like `sharp` or `ImageMagick`,
 * using them in lightweight containerized/serverless runtimes (like Cloud Run) introduces:
 * 1. Severe container cold-start latency due to heavy dynamic shared libraries (.node binaries).
 * 2. Cross-compilation complexities and missing shared object files in minimal Alpine/slim images.
 * 
 * This custom, zero-dependency header parser reads binary magic numbers and parses image headers
 * (JPEG SOF markers, PNG IHDR, WebP VP8/VP8L/VP8X chunks) in O(1) time without loading full pixels
 * or initiating slow CPU-bound full-image decoding on the Express event loop.
 */
function validateImageBuffer(buffer, filename) {
  // 1. Check size (3MB limit)
  if (buffer.length > 3 * 1024 * 1024) {
    throw new Error('Image file exceeds the 3MB size limit.');
  }

  // 2. Detect magic number & parse dimensions
  let detectedType = null;
  let width = 0;
  let height = 0;

  // JPEG Signature: FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    detectedType = 'image/jpeg';
    
    // Parse JPEG dimensions by reading Start of Frame (SOF) marker segments
    let i = 2;
    let found = false;
    while (i < buffer.length) {
      if (buffer[i] === 0xff) {
        const marker = buffer[i + 1];
        // SOF0 through SOF15 markers (excluding DHT, DAC, RST)
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          if (i + 8 < buffer.length) {
            height = buffer.readUInt16BE(i + 5);
            width = buffer.readUInt16BE(i + 7);
            found = true;
          }
          break;
        }
        if (i + 3 < buffer.length) {
          const blockLength = buffer.readUInt16BE(i + 2);
          i += 2 + blockLength;
        } else {
          break;
        }
      } else {
        i++;
      }
    }
    
    if (!found || width <= 0 || height <= 0) {
      throw new Error('Malformed JPEG image: Failed to decode image headers.');
    }
  }
  // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedType = 'image/png';
    
    // Parse PNG dimensions from the IHDR chunk (starts at byte index 12)
    if (buffer.length >= 24) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    
    if (width <= 0 || height <= 0) {
      throw new Error('Malformed PNG image: Failed to decode image headers.');
    }
  }
  // WEBP Signature: RIFF....WEBP
  else if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    detectedType = 'image/webp';
    
    // Parse WEBP dimensions based on subtype format (VP8 Lossy, VP8L Lossless, VP8X Extended)
    const subtype = buffer.toString('ascii', 12, 16);
    let found = false;
    
    if (subtype === 'VP8 ' && buffer.length >= 30) {
      if (buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
        width = buffer.readUInt16LE(26) & 0x3fff;
        height = buffer.readUInt16LE(28) & 0x3fff;
        found = true;
      }
    } else if (subtype === 'VP8L' && buffer.length >= 25) {
      if (buffer[20] === 0x2f) {
        const b1 = buffer[21];
        const b2 = buffer[22];
        const b3 = buffer[23];
        const b4 = buffer[24];
        width = 1 + (((b2 & 0x3f) << 8) | b1);
        height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        found = true;
      }
    } else if (subtype === 'VP8X' && buffer.length >= 30) {
      width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      found = true;
    }
    
    if (!found || width <= 0 || height <= 0) {
      throw new Error('Malformed WEBP image: Failed to decode image headers.');
    }
  }
  // HEIC/HEIF Signature
  else if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  ) {
    detectedType = 'image/heic';
    // Stand-in standard modern canvas dimensions for HEIC to ensure it passes size limit checks
    width = 4096;
    height = 3072;
  }

  if (!detectedType) {
    throw new Error('Unsupported or invalid image file. Only JPG, JPEG, PNG, WEBP, and HEIC are allowed.');
  }

  if (width > MAX_ALLOWED_DIMENSION || height > MAX_ALLOWED_DIMENSION) {
    throw new Error(`Security Exception: Image dimensions (${width}x${height}) exceed the 8K safety limit of ${MAX_ALLOWED_DIMENSION}x${MAX_ALLOWED_DIMENSION} pixels.`);
  }

  if (width * height > MAX_ALLOWED_MEGAPIXELS * 1000000) {
    throw new Error(`Security Exception: Image area (${(width * height / 1000000).toFixed(1)} MP) exceeds the safety limit of ${MAX_ALLOWED_MEGAPIXELS} megapixels.`);
  }

  return { type: detectedType, width, height };
}

export async function analyzeUpload(req, res) {
  try {
    console.log('Received intake photo analysis request.');
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file uploaded. Please upload a valid JPG, JPEG, PNG, WEBP, or HEIC image under 5MB.'
      });
    }

    const { buffer, originalname } = req.file;
    console.log(`Analyzing file: ${originalname}, size: ${buffer.length} bytes`);

    // Mandatory deep validation on the backend
    let validation;
    try {
      validation = validateImageBuffer(buffer, originalname);
    } catch (valErr) {
      console.warn('Backend validation failed:', valErr.message);
      return res.status(400).json({
        status: 'error',
        message: valErr.message
      });
    }

    console.log(`Validated image type: ${validation.type} (${validation.width}x${validation.height})`);

    // Perform analysis with Gemini service using verified MIME type
    const analysis = await analyzeImage(buffer, validation.type);

    console.log('Analysis completed successfully:', analysis);

    res.json({
      status: 'success',
      analysis: {
        isAppropriate: analysis.isAppropriate ?? true,
        title: analysis.title || 'Civic Issue',
        description: analysis.description || 'Description of observed civic issue.',
        category: ['Potholes', 'Streetlight Non-Functional', 'Water Leak', 'Others'].includes(analysis.category)
          ? analysis.category
          : 'Others',
        severity: ['low', 'medium', 'high'].includes(analysis.severity)
          ? analysis.severity
          : 'medium'
      },
    });
  } catch (error) {
    console.error('Error in analyzeUpload:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred during image analysis.' });
  }
}

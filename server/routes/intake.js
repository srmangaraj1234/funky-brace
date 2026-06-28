// Intake Routes - handles multimodal upload and analysis
import express from 'express';
import multer from 'multer';
import { analyzeUpload } from '../controllers/intakeController.js';

const router = express.Router();

// Configure multer for memory storage and safe image uploading
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const fileExtension = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

    const mimeLower = file.mimetype ? file.mimetype.toLowerCase() : '';
    let isAllowed = false;

    if (mimeLower && mimeLower !== 'application/octet-stream') {
      // Validate by MIME type first
      isAllowed = allowedMimeTypes.includes(mimeLower) || mimeLower.startsWith('image/');
    } else {
      // Fallback to extension if MIME type is missing or generic
      isAllowed = allowedExtensions.includes(fileExtension);
    }

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, WEBP, HEIC, and HEIF are allowed.'));
    }
  },
});

// Route for issue analysis intake with multer single file upload middleware
router.post('/analyze', upload.single('image'), analyzeUpload);

export default router;

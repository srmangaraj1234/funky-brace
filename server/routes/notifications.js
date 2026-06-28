// Notifications Routes - handles Resend notifications dispatch on issue resolution
import express from 'express';
import { dispatchResolutionEmail } from '../controllers/notificationController.js';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

router.post('/resolve', verifyFirebaseToken, dispatchResolutionEmail);

export default router;

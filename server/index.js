import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import intakeRouter from './routes/intake.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Register API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'success',
      service: 'FixMyCity API Service',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/intake', intakeRouter);
  app.use('/api/notifications', notificationsRouter);

  // API error handling middleware
  app.use('/api', (err, req, res, next) => {
    console.error('API Error handler caught:', err);
    
    // Catch Multer errors (e.g. LIMIT_FILE_SIZE, custom fileFilter rejections)
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 400;
      message = 'The uploaded file exceeds the 5MB size limit.';
    } else if (err.name === 'MulterError') {
      status = 400;
      message = `Upload error: ${err.message}`;
    } else if (err.message && err.message.includes('Invalid file type')) {
      status = 400;
    }

    res.status(status).json({
      status: 'error',
      message
    });
  });

  // 2. Integration with Vite (Development vs Production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in Development mode - mounting Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in Production mode - serving static files from dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FixMyCity Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

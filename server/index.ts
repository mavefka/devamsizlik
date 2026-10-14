import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import dataRoutes from './routes/data';

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow avatar images to load cross-origin if needed
  })
);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Static uploads (avatars) with nosniff header
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use(
  '/uploads',
  express.static(uploadsPath, {
    dotfiles: 'allow',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production (dist directory)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { dotfiles: 'allow' }));
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint bulunamadı' });
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'), { dotfiles: 'allow' });
  });
}

// Global API error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Sunucu hatası oluştu.' });
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});

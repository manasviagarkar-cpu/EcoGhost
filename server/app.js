import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generalLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Security Headers ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com'],
      imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com']
    }
  }
}));

// ── CORS (API routes only) ───────────────────────────────────────────
// Static files must NOT go through CORS middleware — Vite's crossorigin
// attribute causes browsers to send an Origin header even for same-origin
// asset requests.  Applying cors() globally caused every /assets/*.js
// request from the Cloud Run URL to be rejected with a 500 error before
// express.static could serve the file, producing the blank-white-page bug.
const allowedOrigins = [
  'http://localhost:5173',
  'https://ecoghost.firebaseapp.com',
  'https://ecoghost.web.app',
  'https://ecoghost-146491922348.us-central1.run.app'
];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
});

// ── Body parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiting + CORS + API routes ────────────────────────────────
app.use('/api', corsMiddleware);
app.use('/api', generalLimiter);

// ── API routes ────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Serve React static build ──────────────────────────────────────────
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// ── Central Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const statusCode = err.statusCode || err.status || 500;
  
  // In production, mask internal error details
  const message = isDev ? err.message : 'An internal server error occurred';
  
  res.status(statusCode).json({
    error: message,
    ...(isDev && { stack: err.stack })
  });
});

export default app;

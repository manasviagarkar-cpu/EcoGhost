const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { generalLimiter } = require('./middleware/rateLimiter');
const apiRouter = require('./routes');

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

// ── CORS ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'https://ecoghost.firebaseapp.com',
  'https://ecoghost.web.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

// ── Body parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────
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

module.exports = app;

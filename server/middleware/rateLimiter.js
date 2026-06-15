const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Limits requests per IP to 100 within a 15-minute window.
 */
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Too many requests from this IP, please try again in 15 minutes.' 
  }
});

/**
 * AI Ghost Chat Rate Limiter
 * Limits requests to exactly 20 per minute.
 * The 21st request will trigger a 429 Too Many Requests response.
 */
exports.chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20,              // 20 requests allowed
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'EcoGhost is feeling dizzy. Please slow down your messaging.' 
  }
});

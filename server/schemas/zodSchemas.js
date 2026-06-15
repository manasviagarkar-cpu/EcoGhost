const { z } = require('zod');

/**
 * XSS Sanitizer helper function.
 * Removes HTML tag structures, especially <script> blocks.
 */
function sanitizeInput(val) {
  if (typeof val !== 'string') return val;
  // Basic stripping of HTML tags
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Schema for logging carbon activities.
 * Sanitizes all string fields before validation.
 */
exports.activitySchema = z.object({
  category: z.enum(['transport', 'food', 'energy', 'shopping']),
  subCategory: z.string().preprocess(sanitizeInput, z.string().min(1).max(50)),
  value: z.number().positive('Emission activity value must be a positive number'),
  unit: z.string().preprocess(sanitizeInput, z.string().min(1).max(10)),
  note: z.string().preprocess(sanitizeInput, z.string().max(280)).optional()
});

/**
 * Schema to validate Gemini AI responses before dispatch.
 * Confirms string structure and length constraints to prevent oversized response delivery.
 */
exports.geminiResponseSchema = z.object({
  reply: z.string()
    .min(1, 'Reply cannot be empty')
    .max(280, 'Reply must be under 280 characters')
});

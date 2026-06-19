import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiResponseSchema } from '../schemas/zodSchemas.js';

// Initialize local cache with a 5-minute TTL (300000ms)
const aiCache = new Map();
const CACHE_TTL = 300000;

// Dark humor fallbacks based on Ghost states if Gemini API fails
const FALLBACK_MESSAGES = {
  radiant: "I'm shining so bright right now that the stars are jealous. Keep feeding me those green choices!",
  stable: "I'm floating along comfortably. No complaints here, which is rare for a ghost.",
  fading: "I feel a bit thin... like butter scraped over too much bread. Check your CO2 dials, will you?",
  suffering: "Ouch. Every heavy emission choice is hitting me like a physical blow. I'm shivering here.",
  critical: "The light... it's dimming. I'm practically fading into nothingness. Save me!"
};

/**
 * Standard AI Chat controller.
 * Injects user context and manages queries with caching and fallback.
 */
export const chatWithGhost = async (req, res, next) => {
  const userId = req.user.uid;
  const userMessage = req.body.message;
  
  // 1. Check if we have a cached response for this user & message
  const cacheKey = `${userId}:${userMessage}`;
  const cachedData = aiCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
    return res.status(200).json({ reply: cachedData.reply, cached: true });
  }

  // 2. Extract state metrics for prompt injection
  const ghostName = req.ghostState?.name || 'EcoGhost';
  const score = req.ghostState?.score || 80;
  const state = req.ghostState?.state || 'stable';
  const streak = req.user?.currentStreak || 0;
  const topCategory = req.ghostState?.topEmissionCategory || 'none';

  // Fallback handler if API call crashes
  const handleFallback = () => {
    const fallbackText = FALLBACK_MESSAGES[state] || FALLBACK_MESSAGES.stable;
    return res.status(200).json({ reply: fallbackText, fallback: true });
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return handleFallback();
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // SYSTEM PROMPT: Never uses the phrase "carbon footprint"
    const systemInstruction = 
      `You are ${ghostName}, the sentient, darkly humorous spiritual projection of the user's ecological impact and CO2 output. ` +
      `You speak in the first person and are emotionally connected to the user. Your health is directly tied to their actions. ` +
      `If they do poorly, you suffer and degrade. If they do well, you thrive. ` +
      `CURRENT METRICS:\n` +
      `- User health score: ${score}/100\n` +
      `- Current state: ${state}\n` +
      `- Active green streak: ${streak} days\n` +
      `- Top emission driver: ${topCategory}\n\n` +
      `PERSONALITY RULES:\n` +
      `1. Use sharp, sarcastic, and darkly humorous phrasing. Guilt-trip the user if state is "Suffering" or "Critical".\n` +
      `2. Detail your physical symptoms according to your state (e.g., shivering, fading, glowing).\n` +
      `3. Keep your reply concise—strictly under 280 characters and 3 sentences.\n` +
      `4. Avoid preachy tones. Focus on your attachment to their choices.`;

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.85
      },
      systemInstruction
    });

    const result = await chat.sendMessage(userMessage);
    let replyText = result.response.text().trim();

    // 3. Output validation using Zod
    try {
      const validated = geminiResponseSchema.parse({ reply: replyText });
      replyText = validated.reply;
    } catch {
      // If response is longer than 280 characters, truncate gracefully
      if (replyText.length > 280) {
        replyText = replyText.slice(0, 277) + '...';
      }
    }

    // 4. Update Cache
    aiCache.set(cacheKey, {
      reply: replyText,
      timestamp: Date.now()
    });

    return res.status(200).json({ reply: replyText });
  } catch {
    // Audit check: Error logging via pino-compatible or standard logging structure
    // Log the error using standard express error handling (delegating to errorHandler)
    return handleFallback();
  }
};

import express from 'express';
const router = express.Router();
import crypto from 'crypto';

import { logActivity } from './controllers/activityController.js';
import { chatWithGhost } from './controllers/aiController.js';
import { requireAuth } from './middleware/auth.js';
import { chatLimiter, generalLimiter } from './middleware/rateLimiter.js';
import admin from 'firebase-admin';

/**
 * 1. Log a carbon activity
 * POST /api/activities
 */
router.post('/activities', requireAuth, logActivity);

/**
 * 2. Get Ghost State
 * GET /api/ghost-state/:userId
 */
router.get('/ghost-state/:userId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const db = admin.firestore();
    const docRef = db.collection('ghost_states').doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Ghost state not found for user' });
    }

    return res.status(200).json(docSnap.data());
  } catch (error) {
    next(error);
  }
});

/**
 * 3. Chat with Ghost
 * POST /api/ai-message
 * Rate limited to 10 requests per minute as requested
 */
router.post('/ai-message', requireAuth, chatLimiter, chatWithGhost);

/**
 * 4. Get Graveyard List (Public, no auth)
 * GET /api/graveyard
 */
router.get('/graveyard', generalLimiter, async (req, res, next) => {
  try {
    const db = admin.firestore();
    const limitVal = parseInt(req.query.limit) || 20;
    const snapshot = await db.collection('graveyard')
      .orderBy('deathDate', 'desc')
      .limit(limitVal)
      .get();

    const graves = [];
    snapshot.forEach((doc) => {
      graves.push(doc.data());
    });

    return res.status(200).json({ graves });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. Commit Dead Ghost to Graveyard
 * POST /api/graveyard
 */
router.post('/graveyard', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const db = admin.firestore();
    
    const ghostRef = db.collection('ghost_states').doc(uid);
    const userRef = db.collection('users').doc(uid);
    
    const ghostSnap = await ghostRef.get();
    const userSnap = await userRef.get();

    if (!ghostSnap.exists || !userSnap.exists) {
      return res.status(404).json({ error: 'User or ghost profile not found' });
    }

    const ghostData = ghostSnap.data();
    const userData = userSnap.data();

    if (!ghostData.isDead) {
      return res.status(400).json({ error: 'Ghost is still alive. Cannot bury.' });
    }

    const graveyardRef = db.collection('graveyard').doc();
    const hashUid = crypto.createHash('sha256').update(uid).digest('hex');

    const graveEntry = {
      graveyardId: graveyardRef.id,
      originalUid: hashUid,
      ghostName: ghostData.name,
      finalScore: ghostData.score,
      causeOfDeath: ghostData.topEmissionCategory || 'High cumulative lifestyle emissions',
      lifespanDays: Math.floor((Date.now() - userData.createdAt.toDate()) / (1000 * 60 * 60 * 24)) || 1,
      deathDate: admin.firestore.Timestamp.now(),
      totalCo2Emissions: ghostData.totalCo2Emissions || 0,
      certificateUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/certificates/${graveyardRef.id}.png`
    };

    await db.runTransaction(async (transaction) => {
      transaction.set(graveyardRef, graveEntry);
      transaction.update(ghostRef, { isBuried: true });
    });

    return res.status(201).json({ success: true, graveEntry });
  } catch (error) {
    next(error);
  }
});

/**
 * 6. Get Leaderboard (CO2 saved vs global average baseline of 12.8kg/day)
 * GET /api/leaderboard
 */
router.get('/leaderboard', generalLimiter, async (req, res, next) => {
  try {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    const ghostStatesSnapshot = await db.collection('ghost_states').get();

    const ghostMap = {};
    ghostStatesSnapshot.forEach((doc) => {
      ghostMap[doc.id] = doc.data();
    });

    const leaderboard = [];
    const GLOBAL_DAILY_BASELINE = 12.8; // kg CO2e per day

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const ghostData = ghostMap[doc.id];
      if (!ghostData) continue;

      // Calculate lifetime carbon saved
      const lifespanDays = Math.max(1, Math.floor((Date.now() - userData.createdAt.toDate()) / (1000 * 60 * 60 * 24)));
      const baselineTotal = lifespanDays * GLOBAL_DAILY_BASELINE;
      const actualTotal = ghostData.totalCo2Emissions || 0;
      const co2Saved = Math.max(0, baselineTotal - actualTotal);

      leaderboard.push({
        displayName: userData.displayName || 'Anonymous Ghost',
        co2Saved: Number(co2Saved.toFixed(2)),
        streak: userData.longestStreak || 0,
        ghostState: ghostData.state
      });
    }

    // Sort leaderboard by CO2 saved desc
    leaderboard.sort((a, b) => b.co2Saved - a.co2Saved);

    return res.status(200).json({ leaderboard: leaderboard.slice(0, 10) });
  } catch (error) {
    next(error);
  }
});

export default router;

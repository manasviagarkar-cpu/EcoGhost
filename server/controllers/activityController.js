import admin from 'firebase-admin';
import { activitySchema } from '../schemas/zodSchemas.js';
import crypto from 'crypto';

// Inline emission factors (mirrors client/src/utils/carbonCalculator.js)
const EMISSION_FACTORS = {
  transport: { gasoline_car:0.170, electric_vehicle:0.050, bus:0.089, train:0.035, flight_short:0.250, flight_long:0.150 },
  food: { beef:27.0, poultry:6.9, vegetarian_meal:0.8, vegan_meal:0.5, dairy:3.2 },
  energy: { electricity_india:0.820, electricity_us:0.370, natural_gas:0.185, solar_wind:0.012 },
  shopping: { fast_fashion:15.0, electronics:80.0, general_goods:3.0 }
};
function calculateEmissions(category, subCategory, value) {
  if (value < 0) throw new TypeError('Value must be a positive number');
  const factors = EMISSION_FACTORS[category];
  if (!factors) throw new Error(`Unknown category: ${category}`);
  const factor = factors[subCategory];
  if (factor === undefined) throw new Error(`Unknown subcategory: ${subCategory}`);
  return Number((value * factor).toFixed(3));
}
function getGhostStateFromDailyEmissions(daily) {
  if (daily <= 20) return 'radiant';
  if (daily <= 40) return 'stable';
  if (daily <= 60) return 'fading';
  if (daily <= 80) return 'suffering';
  return 'critical';
}

/**
 * Controller to handle logging a carbon activity.
 * Recalculates user's streak and updates ghost state machine.
 */
export const logActivity = async (req, res, next) => {
  try {
    // 1. Validate request body with Zod
    const validatedData = activitySchema.parse(req.body);
    const { category, subCategory, value, unit, note } = validatedData;
    const uid = req.user.uid;

    // Calculate emissions via pure function
    const co2Emissions = calculateEmissions(category, subCategory, value);

    const db = admin.firestore();
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 2. Perform updates in a Firestore Transaction to guarantee state integrity
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(uid);
      const ghostRef = db.collection('ghost_states').doc(uid);

      const userDoc = await transaction.get(userRef);
      const ghostDoc = await transaction.get(ghostRef);

      if (!userDoc.exists || !ghostDoc.exists) {
        throw new Error('User or Ghost profile does not exist');
      }

      const userData = userDoc.data();
      const ghostData = ghostDoc.data();

      if (ghostData.isDead) {
        throw new Error('Cannot log activity for a deceased ghost. Trigger resurrection first.');
      }

      // 3. Query all activities logged today to find daily cumulative emissions
      const activitiesTodayQuery = db.collection('activities')
        .where('uid', '==', uid)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(todayStr)));

      const querySnapshot = await transaction.get(activitiesTodayQuery);
      let dailyTotalCo2 = co2Emissions;
      querySnapshot.forEach((doc) => {
        dailyTotalCo2 += doc.data().co2Emissions;
      });

      // 4. Score adjustment logic (Daily budget = 10kg)
      const BUDGET = 10.0;
      let newScore = ghostData.score;
      let newStreak = userData.currentStreak;
      let newResurrectionStatus = userData.resurrectionStatus;
      let newResurrectionStartDate = userData.resurrectionStartDate;

      if (dailyTotalCo2 <= BUDGET) {
        // Daily emission is under budget: increment score by +5
        newScore = Math.min(100, newScore + 5);
        
        // Update streak if this is a new active day
        if (userData.lastActiveDate !== todayStr) {
          newStreak += 1;
        }
      } else {
        // Daily emission exceeds budget: apply penalty of -2 per kg over budget (max -20)
        const excess = dailyTotalCo2 - BUDGET;
        const penalty = Math.min(20, excess * 2);
        newScore = Math.max(0, newScore - penalty);

        // STREAK BROKEN: Reset streaks immediately
        newStreak = 0;

        // Resurrection Progress resets if streak is broken
        if (newResurrectionStatus === 'active') {
          newResurrectionStatus = 'none';
          newResurrectionStartDate = null;
        }
      }

      // 5. State Machine classification
      const newState = getGhostStateFromDailyEmissions(dailyTotalCo2);

      // 6. Critical day tracking
      let consecutiveCriticalDays = ghostData.consecutiveCriticalDays || 0;
      let criticalStartDate = ghostData.criticalStartDate;
      let isDead = false;
      let deathTimestamp = null;
      let graveyardEntry = null;

      if (newState === 'critical') {
        if (consecutiveCriticalDays === 0) {
          criticalStartDate = admin.firestore.Timestamp.now();
        }
        consecutiveCriticalDays += 1;

        // GHOST DEATH: Trigger death sequence on exactly the 7th critical day
        if (consecutiveCriticalDays >= 7) {
          isDead = true;
          deathTimestamp = admin.firestore.Timestamp.now();
          consecutiveCriticalDays = 0; // Reset counter for next run

          // Generate Graveyard entry document
          const graveyardRef = db.collection('graveyard').doc();
          const hashUid = crypto.createHash('sha256').update(uid).digest('hex');
          
          graveyardEntry = {
            graveyardId: graveyardRef.id,
            originalUid: hashUid,
            ghostName: ghostData.name,
            finalScore: newScore,
            causeOfDeath: `${category} emissions (${subCategory})`,
            lifespanDays: Math.floor((Date.now() - userData.createdAt.toDate()) / (1000 * 60 * 60 * 24)) || 1,
            deathDate: deathTimestamp,
            totalCo2Emissions: dailyTotalCo2,
            certificateUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/certificates/${graveyardRef.id}.png`
          };

          transaction.set(graveyardRef, graveyardEntry);
        }
      } else {
        // Reset critical days count when state shifts out of critical
        consecutiveCriticalDays = 0;
        criticalStartDate = null;
      }

      // 7. Write new states back inside transaction
      const newActivityRef = db.collection('activities').doc();
      const activityData = {
        activityId: newActivityRef.id,
        uid,
        category,
        subCategory,
        value,
        unit,
        co2Emissions,
        timestamp: admin.firestore.Timestamp.now(),
        note: note || ''
      };

      transaction.set(newActivityRef, activityData);

      transaction.update(userRef, {
        currentStreak: newStreak,
        longestStreak: Math.max(userData.longestStreak, newStreak),
        lastActiveDate: todayStr,
        resurrectionStatus: newResurrectionStatus,
        resurrectionStartDate: newResurrectionStartDate
      });

      transaction.update(ghostRef, {
        score: newScore,
        state: newState,
        consecutiveCriticalDays,
        criticalStartDate,
        isDead,
        deathTimestamp,
        lastUpdated: admin.firestore.Timestamp.now()
      });

      return {
        activity: activityData,
        newScore,
        ghostState: newState,
        isDead,
        graveyardEntry
      };
    });

    return res.status(200).json({
      success: true,
      activity: result.activity,
      newScore: result.newScore,
      ghostState: result.ghostState,
      isDead: result.isDead,
      graveyardEntry: result.graveyardEntry
    });
  } catch (error) {
    // Pass errors down to Express central error handler
    next(error);
  }
};

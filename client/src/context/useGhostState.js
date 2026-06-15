import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom React Hook to subscribe to user's ghost state real-time from Firestore.
 * 
 * @param {string} userId - Auth user ID
 * @returns {object} { ghostState, weeklyScore, streak, isLoading }
 */
export default function useGhostState(userId) {
  const [ghostState, setGhostState] = useState(null);
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, 'ghost_states', userId);
    
    // Subscribe to Firestore changes
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGhostState(data);
          setWeeklyScore(data.score || 0);
          setStreak(data.consecutiveCriticalDays || 0);
        } else {
          // Fallback if document doesn't exist
          setGhostState({
            score: 80,
            state: 'stable',
            isDead: false,
            name: 'EcoGhost'
          });
          setWeeklyScore(80);
          setStreak(0);
        }
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { ghostState, weeklyScore, streak, isLoading };
}

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom React Hook to compute the current streak from user activity history.
 * A streak day is any calendar day where daily cumulative emissions <= 10 kg CO2e.
 * 
 * @param {string} userId - Current user ID
 * @returns {object} { currentStreak, longestStreak, isLoading }
 */
export default function useStreak(userId) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'activities'),
      where('uid', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const dailyLogs = {};
        
        // Group emissions by local date string (YYYY-MM-DD)
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.timestamp) return;

          const dateStr = data.timestamp.toDate().toISOString().split('T')[0];
          dailyLogs[dateStr] = (dailyLogs[dateStr] || 0) + (data.co2Emissions || 0);
        });

        // Compute streak (iterating backwards from today)
        let streak = 0;
        let maxStreak = 0;
        let tempStreak = 0;
        const BUDGET = 10.0;

        // Sort dates ascending
        const sortedDates = Object.keys(dailyLogs).sort();
        
        if (sortedDates.length > 0) {
          // Calculate historical longest streak
          let prevDate = null;
          for (const dateStr of sortedDates) {
            const co2 = dailyLogs[dateStr];
            if (co2 <= BUDGET) {
              if (prevDate) {
                const diffTime = Math.abs(new Date(dateStr) - new Date(prevDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 1) {
                  tempStreak += 1;
                } else {
                  tempStreak = 1;
                }
              } else {
                tempStreak = 1;
              }
              maxStreak = Math.max(maxStreak, tempStreak);
            } else {
              tempStreak = 0;
            }
            prevDate = dateStr;
          }

          // Calculate current active streak ending today or yesterday
          const todayStr = new Date().toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let checkDate = new Date();
          while (true) {
            const checkDateStr = checkDate.toISOString().split('T')[0];
            const co2 = dailyLogs[checkDateStr];

            // If we have data for this day, check budget
            if (co2 !== undefined) {
              if (co2 <= BUDGET) {
                streak += 1;
              } else {
                break; // Exceeded budget, break streak
              }
            } else {
              // No logs. If checking today or yesterday, allow continuity. Else break.
              if (checkDateStr !== todayStr && checkDateStr !== yesterdayStr) {
                break;
              }
            }
            // Step back one day
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }

        setCurrentStreak(streak);
        setLongestStreak(maxStreak);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { currentStreak, longestStreak, isLoading };
}

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom React Hook to manage user activity CRUD, linking Firestore and API endpoints.
 * 
 * @param {string} userId - Current user ID
 * @returns {object} { activities, logActivity, deleteActivity, weeklyTotal, isLoading }
 */
export default function useCarbon(userId) {
  const [activities, setActivities] = useState([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to activities collection
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
        const list = [];
        let total = 0;
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ activityId: docSnap.id, ...data });

          // Calculate running weekly total
          const timestamp = data.timestamp?.toDate()?.getTime() || Date.now();
          if (timestamp >= oneWeekAgo) {
            total += data.co2Emissions || 0;
          }
        });

        setActivities(list.sort((a, b) => b.timestamp - a.timestamp));
        setWeeklyTotal(total);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  /**
   * Dispatches new activity to server endpoint.
   */
  const logActivity = async (payload) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assuming AuthContext token passes in real implementation
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Deletes a recorded activity.
   */
  const deleteActivity = async (activityId) => {
    try {
      const docRef = doc(db, 'activities', activityId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  return { activities, logActivity, deleteActivity, weeklyTotal, isLoading };
}

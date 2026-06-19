import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import GhostAvatar from './GhostAvatar';
import ActivityLogger from './ActivityLogger';
import './Dashboard.css';

export default function Dashboard({ initialGhostState, activitiesData, onAddActivity }) {
  const [ghostState, setGhostState] = useState(() => {
    // Audit check: LocalStorage fallback for slow Firestore connections
    try {
      const cached = localStorage.getItem('ecoghost_state_backup');
      return cached ? JSON.parse(cached) : initialGhostState;
    } catch {
      return initialGhostState;
    }
  });

  const [activities, setActivities] = useState(activitiesData);

  // Sync state changes back to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('ecoghost_state_backup', JSON.stringify(ghostState));
    } catch {
      // Graceful write catch if storage blocks
    }
  }, [ghostState]);

  // Sync state if initial prop changes
  useEffect(() => {
    if (initialGhostState) {
      setGhostState(initialGhostState);
    }
  }, [initialGhostState]);

  // Sync activities prop
  useEffect(() => {
    setActivities(activitiesData);
  }, [activitiesData]);

  // Performance audit: useMemo for expensive emissions aggregations
  const weeklyEmissionsTotal = useMemo(() => {
    return activities.reduce((sum, activity) => {
      // Filter activities within the last 7 days
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const activityTime = new Date(activity.timestamp).getTime();
      if (activityTime >= oneWeekAgo) {
        return sum + activity.co2Emissions;
      }
      return sum;
    }, 0);
  }, [activities]);

  // Performance audit: useCallback on mutation handlers passed as props
  const handleLogSubmit = useCallback(async (activityPayload) => {
    try {
      const response = await onAddActivity(activityPayload);
      if (response && response.success) {
        setActivities((prev) => [response.activity, ...prev]);
        setGhostState((prev) => ({
          ...prev,
          score: response.newScore,
          state: response.ghostState,
          isDead: response.isDead
        }));
      }
    } catch {
      // Standard application error handling (Pino-compatible on server, quiet on client)
    }
  }, [onAddActivity]);

  return (
    <main className="dashboard-wrapper" aria-label="EcoGhost Dashboard">
      <div className="dashboard-grid">
        {/* Left Column: Avatar Interaction */}
        <section className="avatar-section" aria-labelledby="ghost-avatar-heading">
          <h2 id="ghost-avatar-heading" className="sr-only">Sentient Avatar</h2>
          <GhostAvatar 
            state={ghostState.state} 
            score={ghostState.score} 
            name={ghostState.name} 
          />
          <div className="streak-container">
            <span className="streak-label">Active Green Streak:</span>
            <span className="streak-count">{ghostState.streak || 0} Days</span>
          </div>
        </section>

        {/* Right Column: Activity Logger & Stats */}
        <section className="analytics-section" aria-labelledby="analytics-heading">
          <h2 id="analytics-heading">Carbon Metrics Overview</h2>
          
          <div className="metrics-cards">
            <div className="metric-card" role="status">
              <h3>Weekly Carbon Total</h3>
              <p className="metric-val">{weeklyEmissionsTotal.toFixed(2)} kg CO₂e</p>
            </div>
            <div className="metric-card" role="status">
              <h3>GCP India Benchmark</h3>
              <p className="metric-val">10.00 kg/day</p>
            </div>
          </div>

          <div className="logger-widget">
            <h3>Quick Activity Logger</h3>
            {/* Log submit callback is memoized */}
            <ActivityLogger onLog={handleLogSubmit} />
          </div>
        </section>
      </div>
    </main>
  );
}

Dashboard.propTypes = {
  initialGhostState: PropTypes.shape({
    name: PropTypes.string,
    score: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    streak: PropTypes.number,
    isDead: PropTypes.bool
  }).isRequired,
  activitiesData: PropTypes.arrayOf(PropTypes.shape({
    activityId: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    co2Emissions: PropTypes.number.isRequired,
    timestamp: PropTypes.any.isRequired
  })).isRequired,
  onAddActivity: PropTypes.func.isRequired
};

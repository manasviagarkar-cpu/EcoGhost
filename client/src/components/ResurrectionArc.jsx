import PropTypes from 'prop-types';
import './ResurrectionArc.css';

export default function ResurrectionArc({ streakDays = 0 }) {
  const TARGET_DAYS = 30;
  const progressPercent = Math.min(100, Math.floor((streakDays / TARGET_DAYS) * 100));
  const unlocked = streakDays >= TARGET_DAYS;

  // SVG Progress circle calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="resurrection-arc-box" aria-labelledby="arc-heading">
      <h3 id="arc-heading">Resurrection Arc</h3>
      <p className="arc-description">
        Stay under the 10kg daily emission budget for 30 consecutive days to resurrect your entity into a permanent Forest Spirit form.
      </p>

      <div className="streak-progress-ring-container">
        <svg className="progress-ring" width="120" height="120">
          <circle
            className="progress-ring-background"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className="progress-ring-bar"
            stroke={unlocked ? "#43e97b" : "#4facfe"}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
        </svg>
        <div className="streak-days-display" role="status" aria-live="polite">
          <span className="days-number">{streakDays}</span>
          <span className="days-label">/30 days</span>
        </div>
      </div>

      <div className="unlock-status-banner">
        {unlocked ? (
          <div className="unlocked-spirit" role="status">
            <span className="status-badge unlocked">UNLOCKED</span>
            <p className="status-msg">Your entity has evolved into a permanent Forest Spirit!</p>
          </div>
        ) : (
          <div className="locked-spirit" role="status">
            <span className="status-badge locked">LOCKED</span>
            <p className="status-msg">Forest Spirit Form is currently hidden in the shadows.</p>
          </div>
        )}
      </div>
    </div>
  );
}

ResurrectionArc.propTypes = {
  streakDays: PropTypes.number.isRequired
};

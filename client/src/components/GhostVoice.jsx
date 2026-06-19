import PropTypes from 'prop-types';
import './GhostVoice.css';

export default function GhostVoice({ message, isLoading, onRefresh }) {
  return (
    <div className="ghost-voice-bubble" aria-live="polite" aria-busy={isLoading}>
      <h4 className="voice-title">EcoGhost Whispers</h4>
      
      {isLoading ? (
        <div className="skeleton-container" aria-label="Ghost is thinking">
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line short"></div>
        </div>
      ) : (
        <p className="ghost-message-text">
          "{message || "Keep logging your habits... I'm watching your carbon footprints fade."}"
        </p>
      )}

      <button
        type="button"
        className="voice-refresh-btn"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh ghost voice message"
      >
        {isLoading ? 'Channelling...' : 'Refresh Whisper'}
      </button>
    </div>
  );
}

GhostVoice.propTypes = {
  message: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired
};

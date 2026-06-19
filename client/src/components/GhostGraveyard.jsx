import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './GhostGraveyard.css';

export default function GhostGraveyard({ gravesData }) {
  const [graves, setGraves] = useState(gravesData || []);

  useEffect(() => {
    if (gravesData) {
      setGraves(gravesData);
    }
  }, [gravesData]);

  return (
    <section className="graveyard-section" aria-labelledby="graveyard-heading">
      <header className="graveyard-header">
        <h2 id="graveyard-heading">The Ghost Graveyard</h2>
        <p className="graveyard-subtitle">Immortalizing the entities lost to high carbon choices</p>
      </header>

      {graves.length === 0 ? (
        <div className="empty-graveyard" role="status">
          <p>No ghosts rest here yet. Keep preserving your entities.</p>
        </div>
      ) : (
        <div className="graves-grid">
          {graves.map((grave, idx) => (
            <article key={grave.graveyardId || idx} className="grave-card" aria-label={`Tombstone of ${grave.ghostName}`}>
              <div className="grave-marker">RIP</div>
              <h3 className="grave-name">{grave.ghostName}</h3>
              
              <div className="grave-details">
                <div className="detail-row">
                  <span className="detail-label">Lifespan:</span>
                  <span className="detail-val">{grave.lifespanDays} Days</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Final Score:</span>
                  <span className="detail-val">{grave.finalScore} HP</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cause of Death:</span>
                  <span className="detail-val cause">{grave.causeOfDeath}</span>
                </div>
              </div>

              {grave.certificateUrl && (
                <a
                  href={grave.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cert-download-link"
                  aria-label={`View Death Certificate for ${grave.ghostName}`}
                >
                  View Death Certificate
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

GhostGraveyard.propTypes = {
  gravesData: PropTypes.arrayOf(
    PropTypes.shape({
      graveyardId: PropTypes.string,
      ghostName: PropTypes.string.isRequired,
      lifespanDays: PropTypes.number.isRequired,
      finalScore: PropTypes.number.isRequired,
      causeOfDeath: PropTypes.string.isRequired,
      certificateUrl: PropTypes.string
    })
  )
};

import { useState } from 'react';
import PropTypes from 'prop-types';
import './Actions.css';

const ECO_ACTIONS = {
  easy: [
    { title: 'Skip Meat for a Day', impact: 2.5, unit: 'kg CO2e', description: 'Swap beef/chicken meals for plant-based alternatives today.' },
    { title: 'Turn off Standby Appliances', impact: 0.8, unit: 'kg CO2e', description: 'Unplug unused household devices to stop vampire loads.' },
    { title: 'Choose Line Drying', impact: 1.5, unit: 'kg CO2e', description: 'Skip the dryer for one load and dry clothes in the sun.' }
  ],
  medium: [
    { title: 'Commute via Public Transit', impact: 8.5, unit: 'kg CO2e', description: 'Leave the car home and take the bus or local train.' },
    { title: 'Adjust AC by +2°C', impact: 4.2, unit: 'kg CO2e', description: 'Set temperature control to 26°C to minimize electrical pull.' },
    { title: 'Eco-mode Delivery Delivery', impact: 2.0, unit: 'kg CO2e', description: 'Opt for consolidated slow shipping on retail orders.' }
  ],
  committed: [
    { title: 'Switch to Solar/Wind Grid', impact: 350, unit: 'kg CO2e/year', description: 'Subscribe to clean power supplier packages or install panels.' },
    { title: 'Transition to EV / E-Bike', impact: 820, unit: 'kg CO2e/year', description: 'Ditch the combustion engine for daily operations.' },
    { title: 'Commit to Local Vegan Diet', impact: 980, unit: 'kg CO2e/year', description: 'Establish a plant-based food framework for the household.' }
  ]
};

export default function Actions({ onSelectAction }) {
  const [activeTier, setActiveTier] = useState('easy');

  return (
    <div className="eco-actions-box" aria-labelledby="actions-title">
      <header className="actions-header">
        <h3 id="actions-title">Eco Action Planner</h3>
        <p>Adopt high-impact habits to heal your spectral entity</p>
      </header>

      {/* Tier Switch tabs */}
      <div className="tier-tabs" role="tablist">
        {['easy', 'medium', 'committed'].map((tier) => (
          <button
            key={tier}
            type="button"
            role="tab"
            aria-selected={activeTier === tier}
            aria-controls={`panel-${tier}`}
            id={`tab-${tier}`}
            className={`tier-tab-btn ${activeTier === tier ? 'active' : ''}`}
            onClick={() => setActiveTier(tier)}
          >
            {tier.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Actions List Panel */}
      <div 
        id={`panel-${activeTier}`}
        role="tabpanel" 
        aria-labelledby={`tab-${activeTier}`}
        className="actions-panel"
      >
        <div className="actions-list">
          {ECO_ACTIONS[activeTier].map((action, index) => (
            <div key={index} className="action-row-card">
              <div className="action-body">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
              <div className="action-impact-badge">
                <span className="impact-val">-{action.impact}</span>
                <span className="impact-unit">{action.unit}</span>
              </div>
              {onSelectAction && (
                <button
                  type="button"
                  className="commit-btn"
                  onClick={() => onSelectAction(action)}
                  aria-label={`Commit to action: ${action.title}`}
                >
                  Commit
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Actions.propTypes = {
  onSelectAction: PropTypes.func
};

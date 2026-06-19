import PropTypes from 'prop-types';
import { calculateEmissions } from '../utils/carbonCalculator';
import './QuickLog.css';

const QUICK_BUTTONS = [
  { label: 'Drove 10km', category: 'transport', subCategory: 'gasoline_car', value: 10, unit: 'km' },
  { label: 'Flew', category: 'transport', subCategory: 'flight_short', value: 500, unit: 'km' },
  { label: 'Ate Beef', category: 'food', subCategory: 'beef', value: 0.25, unit: 'kg' },
  { label: 'Used AC 8h', category: 'energy', subCategory: 'electricity_india', value: 8, unit: 'kWh' },
  { label: 'Ordered Online', category: 'shopping', subCategory: 'general_goods', value: 2, unit: 'kg' },
  { label: 'Took Train', category: 'transport', subCategory: 'train', value: 50, unit: 'km' }
];

export default function QuickLog({ onQuickLog }) {
  const handleLogClick = (btn) => {
    try {
      const co2 = calculateEmissions(btn.category, btn.subCategory, btn.value);
      onQuickLog({
        category: btn.category,
        subCategory: btn.subCategory,
        value: btn.value,
        unit: btn.unit,
        note: `Quick Logged: ${btn.label} (+${co2.toFixed(2)} kg CO2e)`
      });
    } catch {
      // Graceful error isolation
    }
  };

  return (
    <div className="quicklog-container" aria-label="One-tap quick activity logger">
      <h4 className="quicklog-title">One-Tap Quick Log</h4>
      <div className="quicklog-grid">
        {QUICK_BUTTONS.map((btn, idx) => {
          const co2Preview = calculateEmissions(btn.category, btn.subCategory, btn.value);
          return (
            <button
              key={idx}
              type="button"
              className="quicklog-btn"
              onClick={() => handleLogClick(btn)}
              aria-label={`Log ${btn.label}, adding ${co2Preview.toFixed(2)} kg CO2e`}
            >
              <span className="btn-label">{btn.label}</span>
              <span className="btn-preview">+{co2Preview.toFixed(2)} kg</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

QuickLog.propTypes = {
  onQuickLog: PropTypes.func.isRequired
};

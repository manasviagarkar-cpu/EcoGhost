import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { calculateEmissions } from '../utils/carbonCalculator';
import './ActivityLogger.css';

const QUICK_LOG_OPTIONS = [
  { label: '5km Gas Car', category: 'transport', subCategory: 'gasoline_car', value: 5, unit: 'km' },
  { label: 'Vegan Meal', category: 'food', subCategory: 'vegan_meal', value: 1, unit: 'serving' },
  { label: '10 kWh Solar', category: 'energy', subCategory: 'solar_wind', value: 10, unit: 'kWh' },
  { label: 'Fast Fashion Item', category: 'shopping', subCategory: 'fast_fashion', value: 1, unit: 'item' }
];

export default function ActivityLogger({ onLog }) {
  const [category, setCategory] = useState('transport');
  const [subCategory, setSubCategory] = useState('gasoline_car');
  const [value, setValue] = useState(1);
  const [unit, setUnit] = useState('km');
  const [note, setNote] = useState('');
  const [livePreview, setLivePreview] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Recalculate live preview
  useEffect(() => {
    try {
      if (value > 0) {
        const co2 = calculateEmissions(category, subCategory, value);
        setLivePreview(co2);
        setErrorMsg('');
      } else {
        setLivePreview(0);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setLivePreview(0);
    }
  }, [category, subCategory, value]);

  // Adjust defaults when category changes
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    if (cat === 'transport') {
      setSubCategory('gasoline_car');
      setUnit('km');
    } else if (cat === 'food') {
      setSubCategory('vegetarian_meal');
      setUnit('serving');
    } else if (cat === 'energy') {
      setSubCategory('electricity_india');
      setUnit('kWh');
    } else if (cat === 'shopping') {
      setSubCategory('general_goods');
      setUnit('kg');
    }
  };

  const handleQuickLog = async (option) => {
    setLoading(true);
    try {
      await onLog({
        category: option.category,
        subCategory: option.subCategory,
        value: option.value,
        unit: option.unit,
        note: `Quick logged: ${option.label}`
      });
      setErrorMsg('');
    } catch {
      setErrorMsg('Failed to process quick log. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (value <= 0) {
      setErrorMsg('Logged value must be greater than zero');
      return;
    }
    setLoading(true);
    try {
      await onLog({
        category,
        subCategory,
        value: Number(value),
        unit,
        note
      });
      // Reset form fields
      setNote('');
      setValue(1);
      setErrorMsg('');
    } catch {
      setErrorMsg('Failed to record activity log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activity-logger-box">
      {/* Quick Logs */}
      <div className="quick-logs-section">
        <h4>Quick Log:</h4>
        <div className="quick-buttons-row">
          {QUICK_LOG_OPTIONS.map((option, idx) => (
            <button
              key={idx}
              type="button"
              className="quick-log-btn"
              onClick={() => handleQuickLog(option)}
              disabled={loading}
              aria-label={`Quick log ${option.label}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Log Form */}
      <form onSubmit={handleSubmit} className="custom-log-form" aria-label="Log custom carbon footprint activity">
        <div className="form-group">
          <label htmlFor="log-category">Category</label>
          <select id="log-category" value={category} onChange={handleCategoryChange} disabled={loading}>
            <option value="transport">Transport</option>
            <option value="food">Food</option>
            <option value="energy">Energy</option>
            <option value="shopping">Shopping</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="log-subcategory">Subcategory</label>
          <select 
            id="log-subcategory" 
            value={subCategory} 
            onChange={(e) => setSubCategory(e.target.value)} 
            disabled={loading}
          >
            {category === 'transport' && (
              <>
                <option value="gasoline_car">Gasoline Car (per km)</option>
                <option value="electric_vehicle">Electric Vehicle (per km)</option>
                <option value="bus">Bus (per km)</option>
                <option value="train">Train (per km)</option>
                <option value="flight_short">Short-haul flight (under 1000km)</option>
                <option value="flight_long">Long-haul flight (over 1000km)</option>
              </>
            )}
            {category === 'food' && (
              <>
                <option value="beef">Beef (per kg)</option>
                <option value="poultry">Poultry (per kg)</option>
                <option value="vegetarian_meal">Vegetarian serving</option>
                <option value="vegan_meal">Vegan serving</option>
                <option value="dairy">Dairy (per kg)</option>
              </>
            )}
            {category === 'energy' && (
              <>
                <option value="electricity_india">Electricity (India grid per kWh)</option>
                <option value="electricity_us">Electricity (US grid per kWh)</option>
                <option value="natural_gas">Natural Gas per kWh</option>
                <option value="solar_wind">Renewable Solar/Wind per kWh</option>
              </>
            )}
            {category === 'shopping' && (
              <>
                <option value="fast_fashion">Fast Fashion apparel item</option>
                <option value="electronics">Consumer electronics item</option>
                <option value="general_goods">General retail goods (per kg)</option>
              </>
            )}
          </select>
        </div>

        <div className="form-row-split">
          <div className="form-group">
            <label htmlFor="log-value">Quantity</label>
            <input
              id="log-value"
              type="number"
              step="any"
              min="0.001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              aria-describedby="log-unit"
              required
            />
          </div>
          <div className="form-group">
            <label id="log-unit" htmlFor="log-unit-val">Unit</label>
            <input id="log-unit-val" type="text" value={unit} readOnly aria-readonly="true" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="log-note">Additional Note</label>
          <input
            id="log-note"
            type="text"
            placeholder="e.g. Commute to client site"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
            maxLength={280}
          />
        </div>

        {/* Live Preview section */}
        <div className="live-preview-box" role="status" aria-live="polite">
          <span className="preview-label">Live Preview:</span>
          <span className="preview-value">{livePreview.toFixed(2)} kg CO₂e</span>
        </div>

        {errorMsg && (
          <div className="error-alert" role="alert">
            {errorMsg}
          </div>
        )}

        <button type="submit" className="submit-log-btn" disabled={loading}>
          {loading ? 'Recording...' : 'Log Activity'}
        </button>
      </form>
    </div>
  );
}

ActivityLogger.propTypes = {
  onLog: PropTypes.func.isRequired
};

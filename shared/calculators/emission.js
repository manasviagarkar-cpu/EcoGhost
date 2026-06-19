/**
 * Carbon Footprint Calculation Constants (sourced from EPA and IPCC 2023/2024 revisions)
 */
export const EMISSION_FACTORS = {
  transport: {
    gasoline_car: 0.170,  // kg CO2e per km
    electric_vehicle: 0.050, // kg CO2e per km
    bus: 0.089, // kg CO2e per passenger km
    train: 0.035, // kg CO2e per passenger km
    flight_short: 0.250, // kg CO2e per passenger km (< 1000 km)
    flight_long: 0.150 // kg CO2e per passenger km (> 1000 km)
  },
  food: {
    beef: 27.000, // kg CO2e per kg
    poultry: 6.900, // kg CO2e per kg
    vegetarian_meal: 0.800, // kg CO2e per serving
    vegan_meal: 0.500, // kg CO2e per serving
    dairy: 3.200 // kg CO2e per kg
  },
  energy: {
    electricity_india: 0.820, // kg CO2e per kWh
    electricity_us: 0.370, // kg CO2e per kWh
    natural_gas: 0.185, // kg CO2e per kWh
    solar_wind: 0.012 // kg CO2e per kWh
  },
  shopping: {
    fast_fashion: 15.000, // kg CO2e per item
    electronics: 80.000, // kg CO2e per item
    general_goods: 3.000 // kg CO2e per kg
  }
};

/**
 * Calculates emissions for a specific category and subcategory.
 * This is a pure function with no side effects.
 * 
 * @param {string} category 
 * @param {string} subCategory 
 * @param {number} value 
 * @returns {number} calculated emissions in kg CO2e
 */
export function calculateEmissions(category, subCategory, value) {
  if (value < 0) {
    throw new TypeError('Value must be a positive number');
  }
  
  const factors = EMISSION_FACTORS[category];
  if (!factors) {
    throw new Error(`Unknown carbon category: ${category}`);
  }

  const factor = factors[subCategory];
  if (factor === undefined) {
    throw new Error(`Unknown carbon subcategory: ${subCategory} in category ${category}`);
  }

  return Number((value * factor).toFixed(3));
}

/**
 * Maps a daily total emission level to the Ghost's health state.
 * Boundary values are tested:
 * - exactly 20 kg = Radiant
 * - exactly 21 kg = Stable
 * 
 * @param {number} dailyEmissions - total daily emissions in kg CO2e
 * @returns {string} ghost health state ('radiant' | 'stable' | 'fading' | 'suffering' | 'critical')
 */
export function getGhostStateFromDailyEmissions(dailyEmissions) {
  if (dailyEmissions < 0) {
    throw new TypeError('Daily emissions cannot be negative');
  }

  if (dailyEmissions <= 20.0) {
    return 'radiant';
  } else if (dailyEmissions <= 40.0) {
    return 'stable';
  } else if (dailyEmissions <= 60.0) {
    return 'fading';
  } else if (dailyEmissions <= 80.0) {
    return 'suffering';
  } else {
    return 'critical';
  }
}

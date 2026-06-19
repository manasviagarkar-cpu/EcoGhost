import {
  EMISSION_FACTORS as SHARED_EMISSION_FACTORS,
  calculateEmissions as sharedCalculateEmissions,
  getGhostStateFromDailyEmissions as sharedGetGhostStateFromDailyEmissions
} from '../../../shared/calculators/emission.js';

/**
 * Carbon Footprint Calculation Constants (sourced from EPA and IPCC 2023/2024 revisions)
 */
export const EMISSION_FACTORS = SHARED_EMISSION_FACTORS;

/**
 * Calculates emissions for a specific category and subcategory.
 * 
 * @param {string} category 
 * @param {string} subCategory 
 * @param {number} value 
 * @returns {number} calculated emissions in kg CO2e
 */
export function calculateEmissions(category, subCategory, value) {
  return sharedCalculateEmissions(category, subCategory, value);
}

/**
 * Maps a daily total emission level to the Ghost's health state.
 * 
 * @param {number} dailyEmissions - total daily emissions in kg CO2e
 * @returns {string} ghost health state ('radiant' | 'stable' | 'fading' | 'suffering' | 'critical')
 */
export function getGhostStateFromDailyEmissions(dailyEmissions) {
  return sharedGetGhostStateFromDailyEmissions(dailyEmissions);
}

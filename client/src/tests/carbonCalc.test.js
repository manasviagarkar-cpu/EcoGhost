import { describe, it, expect } from 'vitest';
import {
  calculateEmissions,
  getGhostStateFromDailyEmissions,
  EMISSION_FACTORS
} from '../utils/carbonCalculator';

describe('Carbon Calculation Engine Unit Tests', () => {
  // ── Transport Tests ──────────────────────────────────────────────────
  it('should compute gasoline car emissions correctly', () => {
    const co2 = calculateEmissions('transport', 'gasoline_car', 10);
    expect(co2).toBe(1.7);
  });

  it('should compute electric vehicle emissions correctly', () => {
    const co2 = calculateEmissions('transport', 'electric_vehicle', 100);
    expect(co2).toBe(5.0);
  });

  it('should compute bus transport emissions correctly', () => {
    const co2 = calculateEmissions('transport', 'bus', 20);
    expect(co2).toBe(1.78);
  });

  it('should compute train transport emissions correctly', () => {
    const co2 = calculateEmissions('transport', 'train', 50);
    expect(co2).toBe(1.75);
  });

  it('should compute flight short-haul emissions correctly', () => {
    const co2 = calculateEmissions('transport', 'flight_short', 1000);
    expect(co2).toBe(250);
  });

  it('should compute flight long-haul emissions correctly', () => {
    const co2 = calculateEmissions('transport', 'flight_long', 2000);
    expect(co2).toBe(300);
  });

  it('should compute single km gasoline car correctly', () => {
    const co2 = calculateEmissions('transport', 'gasoline_car', 1);
    expect(co2).toBeCloseTo(0.17, 2);
  });

  it('should compute EV 50km correctly', () => {
    const co2 = calculateEmissions('transport', 'electric_vehicle', 50);
    expect(co2).toBeCloseTo(2.5, 1);
  });

  it('should compute 100km bus trip correctly', () => {
    const co2 = calculateEmissions('transport', 'bus', 100);
    expect(co2).toBeCloseTo(8.9, 1);
  });

  it('should compute 200km train trip correctly', () => {
    const co2 = calculateEmissions('transport', 'train', 200);
    expect(co2).toBeCloseTo(7.0, 1);
  });

  // ── Food Tests ────────────────────────────────────────────────────────
  it('should compute beef consumption emissions correctly', () => {
    const co2 = calculateEmissions('food', 'beef', 2);
    expect(co2).toBe(54.0);
  });

  it('should compute vegetarian meals emissions correctly', () => {
    const co2 = calculateEmissions('food', 'vegetarian_meal', 3);
    expect(co2).toBe(2.4);
  });

  it('should compute vegan meals emissions correctly', () => {
    const co2 = calculateEmissions('food', 'vegan_meal', 5);
    expect(co2).toBe(2.5);
  });

  it('should compute 1kg beef correctly', () => {
    const co2 = calculateEmissions('food', 'beef', 1);
    expect(co2).toBe(27.0);
  });

  it('should compute poultry emissions correctly', () => {
    const co2 = calculateEmissions('food', 'poultry', 1);
    expect(co2).toBeCloseTo(6.9, 1);
  });

  it('should compute dairy emissions correctly', () => {
    const co2 = calculateEmissions('food', 'dairy', 2);
    expect(co2).toBeCloseTo(6.4, 1);
  });

  // ── Energy Tests ──────────────────────────────────────────────────────
  it('should compute electricity (India grid) emissions correctly', () => {
    const co2 = calculateEmissions('energy', 'electricity_india', 10);
    expect(co2).toBe(8.2);
  });

  it('should compute electricity (US grid) emissions correctly', () => {
    const co2 = calculateEmissions('energy', 'electricity_us', 10);
    expect(co2).toBe(3.7);
  });

  it('should compute renewable energy (solar/wind) emissions correctly', () => {
    const co2 = calculateEmissions('energy', 'solar_wind', 100);
    expect(co2).toBe(1.2);
  });

  it('should compute natural gas emissions correctly', () => {
    const co2 = calculateEmissions('energy', 'natural_gas', 50);
    expect(co2).toBeCloseTo(9.25, 1);
  });

  it('should compute 1 kWh India grid correctly', () => {
    const co2 = calculateEmissions('energy', 'electricity_india', 1);
    expect(co2).toBeCloseTo(0.82, 2);
  });

  // ── Shopping Tests ────────────────────────────────────────────────────
  it('should compute fast fashion shopping emissions correctly', () => {
    const co2 = calculateEmissions('shopping', 'fast_fashion', 3);
    expect(co2).toBe(45);
  });

  it('should compute consumer electronics emissions correctly', () => {
    const co2 = calculateEmissions('shopping', 'electronics', 2);
    expect(co2).toBe(160);
  });

  it('should compute general goods shopping correctly', () => {
    const co2 = calculateEmissions('shopping', 'general_goods', 5);
    expect(co2).toBe(15.0);
  });

  it('should compute 1 fast fashion item correctly', () => {
    const co2 = calculateEmissions('shopping', 'fast_fashion', 1);
    expect(co2).toBe(15.0);
  });

  // ── Edge Case & Validation Tests ──────────────────────────────────────
  it('should return 0 emissions for zero input quantity', () => {
    expect(calculateEmissions('transport', 'gasoline_car', 0)).toBe(0);
  });

  it('should return 0 for zero food quantity', () => {
    expect(calculateEmissions('food', 'beef', 0)).toBe(0);
  });

  it('should return 0 for zero energy quantity', () => {
    expect(calculateEmissions('energy', 'electricity_india', 0)).toBe(0);
  });

  it('should throw error for negative input quantity', () => {
    expect(() => calculateEmissions('transport', 'gasoline_car', -10)).toThrow(TypeError);
  });

  it('should throw error for negative food input', () => {
    expect(() => calculateEmissions('food', 'beef', -5)).toThrow(TypeError);
  });

  it('should throw error for unknown category inputs', () => {
    expect(() => calculateEmissions('invalid_category', 'sub', 10)).toThrow();
  });

  it('should throw error for unknown subcategory inputs', () => {
    expect(() => calculateEmissions('transport', 'spaceship', 10)).toThrow();
  });

  it('should throw error for unknown food subcategory', () => {
    expect(() => calculateEmissions('food', 'mystery_meat', 1)).toThrow();
  });

  // ── EMISSION_FACTORS structure tests ──────────────────────────────────
  it('should export EMISSION_FACTORS object with transport key', () => {
    expect(EMISSION_FACTORS).toHaveProperty('transport');
  });

  it('should export EMISSION_FACTORS object with food key', () => {
    expect(EMISSION_FACTORS).toHaveProperty('food');
  });

  it('should export EMISSION_FACTORS object with energy key', () => {
    expect(EMISSION_FACTORS).toHaveProperty('energy');
  });

  it('should export EMISSION_FACTORS object with shopping key', () => {
    expect(EMISSION_FACTORS).toHaveProperty('shopping');
  });

  // ── getGhostStateFromDailyEmissions boundary tests ────────────────────
  it('should classify exactly 20.0kg daily emissions as radiant', () => {
    expect(getGhostStateFromDailyEmissions(20.0)).toBe('radiant');
  });

  it('should classify exactly 20.1kg daily emissions as stable', () => {
    expect(getGhostStateFromDailyEmissions(20.1)).toBe('stable');
  });

  it('should classify 0 daily emissions as radiant', () => {
    expect(getGhostStateFromDailyEmissions(0)).toBe('radiant');
  });

  it('should classify 100 daily emissions as critical', () => {
    expect(getGhostStateFromDailyEmissions(100)).toBe('critical');
  });
});

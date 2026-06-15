import { describe, it, expect } from 'vitest';
import { getGhostState, isGhostDead, getResurrectionProgress, STATE_CONFIGS } from '../utils/ghostEngine';

describe('Ghost State Machine Engine Tests', () => {
  // ── Boundary tests: 0-20 → Radiant ──────────────────────────────────
  it('should return radiant state at 0kg emissions', () => {
    expect(getGhostState(0).state).toBe('radiant');
  });

  it('should return radiant state at 15kg emissions', () => {
    expect(getGhostState(15).state).toBe('radiant');
  });

  it('should return radiant state at boundary 20kg emissions', () => {
    expect(getGhostState(20).state).toBe('radiant');
  });

  // ── Boundary tests: 21-50 → Stable ──────────────────────────────────
  it('should transition to stable state at boundary 21kg emissions', () => {
    expect(getGhostState(21).state).toBe('stable');
  });

  it('should return stable state at 35kg emissions', () => {
    expect(getGhostState(35).state).toBe('stable');
  });

  it('should return stable state at boundary 50kg emissions', () => {
    expect(getGhostState(50).state).toBe('stable');
  });

  // ── Boundary tests: 51-100 → Fading ─────────────────────────────────
  it('should transition to fading state at boundary 51kg emissions', () => {
    expect(getGhostState(51).state).toBe('fading');
  });

  it('should return fading state at 75kg emissions', () => {
    expect(getGhostState(75).state).toBe('fading');
  });

  it('should return fading state at boundary 100kg emissions', () => {
    expect(getGhostState(100).state).toBe('fading');
  });

  // ── Boundary tests: 101-200 → Suffering ─────────────────────────────
  it('should transition to suffering state at boundary 101kg emissions', () => {
    expect(getGhostState(101).state).toBe('suffering');
  });

  it('should return suffering state at 150kg emissions', () => {
    expect(getGhostState(150).state).toBe('suffering');
  });

  it('should return suffering state at boundary 200kg emissions', () => {
    expect(getGhostState(200).state).toBe('suffering');
  });

  // ── Boundary tests: 201+ → Critical ─────────────────────────────────
  it('should transition to critical state at boundary 201kg emissions', () => {
    expect(getGhostState(201).state).toBe('critical');
  });

  it('should return critical state at 500kg emissions', () => {
    expect(getGhostState(500).state).toBe('critical');
  });

  // ── Negative validation ──────────────────────────────────────────────
  it('should throw error for negative weekly carbon values', () => {
    expect(() => getGhostState(-10)).toThrow(TypeError);
  });

  // ── Death detection ──────────────────────────────────────────────────
  it('should not detect death for critical state under 7 days', () => {
    expect(isGhostDead('critical', 5)).toBe(false);
  });

  it('should detect death at exactly 7 critical days', () => {
    expect(isGhostDead('critical', 7)).toBe(true);
  });

  it('should detect death for critical state over 7 days', () => {
    expect(isGhostDead('critical', 10)).toBe(true);
  });

  it('should not detect death if state is not critical regardless of days', () => {
    expect(isGhostDead('suffering', 10)).toBe(false);
  });

  it('should not detect death for radiant state with 0 days', () => {
    expect(isGhostDead('radiant', 0)).toBe(false);
  });

  // ── Resurrection checks ──────────────────────────────────────────────
  it('should return unlocked true and 100% progress at day 30', () => {
    const progress = getResurrectionProgress(30);
    expect(progress.unlocked).toBe(true);
    expect(progress.percentage).toBe(100);
  });

  it('should return unlocked false at day 29', () => {
    const progress = getResurrectionProgress(29);
    expect(progress.unlocked).toBe(false);
  });

  it('should return 50% progress at day 15', () => {
    const progress = getResurrectionProgress(15);
    expect(progress.percentage).toBe(50);
  });

  it('should return 0% at day 0', () => {
    const progress = getResurrectionProgress(0);
    expect(progress.percentage).toBe(0);
    expect(progress.unlocked).toBe(false);
  });

  it('should return correct cssClass for each state in STATE_CONFIGS', () => {
    expect(STATE_CONFIGS.radiant.cssClass).toBe('radiant');
    expect(STATE_CONFIGS.critical.cssClass).toBe('critical');
  });
});

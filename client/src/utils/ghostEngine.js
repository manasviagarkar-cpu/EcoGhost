/**
 * Core Ghost State Machine Engine.
 * Manages weekly carbon emission health evaluations.
 */

export const STATE_CONFIGS = {
  radiant: {
    state: 'radiant',
    label: 'Radiant Spirit',
    cssClass: 'radiant',
    ariaDescription: 'happy, glowing brightly with healthy cyan light',
    animationIntensity: 'gentle-float-high',
    colorPalette: ['#00f2fe', '#4facfe'],
    audioType: 'harmonic-sine'
  },
  stable: {
    state: 'stable',
    label: 'Stable Entity',
    cssClass: 'stable',
    ariaDescription: 'content, floating steadily with a calm green aura',
    animationIntensity: 'normal-float',
    colorPalette: ['#43e97b', '#38f9d7'],
    audioType: 'vibrato-sine'
  },
  fading: {
    state: 'fading',
    label: 'Fading Presence',
    cssClass: 'fading',
    ariaDescription: 'lethargic, greyish tone and starting to lose definition',
    animationIntensity: 'slow-drag',
    colorPalette: ['#b0c4de', '#7eb8d4'],
    audioType: 'wind-triangle'
  },
  suffering: {
    state: 'suffering',
    label: 'Suffering Spirit',
    cssClass: 'suffering',
    ariaDescription: 'injured, shivering rapidly and flashing with purple energy',
    animationIntensity: 'rapid-shiver',
    colorPalette: ['#d3d3d3', '#a9a9a9'],
    audioType: 'tremolo-saw'
  },
  critical: {
    state: 'critical',
    label: 'Critical Form',
    cssClass: 'critical',
    ariaDescription: 'dying, flickering aggressively and collapsing in charcoal smoke',
    animationIntensity: 'chaotic-jitter',
    colorPalette: ['#555555', '#111111'],
    audioType: 'bitcrush-square'
  }
};

/**
 * Maps weekly carbon emissions (in kg CO2e) to a Ghost Health configuration.
 * Thresholds: 0-20 -> Radiant, 21-50 -> Stable, 51-100 -> Fading, 101-200 -> Suffering, 200+ -> Critical
 */
export function getGhostState(weeklyKg) {
  if (weeklyKg < 0) {
    throw new TypeError('Weekly carbon footprint value cannot be negative');
  }

  if (weeklyKg <= 20) {
    return STATE_CONFIGS.radiant;
  } else if (weeklyKg <= 50) {
    return STATE_CONFIGS.stable;
  } else if (weeklyKg <= 100) {
    return STATE_CONFIGS.fading;
  } else if (weeklyKg <= 200) {
    return STATE_CONFIGS.suffering;
  } else {
    return STATE_CONFIGS.critical;
  }
}

/**
 * Returns true if the ghost has spent 7 or more consecutive days in a critical state.
 */
export function isGhostDead(state, consecutiveCriticalDays) {
  return state === 'critical' && consecutiveCriticalDays >= 7;
}

/**
 * Evaluates the progress of the 30-day streak.
 */
export function getResurrectionProgress(streakDays) {
  if (streakDays < 0) {
    throw new TypeError('Streak days cannot be negative');
  }
  const percentage = Math.min(100, Math.floor((streakDays / 30) * 100));
  return {
    percentage,
    unlocked: streakDays >= 30
  };
}

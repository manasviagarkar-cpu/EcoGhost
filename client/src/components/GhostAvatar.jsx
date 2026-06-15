import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './GhostAvatar.css';

/**
 * Sound synthesis parameters per state.
 */
const SYNTH_PROFILES = {
  radiant: { type: 'sine', freq: 528, detune: 0, q: 1, gain: 0.1, duration: 1.0 },
  stable: { type: 'sine', freq: 432, detune: 2, q: 2, gain: 0.1, duration: 0.8 },
  fading: { type: 'triangle', freq: 320, detune: 5, q: 0.5, gain: 0.08, duration: 1.2 },
  suffering: { type: 'sawtooth', freq: 220, detune: 20, q: 5, gain: 0.05, duration: 0.6 },
  critical: { type: 'square', freq: 110, detune: 50, q: 10, gain: 0.04, duration: 0.5 }
};

export default function GhostAvatar({ state, score, name }) {
  const [isVisible, setIsVisible] = useState(true);
  const audioContextRef = useRef(null);

  // Track Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Play synthesizer hum representing the Ghost's current health state.
   */
  const playStateSound = () => {
    try {
      const profile = SYNTH_PROFILES[state];
      if (!profile) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = profile.type;
      osc.frequency.setValueAtTime(profile.freq, ctx.currentTime);
      osc.detune.setValueAtTime(profile.detune, ctx.currentTime);

      filter.type = state === 'suffering' || state === 'critical' ? 'highpass' : 'lowpass';
      filter.frequency.setValueAtTime(profile.freq * 1.5, ctx.currentTime);
      filter.Q.setValueAtTime(profile.q, ctx.currentTime);

      // Fade-in and Fade-out to avoid audio clicks
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(profile.gain, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + profile.duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + profile.duration);
    } catch (err) {
      // Graceful error handling for audio blockades by browsers
      // (Do not console.log in production)
    }
  };

  const getAriaLabel = () => {
    return `Ghost Avatar named ${name || 'EcoGhost'}. Health score is ${score} out of 100. The ghost is currently in a ${state} state.`;
  };

  return (
    <div 
      className={`ghost-avatar-container ${state} ${isVisible ? 'active' : 'paused'}`}
      onClick={playStateSound}
      role="img"
      aria-label={getAriaLabel()}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') playStateSound(); }}
    >
      <svg
        className="ghost-svg"
        viewBox="0 0 100 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cyan-white-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
          <linearGradient id="green-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#43e97b" />
            <stop offset="100%" stopColor="#38f9d7" />
          </linearGradient>
          
          <filter id="radiant-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ghost Body */}
        <path
          className="ghost-body-path"
          d="M 20,50 
             C 20,20 80,20 80,50 
             L 80,95 
             C 70,90 65,100 60,95 
             C 55,90 45,90 40,95 
             C 35,100 30,90 20,95 
             Z"
        />

        {/* Eyes based on state */}
        <g className="ghost-eyes">
          {state === 'radiant' && (
            <>
              {/* Smiling curved eyes */}
              <path d="M 33,45 Q 38,40 43,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 57,45 Q 62,40 67,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {state === 'stable' && (
            <>
              {/* Normal friendly circles */}
              <circle cx="38" cy="45" r="4" fill="currentColor" />
              <circle cx="62" cy="45" r="4" fill="currentColor" />
            </>
          )}
          {state === 'fading' && (
            <>
              {/* Simple horizontal lines */}
              <line x1="33" y1="45" x2="43" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="57" y1="45" x2="67" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {state === 'suffering' && (
            <>
              {/* Downward slanting worried lines */}
              <line x1="33" y1="43" x2="43" y2="47" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="67" y1="43" x2="57" y2="47" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {state === 'critical' && (
            <>
              {/* Crosses for eyes */}
              <path d="M 33,40 L 43,50 M 43,40 L 33,50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 57,40 L 67,50 M 67,40 L 57,50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* Mouth based on state */}
        <g className="ghost-mouth">
          {state === 'radiant' && (
            <path d="M 44,55 Q 50,62 56,55" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          )}
          {state === 'stable' && (
            <path d="M 46,56 Q 50,60 54,56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {state === 'fading' && (
            <line x1="46" y1="58" x2="54" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {state === 'suffering' && (
            <path d="M 44,60 Q 50,53 56,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {state === 'critical' && (
            <circle cx="50" cy="60" r="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
          )}
        </g>
      </svg>
      <div className="ghost-score-badge" aria-hidden="true">
        {name || 'Ghost'}: {score} HP
      </div>
    </div>
  );
}

GhostAvatar.propTypes = {
  state: PropTypes.oneOf(['radiant', 'stable', 'fading', 'suffering', 'critical']).isRequired,
  score: PropTypes.number.isRequired,
  name: PropTypes.string
};

GhostAvatar.defaultProps = {
  name: 'EcoGhost'
};

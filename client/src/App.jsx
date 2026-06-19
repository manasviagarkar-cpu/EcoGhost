import { useState, useCallback, useEffect } from 'react';
import GhostAvatar from './components/GhostAvatar';
import GhostVoice from './components/GhostVoice';
import QuickLog from './components/QuickLog';
import GhostGraveyard from './components/GhostGraveyard';
import ResurrectionArc from './components/ResurrectionArc';
import ActivityLogger from './components/ActivityLogger';
import { calculateEmissions } from './utils/carbonCalculator';
import { getGhostState } from './utils/ghostEngine';

const DEMO_GRAVEYARD = [
  { ghostName: 'CarbonZilla', finalScore: 5, causeOfDeath: 'Excessive flying and beef consumption', lifespanDays: 42, deathDate: '2026-06-01', totalCo2Emissions: 3200 },
  { ghostName: 'Petrol Pete', finalScore: 2, causeOfDeath: 'Daily 200km commute in gasoline car', lifespanDays: 14, deathDate: '2026-05-28', totalCo2Emissions: 4800 },
  { ghostName: 'Fashion Ghost', finalScore: 8, causeOfDeath: 'Fast fashion addiction (150 items)', lifespanDays: 60, deathDate: '2026-06-10', totalCo2Emissions: 2250 }
];

function App() {
  const [ghostState, setGhostState] = useState({
    name: 'EcoGhost',
    score: 80,
    state: 'stable',
    streak: 3,
    isDead: false
  });

  const [activities, setActivities] = useState([]);
  const [weeklyEmissions, setWeeklyEmissions] = useState(0);
  const [voiceMessage, setVoiceMessage] = useState("I feel your energy. Keep those emissions low and I'll glow bright for you.");
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Recalculate ghost state based on weekly emissions
  useEffect(() => {
    const newState = getGhostState(weeklyEmissions);
    const newScore = Math.max(0, Math.min(100, 100 - Math.floor(weeklyEmissions / 2)));
    setGhostState(prev => ({
      ...prev,
      state: newState.state,
      score: newScore
    }));
  }, [weeklyEmissions]);

  const handleQuickLog = useCallback((payload) => {
    const co2 = calculateEmissions(payload.category, payload.subCategory, payload.value);
    const newActivity = {
      activityId: `act_${Date.now()}`,
      category: payload.category,
      subCategory: payload.subCategory,
      value: payload.value,
      unit: payload.unit,
      co2Emissions: co2,
      timestamp: new Date().toISOString(),
      note: payload.note
    };
    setActivities(prev => [newActivity, ...prev]);
    setWeeklyEmissions(prev => prev + co2);
  }, []);

  const handleVoiceRefresh = useCallback(async () => {
    setIsVoiceLoading(true);
    // Demo: simulate AI response based on state
    await new Promise(r => setTimeout(r, 1200));
    const messages = {
      radiant: "I'm glowing! Your green choices are making me radiant. Keep this streak alive! 🌟",
      stable: "Not bad, human. I'm stable for now — but don't get comfortable with that gasoline habit.",
      fading: "I can feel myself going grey... your carbon choices are draining my energy.",
      suffering: "I'm shivering... each emission you add feels like a knife in my ectoplasm.",
      critical: "I'm almost gone. Do you even care? 7 days at this rate and I cease to exist."
    };
    setVoiceMessage(messages[ghostState.state] || messages.stable);
    setIsVoiceLoading(false);
  }, [ghostState.state]);

  const handleDetailedLog = useCallback(async (payload) => {
    const co2 = payload.co2Emissions || calculateEmissions(payload.category, payload.subCategory, payload.value);
    const newActivity = {
      activityId: `act_${Date.now()}`,
      ...payload,
      co2Emissions: co2,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
    setWeeklyEmissions(prev => prev + co2);
    return { success: true, activity: newActivity, newScore: ghostState.score, ghostState: ghostState.state, isDead: false };
  }, [ghostState]);

  return (
    <div className="app-shell">
      {/* Skip to Content */}
      <a href="#main-content" className="skip-link">Skip to Content</a>

      {/* Header */}
      <header className="app-header" role="banner">
        <div className="header-inner">
          <div className="logo-group">
            <span className="logo-icon">👻</span>
            <span className="logo-text">EcoGhost</span>
            <span className="logo-tagline">Carbon Footprint Awareness</span>
          </div>
          <nav className="app-nav" role="navigation" aria-label="Main navigation">
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              id="nav-dashboard"
            >Dashboard</button>
            <button 
              className={`nav-btn ${activeTab === 'graveyard' ? 'active' : ''}`}
              onClick={() => setActiveTab('graveyard')}
              id="nav-graveyard"
            >Graveyard</button>
            <button 
              className={`nav-btn ${activeTab === 'resurrection' ? 'active' : ''}`}
              onClick={() => setActiveTab('resurrection')}
              id="nav-resurrection"
            >Resurrection</button>
          </nav>
          <div className="header-stats" aria-label="Weekly emissions summary" role="status">
            <span className="stat-chip">
              🌍 Weekly: <strong>{weeklyEmissions.toFixed(1)} kg CO₂e</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="app-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout">
            {/* Left: Ghost Avatar + Voice */}
            <aside className="ghost-panel" aria-label="Ghost avatar panel">
              <GhostAvatar
                state={ghostState.state}
                score={ghostState.score}
                name={ghostState.name}
              />
              <div className="state-badge" data-state={ghostState.state}>
                {ghostState.state.toUpperCase()} SPIRIT
              </div>
              <GhostVoice
                message={voiceMessage}
                isLoading={isVoiceLoading}
                onRefresh={handleVoiceRefresh}
              />
              <QuickLog onQuickLog={handleQuickLog} />
            </aside>

            {/* Right: Metrics + Logger */}
            <section className="metrics-panel" aria-label="Carbon metrics">
              <div className="metrics-header">
                <h1 className="metrics-title">Carbon Metrics Overview</h1>
                <p className="metrics-subtitle">Track your ecological footprint in real time</p>
              </div>

              <div className="kpi-grid" role="list" aria-label="Key performance indicators">
                <div className="kpi-card" role="listitem">
                  <div className="kpi-icon">📊</div>
                  <div className="kpi-label">Weekly CO₂</div>
                  <div className="kpi-value" role="status">{weeklyEmissions.toFixed(2)} kg</div>
                  <div className="kpi-baseline">Budget: 70 kg/week</div>
                </div>
                <div className="kpi-card" role="listitem">
                  <div className="kpi-icon">❤️‍🔥</div>
                  <div className="kpi-label">Ghost Health</div>
                  <div className="kpi-value" role="status">{ghostState.score}/100</div>
                  <div className="kpi-baseline">State: {ghostState.state}</div>
                </div>
                <div className="kpi-card" role="listitem">
                  <div className="kpi-icon">🔥</div>
                  <div className="kpi-label">Green Streak</div>
                  <div className="kpi-value" role="status">{ghostState.streak} days</div>
                  <div className="kpi-baseline">Best: {ghostState.streak} days</div>
                </div>
                <div className="kpi-card" role="listitem">
                  <div className="kpi-icon">📝</div>
                  <div className="kpi-label">Activities</div>
                  <div className="kpi-value" role="status">{activities.length}</div>
                  <div className="kpi-baseline">Logged today</div>
                </div>
              </div>

              <div className="activity-logger-section">
                <h2 className="section-title">Log Detailed Activity</h2>
                <ActivityLogger onLog={handleDetailedLog} />
              </div>

              {activities.length > 0 && (
                <div className="recent-activities" aria-label="Recent activity log">
                  <h2 className="section-title">Recent Activities</h2>
                  <ul className="activity-list" role="list">
                    {activities.slice(0, 5).map(a => (
                      <li key={a.activityId} className="activity-item" role="listitem">
                        <span className="activity-category">{a.category}</span>
                        <span className="activity-note">{a.note || `${a.subCategory} — ${a.value} ${a.unit}`}</span>
                        <span className="activity-co2">+{a.co2Emissions.toFixed(2)} kg CO₂e</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'graveyard' && (
          <div className="graveyard-view">
            <GhostGraveyard graves={DEMO_GRAVEYARD} />
          </div>
        )}

        {activeTab === 'resurrection' && (
          <div className="resurrection-view">
            <ResurrectionArc
              streakDays={ghostState.streak}
              ghostName={ghostState.name}
              isResurrecting={ghostState.streak > 0}
            />
          </div>
        )}
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>EcoGhost — PromptWars Challenge 3 Submission · Built with Gemini 2.5 Flash AI + GCP Cloud Run</p>
      </footer>
    </div>
  );
}

export default App;

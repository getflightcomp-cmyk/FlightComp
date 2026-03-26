export default function HookScreen({ onStart }) {
  return (
    <div className="hook-screen slide-up">
      <div className="hook-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        EU Regulation 261/2004 · UK261
      </div>

      <h1 className="hook-headline">
        Airlines owe you up to <em>€600</em> in cash.
      </h1>

      <p className="hook-subline">
        Check what you're owed in 60 seconds. Free, instant, no signup.
      </p>

      <div className="hook-context">
        <span className="hook-context-icon">⚖️</span>
        <p className="hook-context-text">
          <strong>Under EU law (EC 261/2004)</strong>, airlines must compensate passengers
          up to €600 for cancellations, long delays, denied boarding, and downgrades on
          qualifying flights. UK261 mirrors this law for UK flights.
        </p>
      </div>

      <button className="btn-hook" onClick={onStart}>
        Check My Flight →
      </button>

      <div className="hook-trust">
        <span className="hook-trust-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Free to check
        </span>
        <span className="hook-trust-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          No login
        </span>
        <span className="hook-trust-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          60 seconds
        </span>
      </div>
    </div>
  );
}

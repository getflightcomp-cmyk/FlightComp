export default function ProgressBar({ step, total = 6, onBack }) {
  const pct = (step / total) * 100;
  return (
    <div className="progress-wrap">
      <div className="progress-header">
        <button className="progress-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <span className="progress-step mono">{step}/{total}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

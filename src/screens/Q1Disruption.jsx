import ProgressBar from '../components/ProgressBar.jsx';

const OPTIONS = [
  { value:'cancelled',  icon:'✕',  title:'Cancelled',                sub:'Flight was cancelled entirely' },
  { value:'delayed',    icon:'⏱',  title:'Delayed 2+ hours at arrival', sub:'You arrived significantly later than scheduled' },
  { value:'denied',     icon:'🚫', title:'Denied boarding',           sub:'Bumped due to overbooking or other reason' },
  { value:'downgraded', icon:'↓',  title:'Downgraded',                sub:'Moved to a lower cabin class than booked' },
];

export default function Q1Disruption({ answers, updateAnswer, onNext, onBack }) {
  const selected = answers.disruption;

  function pick(val) {
    updateAnswer('disruption', val);
    setTimeout(onNext, 220); // brief visual feedback before advance
  }

  return (
    <div className="screen slide-up">
      <ProgressBar step={1} onBack={onBack} />
      <div className="q-content">
        <div className="q-label">Question 1 of 6</div>
        <h2 className="q-heading">What happened to your flight?</h2>

        <div className="options">
          {OPTIONS.map(o => (
            <button
              key={o.value}
              className={`option-card${selected === o.value ? ' selected' : ''}`}
              onClick={() => pick(o.value)}
            >
              <span className="option-icon">{o.icon}</span>
              <span className="option-text">
                <span className="option-title">{o.title}</span>
                <span className="option-sub">{o.sub}</span>
              </span>
              <span className="option-check">
                {selected === o.value && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="white" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

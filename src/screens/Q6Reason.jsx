import ProgressBar from '../components/ProgressBar.jsx';

const OPTIONS = [
  { value:'none',      icon:'❓', title:'No reason given',         sub:'Airline gave no explanation' },
  { value:'weather',   icon:'⛈️', title:'Weather',                 sub:'Storm, snow, fog, or other weather event' },
  { value:'technical', icon:'🔧', title:'Technical or mechanical', sub:'Aircraft fault, maintenance issue' },
  { value:'crew',      icon:'👤', title:'Staff shortage or strike', sub:'Crew unavailability, airline staff action' },
  { value:'other',     icon:'•',  title:'Other',                   sub:'Security, ATC restrictions, bird strike, etc.' },
];

export default function Q6Reason({ answers, updateAnswer, onBack, onSubmit }) {
  const selected = answers.reason;

  function pick(val) {
    updateAnswer('reason', val);
    setTimeout(onSubmit, 220);
  }

  return (
    <div className="screen slide-up">
      <ProgressBar step={6} onBack={onBack} />
      <div className="q-content">
        <div className="q-label">Question 6 of 6</div>
        <h2 className="q-heading">What reason did the airline give?</h2>

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

        <p className="q-helper">
          If unsure, select "No reason given." The <strong style={{color:'var(--text)'}}>burden of proof is on the airline</strong> — they must demonstrate extraordinary circumstances to avoid paying.
        </p>
      </div>
    </div>
  );
}

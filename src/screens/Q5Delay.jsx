import ProgressBar from '../components/ProgressBar.jsx';

const OPTIONS = [
  { value:'under2', icon:'🕐', title:'Under 2 hours',         sub:'Arrived less than 2 hours late' },
  { value:'2to3',   icon:'🕑', title:'2–3 hours',             sub:'Arrived 2 to 3 hours late' },
  { value:'3to4',   icon:'🕒', title:'3–4 hours',             sub:'Arrived 3 to 4 hours late' },
  { value:'4plus',  icon:'🕓', title:'4+ hours or never arrived', sub:'Major delay or flight never operated' },
];

export default function Q5Delay({ answers, updateAnswer, onNext, onBack }) {
  const selected = answers.delayLength;

  function pick(val) {
    updateAnswer('delayLength', val);
    setTimeout(onNext, 220);
  }

  // Label changes based on disruption type
  const isCancelOrDenied = ['cancelled','denied','downgraded'].includes(answers.disruption);

  return (
    <div className="screen slide-up">
      <ProgressBar step={5} onBack={onBack} />
      <div className="q-content">
        <div className="q-label">Question 5 of 6</div>
        <h2 className="q-heading">How long was the delay at arrival?</h2>

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

        {isCancelOrDenied && (
          <p className="q-helper">
            For cancellations, this means the delay compared to your <strong style={{color:'var(--text)'}}>original scheduled arrival time</strong>.
          </p>
        )}
      </div>
    </div>
  );
}

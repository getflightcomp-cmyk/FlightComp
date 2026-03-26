import ProgressBar from '../components/ProgressBar.jsx';

export default function Q4Route({ answers, updateAnswer, onNext, onBack }) {
  const from = answers.from;
  const to   = answers.to;

  return (
    <div className="screen slide-up">
      <ProgressBar step={4} onBack={onBack} />
      <div className="q-content">
        <div className="q-label">Question 4 of 6</div>
        <h2 className="q-heading">Where were you flying?</h2>

        <div className="route-row">
          <div className="route-input-wrap">
            <span className="route-label">FROM</span>
            <input
              className="route-input"
              type="text"
              placeholder="London, LHR, Paris…"
              value={from}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              onChange={e => updateAnswer('from', e.target.value)}
            />
          </div>

          <div className="route-arrow" aria-hidden="true">↓</div>

          <div className="route-input-wrap">
            <span className="route-label">TO</span>
            <input
              className="route-input"
              type="text"
              placeholder="New York, JFK, Tokyo…"
              value={to}
              autoComplete="off"
              spellCheck={false}
              onChange={e => updateAnswer('to', e.target.value)}
            />
          </div>
        </div>

        <p className="q-helper">
          Enter airport code (LHR) or city name. EU261 applies to flights <strong style={{color:'var(--text)'}}>departing from the EU/EEA/UK</strong>, or arriving in the EU on an EU-registered airline.
        </p>

        <button
          className="btn-continue"
          style={{ marginTop: 'auto' }}
          disabled={!from.trim() || !to.trim()}
          onClick={onNext}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

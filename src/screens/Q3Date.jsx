import ProgressBar from '../components/ProgressBar.jsx';

export default function Q3Date({ answers, updateAnswer, onNext, onBack }) {
  const val = answers.flightDate;

  // Max = today; far past warning handled in assessClaim
  const today = new Date().toISOString().split('T')[0];
  const minDate = '2015-01-01';

  return (
    <div className="screen slide-up">
      <ProgressBar step={3} onBack={onBack} />
      <div className="q-content">
        <div className="q-label">Question 3 of 6</div>
        <h2 className="q-heading">When was the flight?</h2>

        <div className="input-wrap">
          <input
            className="input-field date-input"
            type="date"
            value={val}
            max={today}
            min={minDate}
            onChange={e => updateAnswer('flightDate', e.target.value)}
          />
        </div>

        <p className="q-helper">
          Claims are valid for up to <strong style={{color:'var(--text)'}}>6 years</strong> after the flight in the UK, or <strong style={{color:'var(--text)'}}>3 years</strong> in most EU countries.
        </p>

        <button
          className="btn-continue"
          style={{ marginTop: 'auto' }}
          disabled={!val}
          onClick={onNext}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

import { useRef } from 'react';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Q2FlightNumber({ answers, updateAnswer, onNext, onBack }) {
  const val = answers.flightNumber;
  const inputRef = useRef(null);

  function handleKey(e) {
    if (e.key === 'Enter' && val.trim()) onNext();
  }

  return (
    <div className="screen slide-up">
      <ProgressBar step={2} onBack={onBack} />
      <div className="q-content">
        <div className="q-label">Question 2 of 6</div>
        <h2 className="q-heading">What's your flight number?</h2>

        <div className="input-wrap" style={{ marginBottom: 8 }}>
          <input
            ref={inputRef}
            className="input-field mono-input"
            type="text"
            placeholder="BA283"
            value={val}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            onChange={e => updateAnswer('flightNumber', e.target.value.toUpperCase().replace(/\s/g,''))}
            onKeyDown={handleKey}
          />
        </div>

        <p className="q-helper">
          Found on your booking confirmation or boarding pass — usually 2 letters followed by numbers (e.g. BA283, FR1234).
        </p>

        <button
          className="btn-continue"
          style={{ marginTop: 'auto', paddingTop: 0 }}
          disabled={!val.trim()}
          onClick={onNext}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

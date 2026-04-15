import { useState, useCallback } from 'react';
import Head from 'next/head';
import { assessClaim, assessClaimAPPR, assessClaimSHY, detectRegulation, tryResolveAirport } from '../lib/eu261';
import { resolveAirline, getCarrierRegion, isLargeCanadianCarrier } from '../lib/carriers';

/* ══════════════════════════════════════════════════════
   Screen components — inline for zero-import overhead
══════════════════════════════════════════════════════ */

function ProgressBar({ step, total, onBack }) {
  return (
    <div className="prog-wrap">
      <div className="prog-head">
        <button className="prog-back" onClick={onBack}>
          ← Back
        </button>
        <span className="prog-step">{step}/{total}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ── Q1: Disruption type ───────────────────────────────
function Q1Disruption({ value, onChange }) {
  const opts = [
    { value: 'delayed',    icon: '⏱️', title: 'Delayed',         sub: 'Flight took off or landed late' },
    { value: 'cancelled',  icon: '✕',  title: 'Cancelled',        sub: 'Flight did not operate' },
    { value: 'denied',     icon: '🚫', title: 'Denied boarding',  sub: 'You were not allowed to board' },
    { value: 'downgraded', icon: '⬇️', title: 'Downgraded',       sub: 'Seated in a lower class than booked' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={1} total={6} onBack={() => history.back()} />
      <div className="q-body">
        <div className="q-label">Question 1 of 6</div>
        <h2 className="q-head">What happened to your flight?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-icon">{o.icon}</span>
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
                <span className="opt-sub">{o.sub}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Q2: Flight number ─────────────────────────────────
function Q2FlightNumber({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={2} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 2 of 6</div>
        <h2 className="q-head">What was your flight number?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="e.g. BA 123"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <p className="q-helper">
          Find this on your boarding pass or booking confirmation.{' '}
          <strong>Leave blank if unknown.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
}

// ── Q3: Flight date ───────────────────────────────────
function Q3Date({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={3} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 3 of 6</div>
        <h2 className="q-head">When was the flight?</h2>
        <input
          className="inp inp-date"
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          autoFocus
        />
        <p className="q-helper">
          EU261 claims: <strong>3-year limit</strong> (6 years UK261, 1 year APPR).
          Older flights may still be worth checking.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!value}>Continue →</button>
      </div>
    </div>
  );
}

// ── Q4: Route ─────────────────────────────────────────
function Q4Route({ from, to, onFromChange, onToChange, onNext, onBack }) {
  const fromResolved = from.trim().length > 2 ? tryResolveAirport(from) : true;
  const toResolved   = to.trim().length > 2   ? tryResolveAirport(to)   : true;
  const fromWarn = from.trim().length > 2 && !fromResolved;
  const toWarn   = to.trim().length > 2   && !toResolved;
  return (
    <div className="screen">
      <ProgressBar step={4} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 4 of 6</div>
        <h2 className="q-head">What was your route?</h2>
        <div className="route-row">
          <div className="route-wrap">
            <span className="route-lbl">From</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Airport code or city (e.g. LHR, London)"
              value={from}
              onChange={e => onFromChange(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {fromWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                We didn&apos;t recognize that airport. Try the 3-letter code (e.g. IST, LHR, CDG).
              </span>
            )}
          </div>
          <div className="route-arrow">↓</div>
          <div className="route-wrap">
            <span className="route-lbl">To</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Airport code or city (e.g. JFK, New York)"
              value={to}
              onChange={e => onToChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {toWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                We didn&apos;t recognize that airport. Try the 3-letter code (e.g. IST, LHR, CDG).
              </span>
            )}
          </div>
        </div>
        <p className="q-helper">
          Covers flights from <strong>EU/EEA/UK airports</strong> (EU261/UK261) and
          flights <strong>to or from Canadian airports</strong> (APPR).
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!from.trim() || !to.trim()}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── QAirline: Airline name ────────────────────────────
function QAirline({ value, onChange, onNext, onBack }) {
  const resolved = value.trim().length > 1 ? resolveAirline(value) : true;
  const showWarn = value.trim().length > 2 && !resolved;
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 of 7</div>
        <h2 className="q-head">What airline operated your flight?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="e.g. Lufthansa or LH"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {showWarn && (
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            We didn&apos;t recognize that airline. Try the 2-letter IATA code (e.g. LH, BA, TK) or leave blank.
          </span>
        )}
        <p className="q-helper">
          Enter the airline name or IATA code (e.g. BA, LH, AF).{' '}
          <strong>Leave blank if unknown.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
}

// ── Q5: Delay length ──────────────────────────────────
function Q5Delay({ value, onChange, disruption, onBack }) {
  const opts = [
    { value: 'under2', title: 'Under 2 hours' },
    { value: '2to3',   title: '2 – 3 hours' },
    { value: '3to4',   title: '3 – 4 hours' },
    { value: '4plus',  title: '4+ hours' },
  ];
  if (disruption !== 'delayed') return null;
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 of 6</div>
        <h2 className="q-head">How long was the delay at arrival?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <p className="q-helper">
          EU261 compensation requires a <strong>3+ hour delay at your final destination</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Q6: Reason ────────────────────────────────────────
function Q6Reason({ value, onChange, onBack }) {
  const opts = [
    { value: 'technical', icon: '🔧', title: 'Technical / mechanical', sub: 'Aircraft fault, maintenance issue' },
    { value: 'crew',      icon: '👥', title: 'Crew / staffing',        sub: 'Missing crew, crew timing issues' },
    { value: 'weather',   icon: '🌩️', title: 'Severe weather',         sub: 'Storm, fog, ice, or ATC restrictions' },
    { value: 'none',      icon: '❓', title: 'No reason given',         sub: 'Airline didn\'t explain' },
    { value: 'other',     icon: '📋', title: 'Other',                   sub: 'Strikes, airport congestion, etc.' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={6} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 6 of 6</div>
        <h2 className="q-head">What reason did the airline give?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-icon">{o.icon}</span>
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
                <span className="opt-sub">{o.sub}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Q5 SHY: Delay length ─────────────────────────────
function Q5SHYDelay({ value, onChange, onBack }) {
  const opts = [
    { value: 'under2', title: 'Under 2 hours' },
    { value: '2to3',   title: '2 – 3 hours' },
    { value: '3to4',   title: '3 – 4 hours' },
    { value: '4plus',  title: '5+ hours' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 of 6</div>
        <h2 className="q-head">How long was the delay at arrival?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <p className="q-helper">
          Note: under Turkey SHY, <strong>delays do not qualify for financial compensation</strong> — only care rights (meals, accommodation).
        </p>
      </div>
    </div>
  );
}

// ── Q SHY Reason ──────────────────────────────────────
function QSHYReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'airline',      icon: '🔧', title: 'Airline\'s fault',    sub: 'Technical issue, crew shortage, overbooking, operational problem' },
    { value: 'forcemajeure', icon: '🌩️', title: 'Force majeure',       sub: 'Severe weather, political instability, natural disaster, airport strike, security risk' },
    { value: 'unknown',      icon: '❓', title: 'No reason given',      sub: 'Airline didn\'t explain' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} of {total}</div>
        <h2 className="q-head">What caused the disruption?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-icon">{o.icon}</span>
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
                <span className="opt-sub">{o.sub}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <p className="q-helper">
          Technical/mechanical faults and crew shortages are <strong>not</strong> force majeure under SHY — they are the airline&apos;s responsibility.
        </p>
      </div>
    </div>
  );
}

// ── Q SHY Notified (cancellations) ───────────────────
function QSHYNotified({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'yes', icon: '✓', title: 'Yes, 14+ days in advance', sub: 'I received notice at least 14 days before departure' },
    { value: 'no',  icon: '✕', title: 'No — less than 14 days',   sub: 'I was notified fewer than 14 days before, or at the airport' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} of {total}</div>
        <h2 className="q-head">Were you notified of the cancellation in advance?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-icon">{o.icon}</span>
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
                <span className="opt-sub">{o.sub}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <p className="q-helper">
          SHY requires airlines to compensate for cancellations only when notice is given <strong>less than 14 days</strong> before departure.
        </p>
      </div>
    </div>
  );
}

// ── Q5 APPR: Delay tier ───────────────────────────────
function Q5APPR({ value, onChange, onBack }) {
  const opts = [
    { value: 'under3', title: 'Under 3 hours' },
    { value: '3to6',   title: '3 – 6 hours' },
    { value: '6to9',   title: '6 – 9 hours' },
    { value: '9plus',  title: '9+ hours' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 of 7</div>
        <h2 className="q-head">How long was the delay at arrival?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <p className="q-helper">
          APPR compensation starts at <strong>3+ hours at your final destination</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Q Airline Size (APPR) ─────────────────────────────
function QAirlineSize({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'large',   icon: '✈️', title: 'Large airline', sub: 'Air Canada, WestJet, Porter, Sunwing, Swoop, Flair, Air Transat' },
    { value: 'small',   icon: '🛩️', title: 'Small airline', sub: 'Regional or charter carrier not listed above' },
    { value: 'unknown', icon: '❓', title: 'Not sure',       sub: 'We\'ll use the large airline rates' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} of {total}</div>
        <h2 className="q-head">How large is the airline?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-icon">{o.icon}</span>
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
                <span className="opt-sub">{o.sub}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <p className="q-helper">
          APPR compensation amounts differ for large vs small airlines.
        </p>
      </div>
    </div>
  );
}

// ── Q APPR Reason ─────────────────────────────────────
function QAPPRReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'controlled',   icon: '🔧', title: 'Airline-controlled',  sub: 'Technical issue, crew shortage, scheduling, overbooking' },
    { value: 'safety',       icon: '⚠️', title: 'Safety-related',      sub: 'Aircraft safety issue requiring grounding' },
    { value: 'uncontrolled', icon: '🌩️', title: 'Outside airline control', sub: 'Severe weather, ATC, airport security, bird strike' },
    { value: 'unknown',      icon: '❓', title: 'No reason given',       sub: 'Airline didn\'t explain' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} of {total}</div>
        <h2 className="q-head">What caused the disruption?</h2>
        <div className="opts">
          {opts.map(o => (
            <button
              key={o.value}
              className={`opt${value === o.value ? ' sel' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="opt-icon">{o.icon}</span>
              <span className="opt-txt">
                <span className="opt-title">{o.title}</span>
                <span className="opt-sub">{o.sub}</span>
              </span>
              <span className="opt-check">{value === o.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Results screen ────────────────────────────────────
function Expander({ icon, label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="expander">
      <button className="exp-trigger" onClick={() => setOpen(o => !o)}>
        <span className="exp-left">
          <span className="exp-ico">{icon}</span>
          <span className="exp-lbl">{label}</span>
        </span>
        <span className={`exp-chev${open ? ' open' : ''}`}>▼</span>
      </button>
      <div className={`exp-body${open ? ' open' : ''}`}>{children}</div>
    </div>
  );
}

const VERDICT_META = {
  likely:   { badge: 'LIKELY ELIGIBLE',   dot: '🟢' },
  possibly: { badge: 'POSSIBLY ELIGIBLE', dot: '🟡' },
  unlikely: { badge: 'UNLIKELY ELIGIBLE', dot: '🔴' },
};
const DISRUPTION_LABELS = {
  cancelled: 'Cancellation', delayed: 'Delay',
  denied: 'Denied boarding', downgraded: 'Downgrade',
};

function ResultsScreen({ result, answers, onGetLetter, onReset }) {
  const [copied, setCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const [captureEmail, setCaptureEmail] = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle'); // idle | submitting | done | error
  const { verdict, regulation, compensation, verdictNote, careRights, deskScript, distanceKm, shyMeta, alsoCoveredByEU261 } = result;
  const meta = VERDICT_META[verdict];
  const amountDisplay = compensation?.amount || (verdict !== 'unlikely' ? '€250–€600' : null);
  const isSHYDelay = regulation === 'SHY' && answers.disruption === 'delayed';
  const showPrimaryCTA = verdict === 'likely' || verdict === 'possibly' || isSHYDelay;
  const showSecondaryCTA = (verdict === 'likely' || verdict === 'possibly') && !isSHYDelay;

  function copyScript() {
    navigator.clipboard.writeText(deskScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleNotify(e) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    // Store for now — Sprint 3 will wire to a real list
    console.info('[FlightClaim] Notify-me signup:', notifyEmail, { verdict, regulation, compensation: compensation?.amount });
    setNotified(true);
  }

  async function handleCapture(e) {
    e.preventDefault();
    const email = captureEmail.trim();
    if (!email.includes('@') || !email.includes('.')) return;
    setCaptureStatus('submitting');
    try {
      const res = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          airline:            answers.flightNumber || '',
          route:              `${answers.from} → ${answers.to}`,
          compensationAmount: compensation?.amount || '',
          verdict,
          timestamp:          new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('server error');
      setCaptureStatus('done');
    } catch {
      setCaptureStatus('error');
    }
  }

  return (
    <div className="res">
      <div className={`vbanner ${verdict}`}>
        <div className="veyebrow">{meta.dot} Your Result</div>
        <div className="vbadge">{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="vamount">{amountDisplay}</div>
            <div className="vreg">under {regulation === 'UK261' ? 'UK261/2004' : regulation === 'APPR' ? 'Canada APPR (SOR/2019-150)' : regulation === 'SHY' ? 'Turkey SHY (Sivil Havacılık Yönetmeliği)' : 'EU Regulation 261/2004'}</div>
          </>
        ) : (
          <div className="vreg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            No cash compensation — care rights may still apply
          </div>
        )}
        {verdictNote && <p className="vnote">{verdictNote}</p>}
        {shyMeta && (
          <div className="vnote" style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            <strong>Deadline:</strong> {shyMeta.deadline}<br />
            <strong>Escalation:</strong> {shyMeta.escalation}
          </div>
        )}
      </div>

      <div className="res-body">

        {/* ── Regulation citation ── */}
        {verdict !== 'unlikely' && regulation && (
          <div className="reg-citation">
            {regulation === 'EU261' && (
              <>Under <strong>EU Regulation 261/2004, Article 7(1)</strong>, you may be entitled to compensation of <strong>{amountDisplay}</strong>. Article 5(1)(c) requires airlines to pay compensation for cancellations unless passengers were informed at least 14 days in advance.</>
            )}
            {regulation === 'UK261' && (
              <>Under <strong>UK Regulation 261 (retained EU law), Article 7(1)</strong>, you may be entitled to compensation of <strong>{amountDisplay}</strong>. The UK Civil Aviation Authority enforces these rights for flights departing from UK airports.</>
            )}
            {regulation === 'APPR' && (
              <>Under the <strong>Canadian Air Passenger Protection Regulations (SOR/2019-150), Section 19(1)</strong>, you may be entitled to <strong>{amountDisplay}</strong>. The Canadian Transportation Agency oversees compliance and can receive complaints if the airline refuses to pay.</>
            )}
            {regulation === 'SHY' && (
              <>Under <strong>Turkey&apos;s SHY Regulation on Passenger Rights</strong>, you may be entitled to <strong>{amountDisplay}</strong> for international flights. The Turkish Directorate General of Civil Aviation (DGCA) enforces these rights.</>
            )}
          </div>
        )}

        {/* ── PRIMARY CTA: managed claim ── */}
        {showPrimaryCTA && (() => {
          // Build /authorize URL with pre-filled params from the eligibility check
          const disruptionMap = { cancelled: 'Cancellation', delayed: 'Delay over 3 hours', denied: 'Denied boarding', downgraded: 'Downgrade' };
          const params = new URLSearchParams();
          if (answers.flightNumber) params.set('flight', answers.flightNumber);
          if (answers.flightDate)   params.set('date',   answers.flightDate);
          if (answers.from)         params.set('from',   answers.from);
          if (answers.to)           params.set('to',     answers.to);
          if (answers.disruption)   params.set('disruption', disruptionMap[answers.disruption] || answers.disruption);
          if (regulation)           params.set('regulation', regulation);
          if (compensation?.amount) params.set('compensation', compensation.amount);
          const authorizeUrl = `/authorize?${params.toString()}`;

          // Try to get airline name from carrier registry
          let airlineName = 'the airline';
          try {
            const carrier = resolveAirline(answers.flightNumber);
            if (carrier?.name) airlineName = carrier.name;
          } catch { /* keep default */ }

          return (
            <div className="cta-handle">
              <div className="cta-handle-top">
                <span className="cta-handle-title">Let us handle your claim</span>
              </div>
              <div className="cta-howit">
                <div className="cta-step"><span className="cta-step-n">1</span><span>You authorize us to act on your behalf.</span></div>
                <div className="cta-step"><span className="cta-step-n">2</span><span>We submit your claim directly to {airlineName}.</span></div>
                <div className="cta-step"><span className="cta-step-n">3</span><span>We handle all follow-ups and escalations.</span></div>
                <div className="cta-step"><span className="cta-step-n">4</span><span>You only pay a small fee if we succeed. No win, no fee.</span></div>
              </div>
              <a className="btn-authorize" href={authorizeUrl}>
                Start Authorization →
              </a>
              <div className="notify-fallback">
                <p className="notify-fallback-label">Not ready yet? Leave your email and we'll follow up.</p>
                {notified ? (
                  <div className="notify-success">✓ Got it — we'll be in touch.</div>
                ) : (
                  <form className="notify-row" onSubmit={handleNotify}>
                    <input
                      className="notify-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Your email address"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      required
                    />
                    <button className="btn-notify" type="submit" disabled={!notifyEmail.trim()}>
                      Notify Me
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── SECONDARY CTA: Flight Compensation Kit ($19) ── */}
        {showSecondaryCTA && (
          <div className="cta-diy">
            <div className="cta-diy-head">
              <span className="cta-diy-title">Get Your Flight Compensation Kit</span>
              <span className="cta-diy-price">$19</span>
            </div>
            <p className="cta-diy-desc">
              A complete {regulation} Flight Compensation Kit: personalised claim letter, airline submission guide,
              follow-up and escalation templates. Download as PDF and send it yourself.
            </p>
            <button className="btn-diy" onClick={onGetLetter}>
              Get Your Flight Compensation Kit — $19
            </button>
          </div>
        )}

        <Expander icon="🛡️" label="What the airline must provide now">
          {careRights.length > 0 ? (
            <div className="care-list">
              {careRights.map((r, i) => (
                <div key={i} className="care-item">
                  <span className="care-em">{r.emoji}</span>
                  <div className="care-txt">
                    <strong>{r.title}</strong><br />{r.detail}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, paddingTop: 14, lineHeight: 1.6 }}>
              No immediate care obligations apply for this disruption level.
            </p>
          )}
          <div className="care-clarifier">
            These immediate entitlements are separate from your statutory compensation. The airline owes you both.
          </div>
        </Expander>

        <div className="summary">
          {[
            ['Disruption', DISRUPTION_LABELS[answers.disruption] || '—'],
            ['Flight', answers.flightNumber || '—'],
            ['Route', `${answers.from} → ${answers.to}`],
            ['Distance', distanceKm ? `~${distanceKm.toLocaleString()} km` : 'Unknown'],
            ['Regulation', regulation],
            ['Date', answers.flightDate || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="sum-label">{label}</div>
              <div className="sum-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="res-disclaimer">
          Disclaimer: FlightComp is not a law firm and does not provide legal advice. We provide information about your rights under EU261/UK261/APPR and tools to help you pursue your claim. For legal advice, consult a qualified attorney.
        </div>

        <div className="reset-link">
          <button onClick={onReset}>← Check another flight</button>
        </div>
      </div>
    </div>
  );
}

// ── Personal Details screen ───────────────────────────
function PersonalDetailsScreen({ details, onChange, onSubmit, onBack, result }) {
  const [loading, setLoading] = useState(false);

  const canSubmit = details.name.trim() && details.email.trim() && details.address.trim();

  async function handleSubmit() {
    setLoading(true);
    await onSubmit();
    setLoading(false);
  }

  return (
    <div className="details-screen">
      <div style={{ paddingTop: 20 }}>
        <button className="prog-back" onClick={onBack}>← Back to results</button>
      </div>
      <div className="details-body">
        <div>
          <div className="q-label">Almost there</div>
          <h2 className="q-head" style={{ fontSize: 22 }}>Your details for the letter</h2>
        </div>

        <div className="field-group">
          <label className="field-label">Full name *</label>
          <input
            className="field-input"
            type="text"
            placeholder="e.g. Jane Smith"
            value={details.name}
            onChange={e => onChange({ name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label className="field-label">Email address *</label>
          <input
            className="field-input"
            type="email"
            placeholder="jane@example.com"
            value={details.email}
            onChange={e => onChange({ email: e.target.value })}
          />
          <span className="field-hint">Your receipt and any follow-up will be sent here.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Home address *</label>
          <textarea
            className="field-textarea"
            placeholder={"123 Main Street\nLondon\nEC1A 1BB"}
            value={details.address}
            onChange={e => onChange({ address: e.target.value })}
            rows={3}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Booking reference</label>
          <input
            className="field-input inp-mono"
            type="text"
            placeholder="e.g. ABC123"
            value={details.bookingRef}
            onChange={e => onChange({ bookingRef: e.target.value.toUpperCase() })}
            style={{ fontSize: 16 }}
          />
          <span className="field-hint">Optional but strengthens your claim.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Bank / payment details</label>
          <textarea
            className="field-textarea"
            placeholder={"IBAN: GB00 BANK 0000 0000 0000 00\nor PayPal: jane@example.com\n(Optional — for the airline to issue refunds)"}
            value={details.bankDetails}
            onChange={e => onChange({ bankDetails: e.target.value })}
            rows={3}
          />
          <span className="field-hint">Optional. Used only inside your letter.</span>
        </div>

        <div className="payment-card">
          <span className="payment-card-ico">🔒</span>
          <div className="payment-card-txt">
            <div className="payment-card-title">Secure checkout via Stripe</div>
            <div className="payment-card-sub">
              Your letter is generated immediately after payment.
              Card details are handled by Stripe — we never see them.
            </div>
          </div>
          <span className="payment-price">$19</span>
        </div>

        <button className="btn-pay" onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Redirecting…' : 'Pay $19 & Get My Letter →'}
        </button>
        <div className="secure-note">🔒 Secured by Stripe · SSL encrypted</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main page — state machine
══════════════════════════════════════════════════════ */

const INITIAL_ANSWERS = {
  disruption: '',
  flightNumber: '',
  flightDate: '',
  from: '',
  to: '',
  airlineName: '',
  airlineCode: '',
  carrierRegion: '',
  airlineSizeAutoDetected: false,
  delayLength: '',
  reason: '',
  // APPR-specific
  apprDelayTier: '',
  airlineSize: '',
  apprReason: '',
  // SHY-specific
  shyReason: '',
  shyNotified14: '',
  detectedRegulation: '',
};

const INITIAL_DETAILS = {
  name: '',
  email: '',
  address: '',
  bookingRef: '',
  bankDetails: '',
};

export default function Home() {
  // Restore state if returning from a cancelled Stripe checkout
  const restored = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('fc_claim');
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p.answers && p.result ? p : null;
    } catch { return null; }
  })();

  const [screen, setScreen] = useState(restored ? 'results' : 'hook');
  const [answers, setAnswers] = useState(restored?.answers || INITIAL_ANSWERS);
  const [result, setResult] = useState(restored?.result || null);
  const [details, setDetails] = useState(restored?.details || INITIAL_DETAILS);

  function update(key, val) {
    setAnswers(a => ({ ...a, [key]: val }));
  }

  function updateDetails(patch) {
    setDetails(d => ({ ...d, ...patch }));
  }

  // Auto-advance for single-select screens
  function handleQ1(val) {
    update('disruption', val);
    setScreen('q2');
  }

  function handleQ5(val) {
    update('delayLength', val);
    setScreen('q6');
  }

  function handleQ6(val) {
    update('reason', val);
    const r = assessClaim({ ...answers, reason: val });
    setResult(r);
    setScreen('results');
  }

  // After QAirline: resolve carrier, detect regulation, and branch
  function goFromAirline() {
    setAnswers(prev => {
      const code = resolveAirline(prev.airlineName) || '';
      const carrierReg = code ? (getCarrierRegion(code) || '') : '';
      const reg = detectRegulation(prev.from, prev.to, carrierReg || null);

      const isCACarrier = carrierReg === 'CA';
      let autoSize = '';
      let autoDetected = false;
      if (reg === 'APPR' && code && isCACarrier) {
        autoSize = isLargeCanadianCarrier(code) ? 'large' : 'small';
        autoDetected = true;
      }

      const updated = {
        ...prev,
        airlineCode: code,
        carrierRegion: carrierReg,
        detectedRegulation: reg || '',
        ...(autoSize ? { airlineSize: autoSize, airlineSizeAutoDetected: autoDetected } : {}),
      };

      let nextScreen;
      if (!reg) {
        nextScreen = 'not_covered';
      } else if (reg === 'APPR') {
        if (prev.disruption === 'delayed') {
          nextScreen = 'q5_appr';
        } else {
          // Skip airline size question if auto-detected
          nextScreen = autoSize ? 'q_appr_reason' : 'q_airline_size';
        }
      } else if (reg === 'SHY') {
        nextScreen = prev.disruption === 'delayed' ? 'q5_shy' : 'q_shy_reason';
      } else {
        nextScreen = prev.disruption === 'delayed' ? 'q5' : 'q6';
      }
      setTimeout(() => setScreen(nextScreen), 0);
      return updated;
    });
  }

  function handleQ5APPR(val) {
    update('apprDelayTier', val);
    setScreen('q_airline_size');
  }

  function handleQAirlineSize(val) {
    update('airlineSize', val);
    setScreen('q_appr_reason');
  }

  function handleQAPPRReason(val) {
    const r = assessClaimAPPR({ ...answers, apprReason: val });
    update('apprReason', val);
    setResult(r);
    setScreen('results');
  }

  // ── SHY handlers ───────────────────────────────────
  function handleQ5SHY(val) {
    update('delayLength', val);
    setScreen('q_shy_reason');
  }

  function handleQSHYReason(val) {
    const updated = { ...answers, shyReason: val };
    setAnswers(a => ({ ...a, shyReason: val }));
    if (answers.disruption === 'cancelled') {
      setScreen('q_shy_notified');
    } else {
      setResult(assessClaimSHY(updated));
      setScreen('results');
    }
  }

  function handleQSHYNotified(val) {
    const r = assessClaimSHY({ ...answers, shyNotified14: val });
    update('shyNotified14', val);
    setResult(r);
    setScreen('results');
  }

  function goToResults() {
    if (!result) {
      let r;
      if (answers.detectedRegulation === 'APPR') r = assessClaimAPPR(answers);
      else if (answers.detectedRegulation === 'SHY') r = assessClaimSHY(answers);
      else r = assessClaim(answers);
      setResult(r);
    }
    setScreen('results');
  }

  async function handlePay() {
    // Persist everything to sessionStorage so success page can read it
    const payload = { answers, result, details };
    sessionStorage.setItem('fc_claim', JSON.stringify(payload));

    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: details.email,
        successUrl: `${base}/success`,
        cancelUrl: `${base}/cancel`,
      }),
    });

    if (!res.ok) {
      alert('Payment setup failed. Please try again.');
      return;
    }

    const { url } = await res.json();
    window.location.href = url;
  }

  // ── Render ────────────────────────────────────────
  if (screen === 'hook') {
    return (
      <>
        <Head>
          <title>Flight Compensation Tool — Check if You&apos;re Owed up to €600 | EU261 &amp; UK261</title>
          <meta name="description" content="Free tool to check if your cancelled or delayed flight qualifies for EU261 or UK261 compensation. Get your eligibility verdict in 60 seconds and download a professional claim letter." />
          <meta name="keywords" content="EU261 compensation, flight cancelled compensation, flight delay rights, UK261 claim, airline compensation, flight disruption, EU regulation 261/2004, claim letter generator" />
          <meta property="og:title" content="Your flight was cancelled. Find out what you're owed." />
          <meta property="og:description" content="Free EU261/UK261 eligibility checker. Get your verdict in 60 seconds." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://getflightcomp.com" />
          <link rel="canonical" href="https://getflightcomp.com" />
        </Head>

        <div className="lp">

          {/* ── HERO ── */}
          <section className="lp-hero">
            <div className="lp-hero-inner">
              <h1 className="lp-h1">
                Your flight was cancelled.<br />
                Find out what you&apos;re owed in 60 seconds.
              </h1>
              <div className="lp-badge" style={{ marginTop: 0, marginBottom: 20 }}>✈️ EU261 / UK261 / Canada APPR / Turkey SHY</div>
              <p className="lp-sub">
                Airlines legally owe you up to €600 (EU/UK), CA$1,000 (Canada), or €600 (Turkey) — but they use friction to avoid paying. We cut through it.
              </p>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Check My Flight →
              </button>
              <div className="lp-hero-trust">
                <span>Free</span>
                <span className="lp-dot">·</span>
                <span>No signup</span>
                <span className="lp-dot">·</span>
                <span>Instant result</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                Covers flights in, to, or from the EU, UK, Canada, and Turkey.
                US domestic flights are not covered.
              </p>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="lp-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">How it works</h2>
              <div className="lp-steps">
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">1</span>
                    <span className="lp-step-ico">📋</span>
                  </div>
                  <div className="lp-step-title">Answer 6 quick questions</div>
                  <div className="lp-step-body">Flight number, route, disruption type, delay length, and the reason the airline gave.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">2</span>
                    <span className="lp-step-ico">✅</span>
                  </div>
                  <div className="lp-step-title">Get your eligibility verdict</div>
                  <div className="lp-step-body">We check air passenger rights laws (e.g., EU261, UK261, APPR, SHY) and tell you if you&apos;re eligible — and how much you&apos;re owed.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">3</span>
                    <span className="lp-step-ico">💰</span>
                  </div>
                  <div className="lp-step-title">Let us handle it</div>
                  <div className="lp-step-body">Authorize us to submit your claim and manage the process — 25% fee, no win no fee. Or get a Flight Compensation Kit ($19) with your personalized letter and instructions.</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── TRUST SIGNALS ── */}
          <section className="lp-section lp-trust-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Built on EU Regulation 261/2004</h2>
              <p className="lp-body">
                EU law requires airlines to compensate passengers up to €600 for cancellations, long delays, and denied boarding on qualifying flights. You don&apos;t need a lawyer — you have a legal right.
              </p>
              <div className="lp-comp-grid">
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€250</span>
                  <span className="lp-comp-lbl">Flights under 1,500 km</span>
                </div>
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€400</span>
                  <span className="lp-comp-lbl">Flights 1,500–3,500 km</span>
                </div>
                <div className="lp-comp-card lp-comp-card-hi">
                  <span className="lp-comp-amt">€600</span>
                  <span className="lp-comp-lbl">Flights over 3,500 km</span>
                </div>
              </div>
              <div className="lp-uk-note">Also covers UK flights (UK261 — £220/£350/£520), Canadian flights (APPR — CA$400/CA$700/CA$1,000), and Turkish flights (SHY — €100 domestic / €250–€600 international for cancellations &amp; denied boarding; delays receive care only).</div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="lp-final-cta">
            <div className="lp-section-inner lp-final-inner">
              <h2 className="lp-final-h">Check if your flight qualifies</h2>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Check My Flight →
              </button>
              <div className="lp-final-sub">Free · Takes 60 seconds · Covers EU, UK, Canadian &amp; Turkish flights</div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="lp-footer">
            <div className="lp-footer-inner">
              <div className="lp-footer-brand">FlightComp — EU261/UK261 Flight Compensation Tool</div>
              <div className="lp-footer-links">
                <a href="/about">About</a>
                <a href="/how-it-works">How It Works</a>
                <a href="/blog">Blog</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="mailto:support@getflightcomp.com">Contact</a>
              </div>
              <div className="lp-footer-copy">© 2026 Noontide Ventures LLC · FlightComp</div>
            </div>
          </footer>

        </div>
      </>
    );
  }

  if (screen === 'q1') {
    return <Q1Disruption value={answers.disruption} onChange={handleQ1} />;
  }

  if (screen === 'q2') {
    return (
      <Q2FlightNumber
        value={answers.flightNumber}
        onChange={v => update('flightNumber', v)}
        onNext={() => setScreen('q3')}
        onBack={() => setScreen('q1')}
      />
    );
  }

  if (screen === 'q3') {
    return (
      <Q3Date
        value={answers.flightDate}
        onChange={v => update('flightDate', v)}
        onNext={() => setScreen('q4')}
        onBack={() => setScreen('q2')}
      />
    );
  }

  if (screen === 'q4') {
    return (
      <Q4Route
        from={answers.from}
        to={answers.to}
        onFromChange={v => update('from', v)}
        onToChange={v => update('to', v)}
        onNext={() => setScreen('q_airline')}
        onBack={() => setScreen('q3')}
      />
    );
  }

  if (screen === 'q_airline') {
    return (
      <QAirline
        value={answers.airlineName}
        onChange={v => update('airlineName', v)}
        onNext={goFromAirline}
        onBack={() => setScreen('q4')}
      />
    );
  }

  if (screen === 'not_covered') {
    return (
      <div className="screen">
        <div className="q-body" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
          <h2 className="q-head" style={{ color: 'var(--text)' }}>Not Currently Covered</h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Based on your route and airline, this flight isn&apos;t covered by EU261, UK261,
            Canada APPR, or Turkey SHY. US domestic flights and routes outside these
            regulations are not supported at this time.
          </p>
          <button className="btn-cont" onClick={() => {
            setAnswers(INITIAL_ANSWERS);
            setDetails(INITIAL_DETAILS);
            setResult(null);
            setScreen('hook');
          }}>
            Check Another Flight
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'q5') {
    return (
      <Q5Delay
        value={answers.delayLength}
        disruption={answers.disruption}
        onChange={handleQ5}
        onBack={() => setScreen('q_airline')}
      />
    );
  }

  if (screen === 'q6') {
    return (
      <Q6Reason
        value={answers.reason}
        onChange={handleQ6}
        onBack={() => setScreen(answers.disruption === 'delayed' ? 'q5' : 'q_airline')}
      />
    );
  }

  // ── APPR screens ──────────────────────────────────
  if (screen === 'q5_appr') {
    return (
      <Q5APPR
        value={answers.apprDelayTier}
        onChange={handleQ5APPR}
        onBack={() => setScreen('q_airline')}
      />
    );
  }

  if (screen === 'q_airline_size') {
    const isDelayedAPPR = answers.disruption === 'delayed';
    const step = isDelayedAPPR ? 6 : 5;
    const total = isDelayedAPPR ? 7 : 6;
    return (
      <QAirlineSize
        value={answers.airlineSize}
        onChange={handleQAirlineSize}
        onBack={() => setScreen(isDelayedAPPR ? 'q5_appr' : 'q_airline')}
        step={step}
        total={total}
      />
    );
  }

  if (screen === 'q_appr_reason') {
    const isDelayedAPPR = answers.disruption === 'delayed';
    const step = isDelayedAPPR ? 7 : 6;
    const total = isDelayedAPPR ? 7 : 6;
    return (
      <QAPPRReason
        value={answers.apprReason}
        onChange={handleQAPPRReason}
        onBack={() => setScreen('q_airline_size')}
        step={step}
        total={total}
      />
    );
  }

  // ── SHY screens ──────────────────────────────────
  if (screen === 'q5_shy') {
    return (
      <Q5SHYDelay
        value={answers.delayLength}
        onChange={handleQ5SHY}
        onBack={() => setScreen('q_airline')}
      />
    );
  }

  if (screen === 'q_shy_reason') {
    const isDelayed = answers.disruption === 'delayed';
    const step = isDelayed ? 6 : 5;
    const total = answers.disruption === 'cancelled' ? (isDelayed ? 7 : 6) : (isDelayed ? 6 : 5);
    return (
      <QSHYReason
        value={answers.shyReason}
        onChange={handleQSHYReason}
        onBack={() => setScreen(isDelayed ? 'q5_shy' : 'q_airline')}
        step={step}
        total={total}
      />
    );
  }

  if (screen === 'q_shy_notified') {
    return (
      <QSHYNotified
        value={answers.shyNotified14}
        onChange={handleQSHYNotified}
        onBack={() => setScreen('q_shy_reason')}
        step={6}
        total={6}
      />
    );
  }

  if (screen === 'results' && result) {
    return (
      <ResultsScreen
        result={result}
        answers={answers}
        onGetLetter={() => setScreen('details')}
        onReset={() => {
          setAnswers(INITIAL_ANSWERS);
          setDetails(INITIAL_DETAILS);
          setResult(null);
          setScreen('hook');
        }}
      />
    );
  }

  if (screen === 'details') {
    return (
      <PersonalDetailsScreen
        details={details}
        onChange={updateDetails}
        onSubmit={handlePay}
        onBack={() => setScreen('results')}
        result={result}
      />
    );
  }

  return null;
}

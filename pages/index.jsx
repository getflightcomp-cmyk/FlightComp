import { useState, useCallback } from 'react';
import { assessClaim } from '../lib/eu261';

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
          EU261 claims have a <strong>3-year limit</strong> (6 years under UK261).
          Older flights may still be worth checking.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!value}>Continue →</button>
      </div>
    </div>
  );
}

// ── Q4: Route ─────────────────────────────────────────
function Q4Route({ from, to, onFromChange, onToChange, onNext, onBack }) {
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
          </div>
        </div>
        <p className="q-helper">
          Coverage applies to flights <strong>departing from EU/EEA/UK airports</strong>,
          or operated by EU/UK airlines from any airport.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!from.trim() || !to.trim()}>
          Continue →
        </button>
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
  const { verdict, regulation, compensation, verdictNote, careRights, deskScript, distanceKm } = result;
  const meta = VERDICT_META[verdict];
  const amountDisplay = compensation?.amount || (verdict !== 'unlikely' ? '€250–€600' : null);

  function copyScript() {
    navigator.clipboard.writeText(deskScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="res">
      <div className={`vbanner ${verdict}`}>
        <div className="veyebrow">{meta.dot} Your Result</div>
        <div className="vbadge">{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="vamount">{amountDisplay}</div>
            <div className="vreg">under {regulation === 'UK261' ? 'UK261/2004' : 'EU Regulation 261/2004'}</div>
          </>
        ) : (
          <div className="vreg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            No cash compensation — care rights may still apply
          </div>
        )}
        {verdictNote && <p className="vnote">{verdictNote}</p>}
      </div>

      <div className="res-body">
        {(verdict === 'likely' || verdict === 'possibly') && (
          <div className="cta-pri">
            <div className="cta-pri-head">
              <span className="cta-title">Get your claim letter</span>
              <span className="cta-price">$19</span>
            </div>
            <p className="cta-desc">
              A professional {regulation} claim letter citing the exact regulation,
              compensation amount, and a 14-day legal deadline. Download as PDF or copy.
            </p>
            <button className="btn-claim" onClick={onGetLetter}>
              Get My Claim Letter →
            </button>
          </div>
        )}

        <div className="cta-sec">
          <span className="cta-sec-ico">⚖️</span>
          <div className="cta-sec-txt">
            <div className="cta-sec-title">Want us to handle everything?</div>
            <div className="cta-sec-sub">No win, no fee · 20% on success only</div>
          </div>
          <span className="cta-sec-badge">Coming soon</span>
        </div>

        <Expander icon="💬" label="What to say at the desk right now">
          <div className="desk-script">
            {deskScript}
            <button className="copy-btn" onClick={copyScript}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </Expander>

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
  delayLength: '',
  reason: '',
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
    // Assess immediately
    const r = assessClaim({ ...answers, reason: val });
    setResult(r);
    setScreen('results');
  }

  function goToResults() {
    if (!result) {
      const r = assessClaim(answers);
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
      <div className="hook">
        <div className="hook-badge">✈️ EU261 / UK261</div>
        <h1 className="hook-h1">
          Was your flight delayed?<br />
          <em className="hi">You may be owed up to €600.</em>
        </h1>
        <p className="hook-sub">
          Answer 6 questions. Get your eligibility verdict instantly.
          Then get a professional claim letter for $19.
        </p>
        <div className="hook-ctx">
          <span className="hook-ctx-ico">⚖️</span>
          <div className="hook-ctx-txt">
            <strong>EU Regulation 261/2004</strong> (and UK261) entitles passengers to up to
            €600 / £520 compensation for delays, cancellations, and denied boarding —
            if the airline is at fault.
          </div>
        </div>
        <button className="btn-hook" onClick={() => setScreen('q1')}>
          Check My Flight →
        </button>
        <div className="hook-trust">
          <span className="trust-item">🕐 60 seconds</span>
          <span className="trust-item">🔒 Private</span>
          <span className="trust-item">✈️ Free check</span>
        </div>
      </div>
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
        onNext={() => setScreen(answers.disruption === 'delayed' ? 'q5' : 'q6')}
        onBack={() => setScreen('q3')}
      />
    );
  }

  if (screen === 'q5') {
    return (
      <Q5Delay
        value={answers.delayLength}
        disruption={answers.disruption}
        onChange={handleQ5}
        onBack={() => setScreen('q4')}
      />
    );
  }

  if (screen === 'q6') {
    return (
      <Q6Reason
        value={answers.reason}
        onChange={handleQ6}
        onBack={() => setScreen(answers.disruption === 'delayed' ? 'q5' : 'q4')}
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

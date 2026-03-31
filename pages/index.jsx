import { useState, useCallback } from 'react';
import Head from 'next/head';
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
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const [captureEmail, setCaptureEmail] = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle'); // idle | submitting | done | error
  const { verdict, regulation, compensation, verdictNote, careRights, deskScript, distanceKm } = result;
  const meta = VERDICT_META[verdict];
  const amountDisplay = compensation?.amount || (verdict !== 'unlikely' ? '€250–€600' : null);
  const showCtAs = verdict === 'likely' || verdict === 'possibly';

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

        {/* ── PRIMARY CTA: managed claim (coming soon) ── */}
        {showCtAs && (
          <div className="cta-handle">
            <div className="cta-handle-top">
              <span className="cta-handle-title">Let us handle your claim</span>
              <span className="cta-handle-badge">COMING SOON</span>
            </div>
            <p className="cta-handle-desc">
              We submit the claim, track responses, and follow up until you get paid.
              No win, no fee — we only charge <strong style={{ color: 'var(--text)' }}>20% of your compensation</strong> if successful.
            </p>
            {notified ? (
              <div className="notify-success">✓ You're on the list — we'll email you when this launches.</div>
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
        )}

        {/* ── EMAIL CAPTURE ── */}
        {showCtAs && (
          <div className="email-capture">
            <div className="email-capture-head">Want us to track this claim for you?</div>
            <p className="email-capture-sub">Leave your email and we&apos;ll notify you when our managed claims service launches.</p>
            {captureStatus === 'done' ? (
              <div className="email-capture-success">✓ You&apos;re on the list. We&apos;ll be in touch.</div>
            ) : (
              <form className="email-capture-row" onSubmit={handleCapture}>
                <input
                  className="notify-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={captureEmail}
                  onChange={e => setCaptureEmail(e.target.value)}
                  required
                />
                <button
                  className="btn-notify"
                  type="submit"
                  disabled={captureStatus === 'submitting' || !captureEmail.includes('@') || !captureEmail.includes('.')}
                >
                  {captureStatus === 'submitting' ? '…' : 'Notify Me'}
                </button>
              </form>
            )}
            {captureStatus === 'error' && (
              <p className="email-capture-err">Something went wrong — please try again.</p>
            )}
          </div>
        )}

        {/* ── SECONDARY CTA: DIY letter ($19) ── */}
        {showCtAs && (
          <div className="cta-diy">
            <div className="cta-diy-head">
              <span className="cta-diy-title">Generate a claim letter yourself</span>
              <span className="cta-diy-price">$19</span>
            </div>
            <p className="cta-diy-desc">
              A professional {regulation} letter citing the exact regulation and compensation amount.
              Download as PDF and send it to the airline yourself.
            </p>
            <button className="btn-diy" onClick={onGetLetter}>
              Get My Claim Letter → $19
            </button>
          </div>
        )}

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

        <div className="res-disclaimer">
          Disclaimer: FlightComp is not a law firm and does not provide legal advice. We provide information about your rights under EU261/UK261 and tools to help you pursue your claim. For legal advice, consult a qualified attorney.
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
              <div className="lp-badge">✈️ EU261 / UK261</div>
              <h1 className="lp-h1">
                Your flight was cancelled.<br />
                Find out what you&apos;re owed in 60 seconds.
              </h1>
              <p className="lp-sub">
                Airlines legally owe you up to €600 under EU law — but they use friction to avoid paying. We cut through it.
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
                    <span className="lp-step-ico">🛡️</span>
                  </div>
                  <div className="lp-step-title">Get your eligibility verdict instantly</div>
                  <div className="lp-step-body">We run the EU261/UK261 rules and tell you if you&apos;re likely, possibly, or unlikely eligible — and how much.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">3</span>
                    <span className="lp-step-ico">📄</span>
                  </div>
                  <div className="lp-step-title">Download your claim letter or let us handle it</div>
                  <div className="lp-step-body">Get a professional PDF letter for $19, or sign up for our no-win-no-fee managed service (coming soon).</div>
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
              <div className="lp-uk-note">Also covers UK flights under UK261 — £220 / £350 / £520</div>
            </div>
          </section>

          {/* ── COMPARISON ── */}
          <section className="lp-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Why not just use AirHelp?</h2>
              <div className="lp-compare">
                <div className="lp-compare-card lp-compare-other">
                  <div className="lp-compare-name">AirHelp</div>
                  <ul className="lp-compare-list">
                    <li><span className="lp-x">✕</span>35–50% commission on your payout</li>
                    <li><span className="lp-x">✕</span>Slow process — months to resolve</li>
                    <li><span className="lp-x">✕</span>Eligibility check requires signup</li>
                  </ul>
                </div>
                <div className="lp-compare-card lp-compare-us">
                  <div className="lp-compare-name">FlightComp</div>
                  <ul className="lp-compare-list">
                    <li><span className="lp-chk">✓</span>Free eligibility check — instant</li>
                    <li><span className="lp-chk">✓</span>Flat $19 for your claim letter</li>
                    <li><span className="lp-chk">✓</span>20% no-win-no-fee <span className="lp-soon">Coming soon</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="lp-final-cta">
            <div className="lp-section-inner lp-final-inner">
              <h2 className="lp-final-h">Check if your flight qualifies</h2>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Check My Flight →
              </button>
              <div className="lp-final-sub">Free · Takes 60 seconds · Works for EU and UK flights</div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="lp-footer">
            <div className="lp-footer-inner">
              <div className="lp-footer-brand">FlightComp — EU261/UK261 Flight Compensation Tool</div>
              <div className="lp-footer-links">
                <a href="#">About</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="mailto:support@getflightcomp.com">Contact</a>
              </div>
              <div className="lp-footer-copy">© 2026 FlightComp</div>
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

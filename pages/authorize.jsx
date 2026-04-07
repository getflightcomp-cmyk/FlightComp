import Head from 'next/head';
import { useState } from 'react';

const DISRUPTION_TYPES = [
  'Cancellation',
  'Delay over 3 hours',
  'Denied boarding',
  'Downgrade',
];

const EMPTY = {
  fullName: '',
  email: '',
  address: '',
  airline: '',
  flightNumber: '',
  flightDate: '',
  depAirport: '',
  arrAirport: '',
  disruptionType: '',
  bookingRef: '',
  scheduledArrival: '',
  actualArrival: '',
  description: '',
};

export default function Authorize() {
  const [form, setForm]       = useState(EMPTY);
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit =
    agreed &&
    !loading &&
    form.fullName.trim() &&
    form.email.includes('@') &&
    form.address.trim() &&
    form.airline.trim() &&
    form.flightNumber.trim() &&
    form.flightDate &&
    form.depAirport.trim() &&
    form.arrAirport.trim() &&
    form.disruptionType;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Submission failed');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const agreementText = `I, ${form.fullName || '[Full Legal Name]'}, hereby authorize Noontide Ventures LLC, operating as FlightComp, to act on my behalf to:

1. Submit a compensation claim to ${form.airline || '[Airline Name]'} regarding flight ${form.flightNumber || '[Flight Number]'} on ${form.flightDate || '[Flight Date]'} under the applicable passenger rights regulation (EU Regulation 261/2004, UK Regulation 261, Canadian Air Passenger Protection Regulations, or Turkish SHY Regulation).
2. Communicate with the airline, relevant aviation authorities, and any other necessary parties on my behalf regarding this claim.
3. Receive correspondence related to this claim.

I confirm that:
• The information I have provided is accurate and complete to the best of my knowledge.
• I have not assigned this claim to any other party or company.
• I understand that FlightComp's managed service fee is 25% of any compensation successfully recovered, and that no fee is owed if no compensation is recovered (no win, no fee).
• I understand that this authorization does not constitute a guarantee that compensation will be recovered.
• I may revoke this authorization at any time by emailing support@getflightcomp.com.

This authorization is governed by the laws of the State of Georgia, United States.`;

  return (
    <>
      <Head>
        <title>Authorization to Act on Your Behalf | FlightComp</title>
        <meta name="description" content="Authorize FlightComp / Noontide Ventures LLC to submit and manage your flight compensation claim." />
      </Head>

      <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '40px 16px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <a href="/" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← Back to FlightComp</a>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginTop: 20, marginBottom: 8 }}>
              Authorization to Act on Your Behalf
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              This agreement authorizes Noontide Ventures LLC (operating as FlightComp) to submit and manage your flight compensation claim.
            </p>
          </div>

          {success ? (
            <div style={{
              background: 'var(--greenbg)', border: '1px solid var(--greenbd)',
              borderRadius: 12, padding: 28, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Authorization received.
              </div>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                We&apos;ve sent a confirmation to <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
                Our team will review your claim and begin the process.
                You&apos;ll hear from us within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>

              {/* Personal details */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>Your Details</legend>
                <Field label="Full legal name *" required>
                  <input style={inputStyle} type="text" value={form.fullName} onChange={set('fullName')} placeholder="As it appears on your passport" required />
                </Field>
                <Field label="Email address *" required>
                  <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
                </Field>
                <Field label="Mailing address *" required>
                  <input style={inputStyle} type="text" value={form.address} onChange={set('address')} placeholder="Street, city, country" required />
                </Field>
              </fieldset>

              {/* Flight details */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>Flight Details</legend>
                <Field label="Airline name *" required>
                  <input style={inputStyle} type="text" value={form.airline} onChange={set('airline')} placeholder="e.g. Lufthansa" required />
                </Field>
                <Field label="Flight number *" required>
                  <input style={inputStyle} type="text" value={form.flightNumber} onChange={set('flightNumber')} placeholder="e.g. LH1234" required />
                </Field>
                <Field label="Flight date *" required>
                  <input style={inputStyle} type="date" value={form.flightDate} onChange={set('flightDate')} required />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Departure airport *" required>
                    <input style={inputStyle} type="text" value={form.depAirport} onChange={set('depAirport')} placeholder="e.g. LHR" required />
                  </Field>
                  <Field label="Arrival airport *" required>
                    <input style={inputStyle} type="text" value={form.arrAirport} onChange={set('arrAirport')} placeholder="e.g. JFK" required />
                  </Field>
                </div>
                <Field label="Disruption type *" required>
                  <select style={inputStyle} value={form.disruptionType} onChange={set('disruptionType')} required>
                    <option value="">Select…</option>
                    {DISRUPTION_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Booking reference / PNR">
                  <input style={inputStyle} type="text" value={form.bookingRef} onChange={set('bookingRef')} placeholder="e.g. ABC123" />
                </Field>
              </fieldset>

              {/* Timing */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>Timing (if applicable)</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Scheduled arrival time">
                    <input style={inputStyle} type="time" value={form.scheduledArrival} onChange={set('scheduledArrival')} />
                  </Field>
                  <Field label="Actual arrival time">
                    <input style={inputStyle} type="time" value={form.actualArrival} onChange={set('actualArrival')} />
                  </Field>
                </div>
                <Field label="Brief description of what happened">
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                    value={form.description}
                    onChange={set('description')}
                    maxLength={500}
                    placeholder="2–3 sentences describing the disruption"
                    rows={3}
                  />
                  <span style={{ fontSize: 12, color: 'var(--dim)', display: 'block', marginTop: 4 }}>
                    {form.description.length}/500
                  </span>
                </Field>
              </fieldset>

              {/* Agreement text */}
              <div style={{
                background: 'var(--surf2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 20, marginBottom: 20,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Authorization Agreement
                </p>
                <pre style={{
                  fontSize: 13, color: 'var(--muted)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0,
                }}>
                  {agreementText}
                </pre>
              </div>

              {/* Checkbox */}
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 24 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: 'var(--blue)' }}
                />
                <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                  I have read and agree to the above authorization
                </span>
              </label>

              {error && (
                <div style={{
                  background: 'var(--redbg)', border: '1px solid var(--redbd)',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                  fontSize: 14, color: 'var(--red)',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: canSubmit ? 'var(--blue)' : 'var(--surf3)',
                  color: canSubmit ? '#fff' : 'var(--dim)',
                  border: 'none', borderRadius: 'var(--rbtn)',
                  fontSize: 16, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Submitting…' : 'Submit Authorization'}
              </button>

              <p style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                Operated by Noontide Ventures LLC · Georgia, USA ·{' '}
                <a href="/terms" style={{ color: 'var(--dim)' }}>Terms</a> ·{' '}
                <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a>
              </p>

            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surf2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 14,
  outline: 'none',
};

const fieldsetStyle = {
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '20px 20px 4px', marginBottom: 20,
};

const legendStyle = {
  fontSize: 12, fontWeight: 600, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  padding: '0 6px',
};

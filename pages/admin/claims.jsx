import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';

// ── Security gate ─────────────────────────────────────────────────────────────
export async function getServerSideProps({ query }) {
  if (query.key !== 'flightcomp-admin-2026') return { notFound: true };
  return { props: {} };
}

// ── Status metadata ───────────────────────────────────────────────────────────
const STATUS = {
  authorized:        { label: 'Authorized',        color: '#3b82f6', bg: '#1e3a5f' },
  letter_generated:  { label: 'Letter Ready',      color: '#8b5cf6', bg: '#2d1b69' },
  submitted:         { label: 'Submitted',          color: '#f59e0b', bg: '#3d2800' },
  awaiting_response: { label: 'Awaiting Response',  color: '#f59e0b', bg: '#3d2800' },
  accepted:          { label: 'Accepted',           color: '#22c55e', bg: '#14532d' },
  rejected:          { label: 'Rejected',           color: '#ef4444', bg: '#450a0a' },
  more_info_needed:  { label: 'More Info Needed',   color: '#f97316', bg: '#431407' },
  followup_sent:     { label: 'Follow-up Sent',     color: '#06b6d4', bg: '#083344' },
  escalated:         { label: 'Escalated',          color: '#fb923c', bg: '#431407' },
  resolved:          { label: 'Resolved',           color: '#6b7280', bg: '#1c1c1e' },
};

function StatusBadge({ status, small }) {
  const s = STATUS[status] || { label: status, color: '#6b7280', bg: '#1c1c1e' };
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}44`,
      borderRadius: 4,
      padding: small ? '1px 6px' : '3px 10px',
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {s.label.toUpperCase()}
    </span>
  );
}

function fmt(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Action buttons ─────────────────────────────────────────────────────────────
function ActionButton({ label, onClick, color, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '8px 16px',
        background: disabled || loading ? 'var(--surf3)' : (color || 'var(--blue)'),
        color: disabled || loading ? 'var(--dim)' : '#fff',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '…' : label}
    </button>
  );
}

// ── Record Response Modal ──────────────────────────────────────────────────────
function RecordResponseModal({ claim, onClose, onSave }) {
  const [form, setForm] = useState({ classification: 'accepted', summary: '', responseDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!form.summary.trim()) { setError('Summary is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claim.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Request failed');
      onSave(j.claim);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>Record Airline Response</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={lbStyle}>Classification</label>
          <select style={inStyle} value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))}>
            <option value="accepted">Accepted — airline agreed to pay</option>
            <option value="rejected">Rejected — airline denied the claim</option>
            <option value="more_info">More Info Needed — airline requested details</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbStyle}>Response Summary *</label>
          <textarea
            style={{ ...inStyle, minHeight: 80, resize: 'vertical' }}
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="Summarise what the airline said..."
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbStyle}>Response Date (optional)</label>
          <input style={inStyle} type="date" value={form.responseDate} onChange={e => setForm(f => ({ ...f, responseDate: e.target.value }))} />
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ActionButton label="Cancel" onClick={onClose} color="#374151" />
          <ActionButton label="Save Response" onClick={handleSave} loading={loading} />
        </div>
      </div>
    </div>
  );
}

// ── Mark Resolved Modal ────────────────────────────────────────────────────────
function ResolveModal({ claim, onClose, onSave }) {
  const [form, setForm] = useState({ resolutionType: 'paid', notes: '' });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/claims/${claim.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    onSave(j.claim);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 420, width: '100%' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>Mark Claim Resolved</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={lbStyle}>Resolution Type</label>
          <select style={inStyle} value={form.resolutionType} onChange={e => setForm(f => ({ ...f, resolutionType: e.target.value }))}>
            <option value="paid">Paid — compensation received</option>
            <option value="withdrawn">Withdrawn — passenger withdrew</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbStyle}>Notes (optional)</label>
          <textarea style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ActionButton label="Cancel" onClick={onClose} color="#374151" />
          <ActionButton label="Mark Resolved" onClick={handleSave} loading={loading} color="#374151" />
        </div>
      </div>
    </div>
  );
}

// ── Letter Preview ─────────────────────────────────────────────────────────────
function LetterPreview({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '10px 16px', background: 'var(--surf2)', border: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
      >
        <span>Current Letter / Draft</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <pre style={{ padding: 16, margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 400, overflowY: 'auto', background: 'var(--surf2)' }}>
          {text}
        </pre>
      )}
    </div>
  );
}

// ── History Timeline ───────────────────────────────────────────────────────────
function History({ events }) {
  if (!events?.length) return <p style={{ color: 'var(--dim)', fontSize: 13 }}>No history yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...events].reverse().map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--surf2)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <div style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: e.triggeredBy === 'admin' ? '#f59e0b' : e.triggeredBy === 'airline' ? '#22c55e' : 'var(--blue)', marginTop: 5 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{e.action}</span>
              <span style={{ fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap' }}>{fmt(e.timestamp)}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{e.details}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Claim Detail Panel ─────────────────────────────────────────────────────────
function ClaimDetail({ claim: initial, onBack, onUpdate }) {
  const [claim, setClaim] = useState(initial);
  const [loading, setLoading] = useState({});
  const [modal, setModal] = useState(null); // 'response' | 'resolve'

  useEffect(() => { setClaim(initial); }, [initial]);

  function setLoad(key, val) { setLoading(p => ({ ...p, [key]: val })); }

  async function callAction(key, path, body = {}) {
    setLoad(key, true);
    try {
      const res = await fetch(`/api/claims/${claim.id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) { alert(j.error || 'Action failed'); return; }
      setClaim(j.claim);
      onUpdate(j.claim);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoad(key, false);
    }
  }

  const st = claim.status;
  const isManualPending = claim.submittedVia === 'form_manual' && st === 'awaiting_response' && !claim.history?.some(h => h.action === 'manual_submission_confirmed');

  const curr = STATUS[st] || {};

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>← Back to claims</button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          {claim.passengerName}
        </h2>
        <StatusBadge status={st} />
        {claim.isTestClaim && (
          <span style={{ background: '#312e81', color: '#a5b4fc', border: '1px solid #a5b4fc44', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>TEST</span>
        )}
      </div>

      {/* Manual submission warning */}
      {claim.submittedVia === 'form_manual' && !claim.history?.some(h => h.action === 'manual_submission_confirmed') && (
        <div style={{ background: '#431407', border: '1px solid #f9731644', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#f97316' }}>MANUAL SUBMISSION REQUIRED</p>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {claim.airline} has no direct claims email. Go to their claims form, submit the letter manually, then click "Mark as Submitted" below.
              {claim.airlineFormUrl && <> Form: <a href={claim.airlineFormUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>{claim.airlineFormUrl}</a></>}
            </p>
            <ActionButton label="Mark as Submitted" loading={loading.markSubmitted} onClick={() => callAction('markSubmitted', 'mark-submitted')} color="#f97316" />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {st === 'authorized' && (
          <ActionButton label="Generate Letter" loading={loading.genLetter} onClick={() => callAction('genLetter', 'generate-letter')} />
        )}
        {st === 'letter_generated' && (
          <ActionButton label="Submit to Airline" loading={loading.submit} onClick={() => callAction('submit', 'submit')} />
        )}
        {(st === 'awaiting_response') && (
          <ActionButton label="Record Response" onClick={() => setModal('response')} color="#22c55e" />
        )}
        {(st === 'rejected' || st === 'followup_sent' || st === 'more_info_needed' ||
          (st === 'awaiting_response' && claim.airlineResponseReceived)) && (
          <ActionButton label="Send Follow-up" loading={loading.followup} onClick={() => callAction('followup', 'followup')} color="#06b6d4" />
        )}
        {(st === 'followup_sent' || st === 'escalated' === false) && claim.followUpCount >= 2 && (
          <ActionButton label="Escalate to Authority" loading={loading.escalate} onClick={() => callAction('escalate', 'escalate')} color="#f97316" />
        )}
        {(st === 'rejected' || st === 'followup_sent') && (
          <ActionButton label="Escalate to Authority" loading={loading.escalate} onClick={() => callAction('escalate', 'escalate')} color="#f97316" />
        )}
        {st !== 'resolved' && (
          <ActionButton label="Mark Resolved" onClick={() => setModal('resolve')} color="#374151" />
        )}
      </div>

      {/* Claim info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          ['Claim ID',    claim.id.slice(0, 8) + '…'],
          ['Airline',     claim.airline + (claim.airlineIataCode ? ` (${claim.airlineIataCode})` : '')],
          ['Flight',      `${claim.flightNumber} · ${claim.flightDate}`],
          ['Route',       `${claim.departureAirport} → ${claim.arrivalAirport}`],
          ['Disruption',  claim.disruptionType],
          ['Regulation',  claim.regulation],
          ['Passenger',   claim.passengerName],
          ['Email',       claim.passengerEmail],
          ['Compensation', claim.estimatedCompensation ? `${claim.currency} ${claim.estimatedCompensation}` : '—'],
          ['Fee',         `${claim.feePercentage}%`],
          ['Booking Ref', claim.bookingReference || '—'],
          ['Created',     fmt(claim.createdAt)],
          ['Submitted',   fmt(claim.submittedAt)],
          ['Follow-ups',  String(claim.followUpCount)],
          ['Airline Email', claim.airlineEmail || (claim.airlineFormUrl ? 'Form only' : '—')],
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--surf2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Letter preview */}
      <LetterPreview text={claim.claimLetterText} />

      {/* History */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>History</h3>
        <History events={claim.history} />
      </div>

      {/* Modals */}
      {modal === 'response' && (
        <RecordResponseModal claim={claim} onClose={() => setModal(null)} onSave={c => { setClaim(c); onUpdate(c); setModal(null); }} />
      )}
      {modal === 'resolve' && (
        <ResolveModal claim={claim} onClose={() => setModal(null)} onSave={c => { setClaim(c); onUpdate(c); setModal(null); }} />
      )}
    </div>
  );
}

// ── Claims List Table ──────────────────────────────────────────────────────────
function ClaimsList({ claims, onSelect }) {
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...claims].sort((a, b) => {
    let av = a[sortKey] || '', bv = b[sortKey] || '';
    if (sortDir === 'desc') [av, bv] = [bv, av];
    return av < bv ? -1 : av > bv ? 1 : 0;
  });

  function Th({ k, children }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', background: 'var(--surf2)', borderBottom: '1px solid var(--border)' }}
      >
        {children} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  if (!claims.length) {
    return <p style={{ color: 'var(--dim)', fontSize: 14 }}>No claims yet. Click "Create Test Claim" to get started.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <Th k="id">ID</Th>
            <Th k="passengerName">Passenger</Th>
            <Th k="airline">Airline</Th>
            <Th k="flightNumber">Flight</Th>
            <Th k="status">Status</Th>
            <Th k="regulation">Reg.</Th>
            <Th k="createdAt">Created</Th>
            <Th k="updatedAt">Updated</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => (
            <tr
              key={c.id}
              onClick={() => onSelect(c)}
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surf2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={td}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.id.slice(0, 8)}</span></td>
              <td style={td}>{c.passengerName}{c.isTestClaim && <span style={{ marginLeft: 4, fontSize: 10, color: '#a5b4fc' }}>TEST</span>}</td>
              <td style={td}>{c.airline}</td>
              <td style={td}>{c.flightNumber}</td>
              <td style={td}><StatusBadge status={c.status} small /></td>
              <td style={td}>{c.regulation}</td>
              <td style={td}>{fmt(c.createdAt)}</td>
              <td style={td}>{fmt(c.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
export default function AdminClaims() {
  const [claims, setClaims]       = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState('');

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch('/api/claims/list');
      const j   = await res.json();
      setClaims(j.claims || []);
    } catch {
      setError('Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  async function createTestClaim() {
    setCreating(true);
    try {
      const res = await fetch('/api/claims/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true }),
      });
      const j = await res.json();
      if (!res.ok) { alert(j.error || 'Failed to create test claim'); return; }
      await fetchClaims();
      setSelected(j.claim);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleUpdate(updatedClaim) {
    setClaims(cs => cs.map(c => c.id === updatedClaim.id ? updatedClaim : c));
    setSelected(updatedClaim);
  }

  return (
    <>
      <Head>
        <title>Claims Admin · FlightComp</title>
      </Head>
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui, sans-serif' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--surf)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>FlightComp</a>
          <span style={{ color: 'var(--dim)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Claims Admin</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--dim)', marginRight: 4 }}>
            {claims.length} claim{claims.length !== 1 ? 's' : ''}
          </span>
          <ActionButton
            label={creating ? 'Creating…' : '+ Create Test Claim'}
            loading={creating}
            onClick={createTestClaim}
            color="#7c3aed"
          />
        </div>

        {/* Body */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
          {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

          {loading ? (
            <p style={{ color: 'var(--dim)' }}>Loading claims…</p>
          ) : selected ? (
            <ClaimDetail
              claim={selected}
              onBack={() => setSelected(null)}
              onUpdate={handleUpdate}
            />
          ) : (
            <ClaimsList claims={claims} onSelect={c => setSelected(c)} />
          )}
        </div>
      </div>
    </>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const td = { padding: '10px 12px', color: 'var(--text)', verticalAlign: 'middle' };
const lbStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 };
const inStyle = {
  width: '100%', padding: '9px 12px',
  background: 'var(--surf2)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
};

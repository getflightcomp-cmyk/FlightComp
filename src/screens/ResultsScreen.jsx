import { useState } from 'react';

// ── Placeholder for Session 2 Stripe integration ─────
// Replace this function body with Stripe Checkout redirect
function handleClaimLetter(claimData) {
  console.info('[Session 2] handleClaimLetter called with:', claimData);
  alert('Stripe payment flow coming in Session 2. Claim data logged to console.');
}

// ── Expandable Section ────────────────────────────────
function ExpandSection({ icon, title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="expand-section">
      <button className="expand-trigger" onClick={() => setOpen(o => !o)}>
        <span className="expand-trigger-left">
          <span className="expand-icon">{icon}</span>
          <span className="expand-title">{title}</span>
        </span>
        <svg
          className={`expand-chevron${open ? ' open' : ''}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div className={`expand-body${open ? ' open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

// ── Verdict meta ──────────────────────────────────────
const VERDICT_META = {
  likely:   { badge:'LIKELY ELIGIBLE',   dot:'🟢', noCompMsg: null },
  possibly: { badge:'POSSIBLY ELIGIBLE', dot:'🟡', noCompMsg: 'Compensation amount depends on confirmed route distance.' },
  unlikely: { badge:'UNLIKELY ELIGIBLE', dot:'🔴', noCompMsg: 'No cash compensation applies in this case.' },
};

const DISRUPTION_LABELS = {
  cancelled:'Cancellation', delayed:'Delay', denied:'Denied boarding', downgraded:'Downgrade',
};

export default function ResultsScreen({ result, answers, onReset }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const { verdict, regulation, compensation, verdictNote, careRights, deskScript, claimData, distanceKm } = result;
  const meta = VERDICT_META[verdict];

  function copyScript() {
    navigator.clipboard.writeText(deskScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Verdict amount display
  const amountDisplay = compensation?.amount
    || (verdict === 'likely' ? '€250–€600' : verdict === 'possibly' ? '€250–€600' : null);

  return (
    <div className="results-screen slide-up">

      {/* ── VERDICT BANNER ── */}
      <div className={`verdict-banner ${verdict}`}>
        <div className="verdict-eyebrow">{meta.dot} Your Result</div>
        <div className={`verdict-badge`}>{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="verdict-amount">{amountDisplay}</div>
            <div className="verdict-reg">under {regulation === 'UK261' ? 'UK261/2004' : 'EU Regulation 261/2004'}</div>
          </>
        ) : (
          <div className="verdict-reg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            No cash compensation — care rights may still apply
          </div>
        )}
        {verdictNote && (
          <p className="verdict-note">{verdictNote}</p>
        )}
      </div>

      <div className="results-body">

        {/* ── PRIMARY CTA (placeholder for Stripe in Session 2) ── */}
        {(verdict === 'likely' || verdict === 'possibly') && (
          <div className="cta-primary">
            <div className="cta-primary-header">
              <span className="cta-primary-title">Get your claim letter</span>
              <span className="cta-price">$19</span>
            </div>
            <p className="cta-primary-desc">
              We draft a professional EU261 claim letter citing the exact regulation, your compensation amount,
              and a 14-day legal deadline. Download as PDF or copy to email.
            </p>
            <button className="btn-claim" onClick={() => handleClaimLetter(claimData)}>
              Get My Claim Letter →
            </button>
          </div>
        )}

        {/* ── SECONDARY CTA ── */}
        <div className="cta-secondary">
          <span className="cta-secondary-icon">⚖️</span>
          <div className="cta-secondary-text">
            <div className="cta-secondary-title">Want us to handle everything?</div>
            <div className="cta-secondary-sub">No win, no fee · 20% on success only</div>
          </div>
          <span className="cta-secondary-badge">Coming soon</span>
        </div>

        {/* ── EXPANDABLE: Desk script ── */}
        <ExpandSection icon="💬" title="What to say at the desk right now">
          <div className="desk-script" style={{ paddingRight: 80 }}>
            {deskScript}
            <button className="copy-script-btn" onClick={copyScript}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </ExpandSection>

        {/* ── EXPANDABLE: Care rights ── */}
        <ExpandSection icon="🛡️" title="What the airline must provide now">
          {careRights.length > 0 ? (
            <div className="care-list">
              {careRights.map((r, i) => (
                <div key={i} className="care-item">
                  <span className="care-emoji">{r.emoji}</span>
                  <div className="care-text">
                    <strong>{r.title}</strong><br />{r.detail}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color:'var(--text-dim)', fontSize:14, paddingTop:14, lineHeight:1.6 }}>
              No immediate care obligations apply for this disruption level. Keep all documentation in case circumstances change.
            </p>
          )}
        </ExpandSection>

        {/* ── Flight summary ── */}
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r-card)', padding:'14px 16px',
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:10,
        }}>
          {[
            ['Disruption',   DISRUPTION_LABELS[answers.disruption] || '—'],
            ['Flight',       answers.flightNumber || '—'],
            ['Route',        `${answers.from} → ${answers.to}`],
            ['Distance',     distanceKm ? `~${distanceKm.toLocaleString()} km` : 'Unknown'],
            ['Regulation',   regulation],
            ['Date',         answers.flightDate || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--text-dim)',
                            letterSpacing:0.8, textTransform:'uppercase', marginBottom:3 }}>
                {label}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', lineHeight:1.3,
                            wordBreak:'break-word' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Reset ── */}
        <div className="reset-link">
          <button onClick={onReset}>← Check another flight</button>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getAirlineInfo, getNEB } from '../lib/airlines';

/* ══════════════════════════════════════════════════════
   Success page — shown after Stripe payment completes
   Reads claim data from sessionStorage, calls the
   /api/generate-letter endpoint, then shows:
     - The generated claim letter (scrollable)
     - Download as PDF button
     - Copy to clipboard button
     - "What to do next" steps with NEB info
══════════════════════════════════════════════════════ */

export default function Success() {
  const router = useRouter();
  const [state, setState] = useState('loading'); // loading | ready | error
  const [letter, setLetter] = useState('');
  const [claimData, setClaimData] = useState(null);
  const [details, setDetails] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const raw = sessionStorage.getItem('fc_claim');
    if (!raw) {
      setState('error');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setState('error');
      return;
    }

    const { answers, result: r, details: d } = parsed;
    if (!answers || !r || !d) {
      setState('error');
      return;
    }

    setClaimData(answers);
    setResult(r);
    setDetails(d);

    // Generate the letter via API
    fetch('/api/generate-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, result: r, details: d }),
    })
      .then(async res => {
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        setLetter(json.letter);
        setState('ready');
        // Clear sessionStorage so a refresh doesn't re-generate
        sessionStorage.removeItem('fc_claim');
      })
      .catch(() => setState('error'));
  }, []);

  async function downloadPdf() {
    if (!letter) return;
    setPdfLoading(true);
    try {
      // Dynamic import so jsPDF is never bundled server-side
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      const margin = 20;
      const pageW = doc.internal.pageSize.getWidth();
      const maxW  = pageW - margin * 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);

      const lines = doc.splitTextToSize(letter, maxW);
      let y = margin;

      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      }

      const flightNum = claimData?.flightNumber?.replace(/\s/g, '') || 'flight';
      const date = claimData?.flightDate || new Date().toISOString().split('T')[0];
      doc.save(`EU261-claim-${flightNum}-${date}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }

  function copyLetter() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Loading ────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-title">Drafting your claim letter…</div>
        <div className="loading-sub">
          Claude is reviewing your flight details and writing a
          personalised {result?.regulation || 'EU261'} letter. This takes about 15 seconds.
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Something went wrong</div>
        <div className="error-sub">
          We couldn't load your claim data. If you've already paid,
          please email <strong>support@flightclaim.app</strong> with your booking reference
          and we'll send your letter manually.
        </div>
        <button className="btn-retry" onClick={() => router.push('/')}>← Back to start</button>
      </div>
    );
  }

  // ── What to do next steps ──────────────────────────
  const airlineInfo = getAirlineInfo(claimData?.flightNumber);
  const neb = getNEB(result?.depInfo);
  const regulation = result?.regulation || 'EU261';
  const regFull = regulation === 'UK261' ? 'UK261/2004' : 'EU Regulation 261/2004';

  const nextSteps = [
    {
      title: 'Send the letter to the airline',
      body: airlineInfo
        ? `Email ${airlineInfo.name} at ${airlineInfo.claimsEmail || 'their official claims address'}.`
        : 'Find the airline\'s official claims email on their website under "customer relations" or "EU261 claims".',
      link: airlineInfo?.claimsUrl,
      linkLabel: airlineInfo ? `${airlineInfo.name} claims page ↗` : null,
    },
    {
      title: 'Keep a copy and note today\'s date',
      body: 'Under ' + regFull + ' airlines must respond within 14 days. Screenshot or save the email confirmation.',
    },
    {
      title: 'Chase after 14 days',
      body: 'If no response or a rejection, send a follow-up email referencing your original claim date and demanding a written decision.',
    },
    {
      title: neb ? `Escalate to the ${neb.name}` : 'Escalate to the National Enforcement Body (NEB)',
      body: neb
        ? `If the airline refuses or ignores you after 8 weeks, file a complaint with ${neb.name}. This is free and has legal teeth.`
        : 'File a complaint with the National Enforcement Body in the departure country. This is free and has legal teeth.',
      link: neb?.url,
      linkLabel: neb ? `${neb.name} ↗` : null,
    },
    {
      title: 'Claim via Alternative Dispute Resolution (ADR)',
      body: regulation === 'UK261'
        ? 'In the UK, if the NEB doesn\'t resolve it, use an approved ADR scheme — most UK airlines participate. This is free to you.'
        : 'In the EU, many countries have free ADR schemes. Check the European Commission\'s ODR platform if the airline is based in another EU country.',
      link: regulation === 'UK261'
        ? 'https://www.caa.co.uk/passengers/resolving-travel-problems/delays-and-cancellations/options/alternative-dispute-resolution/'
        : 'https://ec.europa.eu/consumers/odr',
      linkLabel: regulation === 'UK261' ? 'CAA ADR schemes ↗' : 'EU ODR Platform ↗',
    },
  ];

  // ── Ready ──────────────────────────────────────────
  return (
    <div className="success-screen">
      <div className="success-header">
        <div className="success-icon">✅</div>
        <div className="success-title">Your claim letter is ready</div>
        <div className="success-sub">
          Personalised for {details?.name || 'you'} ·{' '}
          {regulation} ·{' '}
          {result?.compensation?.amount ? `Up to ${result.compensation.amount}` : 'Compensation pending'}
        </div>
      </div>

      {/* ── Letter preview ── */}
      <div className="letter-card">{letter}</div>

      {/* ── Action buttons ── */}
      <div className="letter-actions">
        <button className="btn-action primary" onClick={downloadPdf} disabled={pdfLoading}>
          {pdfLoading ? '⏳ Generating…' : '⬇️ Download PDF'}
        </button>
        <button className="btn-action" onClick={copyLetter}>
          {copied ? '✓ Copied!' : '📋 Copy text'}
        </button>
      </div>

      {/* ── What to do next ── */}
      <div className="next-steps">
        <div className="next-steps-title">What to do next</div>
        {nextSteps.map((step, i) => (
          <div key={i} className="next-step-item">
            <span className="step-num">{i + 1}</span>
            <div className="step-txt">
              <strong>{step.title}</strong>
              {step.body}
              {step.link && step.linkLabel && (
                <>
                  {' '}
                  <a className="step-link" href={step.link} target="_blank" rel="noopener noreferrer">
                    {step.linkLabel}
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: 'var(--dim)', fontSize: 13, cursor: 'pointer' }}
        >
          ← Check another flight
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getAirlineInfo, getNEB } from '../lib/airlines';

/* ══════════════════════════════════════════════════════
   Success page — shown after Stripe payment completes
══════════════════════════════════════════════════════ */

// ── Formatted letter display ──────────────────────────
function LetterDisplay({ letter }) {
  const paragraphs = letter.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <div className="letter-card">
      {paragraphs.map((para, i) => {
        const isSubject = /^re:/i.test(para);
        return (
          <p key={i} className={`letter-para${isSubject ? ' letter-subject' : ''}`}>
            {para}
          </p>
        );
      })}
    </div>
  );
}

// ── Professional PDF builder ──────────────────────────
async function buildPdf({ letter, claimData }) {
  const { jsPDF } = await import('jspdf');

  const marginL  = 25;   // mm
  const marginR  = 25;
  const marginT  = 30;
  const marginB  = 25;
  const pageW    = 210;
  const pageH    = 297;
  const contentW = pageW - marginL - marginR;  // 160mm
  const bodySize = 11;
  const lineH    = 6.5;  // mm per line at 11pt
  const paraGap  = 5;    // extra mm between paragraphs

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let y = marginT;
  let pageNum = 1;

  // ── helpers ──
  function addPageNumber() {
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(`— ${pageNum} —`, pageW / 2, pageH - 10, { align: 'center' });
  }

  function checkPage(linesNeeded = 1) {
    if (y + linesNeeded * lineH > pageH - marginB) {
      addPageNumber();
      doc.addPage();
      pageNum++;
      y = marginT;
      doc.setTextColor(30, 30, 30);
    }
  }

  function writeParagraph(text, { bold = false, size = bodySize, gap = paraGap } = {}) {
    doc.setFont('times', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(30, 30, 30);

    const lines = doc.splitTextToSize(text, contentW);
    checkPage(lines.length);
    for (const line of lines) {
      doc.text(line, marginL, y);
      y += lineH;
    }
    y += gap;
  }

  // ── Parse letter into paragraphs ──
  const rawParas = letter.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  for (const para of rawParas) {
    const isSubject  = /^re:/i.test(para);
    const isSignoff  = /^yours (faithfully|sincerely|truly)/i.test(para);
    const isGreeting = /^dear /i.test(para);

    if (isSubject) {
      writeParagraph(para, { bold: true, size: 11, gap: paraGap });
    } else if (isSignoff) {
      // Extra space before sign-off
      y += 4;
      writeParagraph(para, { bold: false, size: bodySize, gap: lineH * 4 }); // 4 lines gap for wet signature space
    } else if (isGreeting) {
      writeParagraph(para, { bold: false, size: bodySize, gap: paraGap });
    } else {
      writeParagraph(para, { bold: false, size: bodySize, gap: paraGap });
    }
  }

  // Final page number
  addPageNumber();

  return doc;
}

export default function Success() {
  const router = useRouter();
  const [state, setState] = useState('loading');
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
    if (!raw) { setState('error'); return; }

    let parsed;
    try { parsed = JSON.parse(raw); } catch { setState('error'); return; }

    const { answers, result: r, details: d } = parsed;
    if (!answers || !r || !d) { setState('error'); return; }

    setClaimData(answers);
    setResult(r);
    setDetails(d);

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
        sessionStorage.removeItem('fc_claim');
      })
      .catch(() => setState('error'));
  }, []);

  async function downloadPdf() {
    if (!letter) return;
    setPdfLoading(true);
    try {
      const doc = await buildPdf({ letter, claimData });
      const flightNum = claimData?.flightNumber?.replace(/\s/g, '') || 'flight';
      const date = claimData?.flightDate || new Date().toISOString().split('T')[0];
      const fileName = `EU261-claim-${flightNum}-${date}.pdf`;

      // Mobile Safari doesn't support the `download` attribute on blob URLs —
      // open in a new tab so the user can use the share/save sheet instead.
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        // Fallback if popup was blocked
        if (!w) {
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      console.error('[downloadPdf]', err);
      alert('Could not generate PDF. Try the "Copy text" button instead.');
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

  // ── Loading ──────────────────────────────────────────
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

  // ── Error ────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Something went wrong</div>
        <div className="error-sub">
          We couldn't load your claim data. If you've already paid,
          please email <strong>support@flightclaim.app</strong> with your booking
          reference and we'll send your letter manually.
        </div>
        <button className="btn-retry" onClick={() => router.push('/')}>← Back to start</button>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────
  const airlineInfo = getAirlineInfo(claimData?.flightNumber);
  const neb = getNEB(result?.depInfo);
  const regulation = result?.regulation || 'EU261';
  const regFull = regulation === 'UK261' ? 'UK261/2004' : 'EU Regulation 261/2004';

  const nextSteps = [
    {
      title: 'Send the letter to the airline',
      body: airlineInfo
        ? `Email ${airlineInfo.name} at ${airlineInfo.claimsEmail || 'their official claims address'}.`
        : 'Find the airline\'s claims email on their website — search "EU261 claim" or "customer relations".',
      link: airlineInfo?.claimsUrl,
      linkLabel: airlineInfo ? `${airlineInfo.name} claims page ↗` : null,
    },
    {
      title: 'Keep a copy and note today\'s date',
      body: `Under ${regFull} airlines must respond within 14 days. Screenshot or save your sent email.`,
    },
    {
      title: 'Chase after 14 days',
      body: 'If no response or a rejection, send a follow-up referencing your original claim date and demanding a written decision.',
    },
    {
      title: neb ? `Escalate to the ${neb.name}` : 'Escalate to the National Enforcement Body (NEB)',
      body: neb
        ? `If the airline refuses or ignores you after 8 weeks, file a free complaint with ${neb.name}. This has legal weight.`
        : 'File a free complaint with the National Enforcement Body in the departure country.',
      link: neb?.url,
      linkLabel: neb ? `${neb.name} ↗` : null,
    },
    {
      title: 'Claim via Alternative Dispute Resolution (ADR)',
      body: regulation === 'UK261'
        ? 'In the UK, if the NEB doesn\'t resolve it, use a free CAA-approved ADR scheme — most UK airlines participate.'
        : 'In the EU, many countries have free ADR schemes. Try the European Commission\'s ODR platform.',
      link: regulation === 'UK261'
        ? 'https://www.caa.co.uk/passengers/resolving-travel-problems/delays-and-cancellations/options/alternative-dispute-resolution/'
        : 'https://ec.europa.eu/consumers/odr',
      linkLabel: regulation === 'UK261' ? 'CAA ADR schemes ↗' : 'EU ODR Platform ↗',
    },
  ];

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

      {/* Formatted letter preview */}
      <LetterDisplay letter={letter} />

      {/* Action buttons */}
      <div className="letter-actions">
        <button className="btn-action primary" onClick={downloadPdf} disabled={pdfLoading}>
          {pdfLoading ? '⏳ Generating…' : '⬇️ Download PDF'}
        </button>
        <button className="btn-action" onClick={copyLetter}>
          {copied ? '✓ Copied!' : '📋 Copy text'}
        </button>
      </div>

      {/* What to do next */}
      <div className="next-steps">
        <div className="next-steps-title">What to do next</div>
        {nextSteps.map((step, i) => (
          <div key={i} className="next-step-item">
            <span className="step-num">{i + 1}</span>
            <div className="step-txt">
              <strong>{step.title}</strong>
              {step.body}
              {step.link && step.linkLabel && (
                <>{' '}<a className="step-link" href={step.link} target="_blank" rel="noopener noreferrer">{step.linkLabel}</a></>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: 'var(--dim)', fontSize: 13, cursor: 'pointer', padding: '10px 16px', minHeight: 48 }}
        >
          ← Check another flight
        </button>
      </div>
    </div>
  );
}

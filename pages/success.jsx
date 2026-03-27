import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getAirlineInfo, getNEB } from '../lib/airlines';

/* ══════════════════════════════════════════════════════
   Success page — shown after Stripe payment completes
══════════════════════════════════════════════════════ */

// ── Inline segment parser (shared for on-screen display) ──
function parseInlineSegments(text) {
  const patterns = [
    { re: /(?:€|£)\s*\d[\d,.]*|\d[\d,.]*\s*(?:EUR|GBP|euros?|pounds?)/gi, cls: 'lh-amount' },
    { re: /(?:EU|UK|EC)\s*(?:Regulation\s*)?261(?:\/2004)?/gi,            cls: 'lh-regulation' },
    { re: /within\s+14\s+days?|14[\s-]days?/gi,                           cls: 'lh-deadline' },
  ];
  const hits = [];
  for (const { re, cls } of patterns) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(text)) !== null)
      hits.push({ start: m.index, end: m.index + m[0].length, cls });
  }
  hits.sort((a, b) => a.start - b.start);
  const clean = []; let cur = 0;
  for (const h of hits) { if (h.start >= cur) { clean.push(h); cur = h.end; } }
  const segs = []; cur = 0;
  for (const h of clean) {
    if (h.start > cur) segs.push({ text: text.slice(cur, h.start), cls: null });
    segs.push({ text: text.slice(h.start, h.end), cls: h.cls });
    cur = h.end;
  }
  if (cur < text.length) segs.push({ text: text.slice(cur), cls: null });
  return segs;
}

// ── Formatted letter display ──────────────────────────
function LetterDisplay({ letter }) {
  const paragraphs = letter.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <div className="letter-card">
      {paragraphs.map((para, i) => {
        const isSubject = /^re:/i.test(para);
        const segs = parseInlineSegments(para);
        return (
          <p key={i} className={`letter-para${isSubject ? ' letter-subject' : ''}`}>
            {segs.map((seg, j) =>
              seg.cls
                ? <span key={j} className={seg.cls}>{seg.text}</span>
                : seg.text
            )}
          </p>
        );
      })}
    </div>
  );
}

// ── Professional PDF builder ──────────────────────────
async function buildPdf({ letter, claimData, details, result }) {
  const { jsPDF } = await import('jspdf');

  const PAGE_W = 210, PAGE_H = 297;
  const ML = 25, MR = 25;
  const CONTENT_W = PAGE_W - ML - MR; // 160mm
  const BODY_SIZE = 10.5;
  const LINE_H    = 5.5;  // mm per line at 10.5pt
  const PARA_GAP  = 4;
  const FOOTER_RESERVE = 18; // mm reserved at bottom

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let pageNum = 1;
  let y = 0;

  // ── Colour helpers ──
  const h2r = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const setTC = h => doc.setTextColor(...h2r(h));
  const setFC = h => doc.setFillColor(...h2r(h));
  const setDC = h => doc.setDrawColor(...h2r(h));

  // ── Footer ──
  function drawFooter() {
    setDC('#E2E8F0'); doc.setLineWidth(0.3);
    doc.line(ML, PAGE_H - 13, PAGE_W - MR, PAGE_H - 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setTC('#64748B');
    doc.text('FlightComp — EU261 Claim Service', ML, PAGE_H - 8);
    doc.text(`Page ${pageNum}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
  }

  // ── Page-break guard (call before each rendered line) ──
  function checkPage() {
    if (y > PAGE_H - FOOTER_RESERVE - LINE_H) {
      drawFooter();
      doc.addPage();
      pageNum++;
      y = 20;
    }
  }

  // ── Build inline segments for PDF body text ──
  function getPdfSegs(text) {
    const DARK = h2r('#1E293B');
    const RED  = h2r('#DC2626');
    const pats = [
      { re: /(?:€|£)\s*\d[\d,.]*|\d[\d,.]*\s*(?:EUR|GBP|euros?|pounds?)/gi, bold:true, color:DARK },
      { re: /(?:EU|UK|EC)\s*(?:Regulation\s*)?261(?:\/2004)?/gi,             bold:true, color:DARK },
      { re: /within\s+14\s+days?|14[\s-]days?/gi,                            bold:true, color:RED  },
    ];
    const hits = [];
    for (const { re, bold, color } of pats) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text)) !== null)
        hits.push({ start:m.index, end:m.index+m[0].length, bold, color });
    }
    hits.sort((a,b) => a.start-b.start);
    const clean = []; let cur = 0;
    for (const h of hits) { if (h.start>=cur) { clean.push(h); cur=h.end; } }
    const segs = []; cur = 0;
    for (const h of clean) {
      if (h.start>cur) segs.push({ text:text.slice(cur,h.start), bold:false, color:DARK });
      segs.push({ text:text.slice(h.start,h.end), bold:h.bold, color:h.color });
      cur = h.end;
    }
    if (cur<text.length) segs.push({ text:text.slice(cur), bold:false, color:DARK });
    return segs;
  }

  // ── Render body paragraph with inline bold/colour ──
  function renderPara(para, { lh=LINE_H, gap=PARA_GAP, size=BODY_SIZE, forceBold=false, forceColor=null }={}) {
    const segs = getPdfSegs(para);
    // Tokenise preserving whitespace tokens so we can word-wrap
    const tokens = [];
    for (const seg of segs) {
      for (const part of seg.text.split(/(\s+)/)) {
        if (part) tokens.push({ text:part, bold: forceBold || seg.bold, color: forceColor || seg.color });
      }
    }
    // Build wrapped lines word-by-word
    const lines = []; let curLine = { toks:[], w:0 };
    for (const tok of tokens) {
      doc.setFont('helvetica', tok.bold ? 'bold' : 'normal'); doc.setFontSize(size);
      const tw = doc.getTextWidth(tok.text);
      const ws = /^\s+$/.test(tok.text);
      if (!ws && curLine.w + tw > CONTENT_W && curLine.toks.length > 0) {
        lines.push(curLine); curLine = { toks:[], w:0 };
      }
      curLine.toks.push(tok); curLine.w += tw;
    }
    if (curLine.toks.length > 0) lines.push(curLine);

    for (const line of lines) {
      checkPage();
      let lx = ML;
      const start = line.toks.findIndex(t => !/^\s+$/.test(t.text));
      if (start === -1) { y += lh; continue; }
      for (let i = start; i < line.toks.length; i++) {
        const tok = line.toks[i];
        doc.setFont('helvetica', tok.bold ? 'bold' : 'normal'); doc.setFontSize(size);
        doc.setTextColor(...tok.color);
        doc.text(tok.text, lx, y);
        lx += doc.getTextWidth(tok.text);
      }
      y += lh;
    }
    y += gap;
  }

  // ════════════════════════════════════════════════
  // PAGE 1 — HEADER
  // ════════════════════════════════════════════════

  // Blue banner (full page width)
  setFC('#3B82F6');
  doc.rect(0, 0, PAGE_W, 16, 'F');

  // Brand name left-aligned in banner
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text('FlightComp', ML, 10);

  // Date right-aligned in banner
  const todayStr = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(todayStr, PAGE_W - MR, 10, { align: 'right' });

  // Branding tagline below banner
  y = 21;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setTC('#64748B');
  doc.text('Generated by FlightComp — EU261 Claim Service', PAGE_W / 2, y, { align: 'center' });

  // Thin divider
  y += 4;
  setDC('#E2E8F0'); doc.setLineWidth(0.3);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 7;

  // ── Sender block ──
  const senderName  = details?.name  || '';
  const senderEmail = details?.email || '';

  if (senderName) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); setTC('#1E293B');
    doc.text(senderName, ML, y); y += 5.5;
  }
  if (senderEmail) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC('#475569');
    doc.text(senderEmail, ML, y); y += 5;
  }
  y += 7;

  // ── Recipient block ──
  const aInfo = getAirlineInfo(claimData?.flightNumber);
  const airlineName = aInfo?.name || 'The Airline';

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); setTC('#1E293B');
  doc.text(airlineName, ML, y); y += 5.5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC('#475569');
  doc.text('Customer Relations / Claims Department', ML, y);
  y += 10;

  // ── Subject line ──
  const rawParas  = letter.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const subjPara  = rawParas.find(p => /^re:/i.test(p))
    || `Re: Claim for Compensation — Flight ${claimData?.flightNumber || ''}`;
  const bodyParas = rawParas.filter(p => !/^re:/i.test(p));

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setTC('#1E293B');
  const subjLines = doc.splitTextToSize(subjPara, CONTENT_W);
  for (const sl of subjLines) { doc.text(sl, ML, y); y += 6.5; }

  y += 1;
  setDC('#CBD5E1'); doc.setLineWidth(0.25);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 7;

  // ── Flight details box ──
  const fNum  = claimData?.flightNumber || '';
  const fDate = claimData?.flightDate   || '';
  const fDep  = claimData?.departure    || '';
  const fArr  = claimData?.arrival      || '';
  const fDisr = claimData?.disruption === 'cancel'
    ? 'Cancelled flight'
    : claimData?.delay ? `Delayed ${claimData.delay}+ hours` : 'Flight disruption';
  const fComp = result?.compensation?.amount || '';

  const boxLines = [
    [fNum, fDate, (fDep && fArr) ? `${fDep} → ${fArr}` : ''].filter(Boolean).join('   ·   '),
    [fDisr, fComp ? `Compensation sought: ${fComp}` : ''].filter(Boolean).join('   ·   '),
  ].filter(Boolean);

  if (boxLines.length > 0) {
    const BP = 4.5, BLH = 5;
    const boxH = BP * 2 + boxLines.length * BLH + 1;
    setFC('#F8FAFC'); setDC('#E2E8F0'); doc.setLineWidth(0.4);
    if (doc.roundedRect) doc.roundedRect(ML, y, CONTENT_W, boxH, 2, 2, 'FD');
    else doc.rect(ML, y, CONTENT_W, boxH, 'FD');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); setTC('#334155');
    let by = y + BP + 3.5;
    for (const bl of boxLines) { doc.text(bl, ML + BP, by); by += BLH; }
    y += boxH + 8;
  }

  // ── Letter body ──
  for (const para of bodyParas) {
    const isSignoff = /^yours (faithfully|sincerely|truly)/i.test(para);
    if (isSignoff) {
      y += 4;
      renderPara(para, { gap: 0 });
      y += 28; // space for wet signature
      if (senderName) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); setTC('#1E293B');
        checkPage(); doc.text(senderName, ML, y); y += 5.5;
      }
      if (senderEmail) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC('#475569');
        checkPage(); doc.text(senderEmail, ML, y); y += 5;
      }
      y += PARA_GAP;
    } else {
      renderPara(para);
    }
  }

  drawFooter();
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
      const doc = await buildPdf({ letter, claimData, details, result });
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

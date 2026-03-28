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

  // ── Layout constants ──
  const PAGE_W = 210, PAGE_H = 297;
  const ML = 25, MR = 25;
  const CONTENT_W = PAGE_W - ML - MR; // 160mm
  const HEADER_H  = 18;   // blue banner height
  const SUBHD_H   = 8;    // light-blue subheader height
  const CONTENT_Y = HEADER_H + SUBHD_H + 6; // first usable y after headers
  const FOOTER_Y  = 280;  // footer rule position
  const BODY_SIZE = 10;
  const LINE_H    = 5.5;
  const PARA_GAP  = 5;

  // ── Colour palette ──
  const C = {
    BRAND_BLUE:   [59, 130, 246],
    DARK_BLUE:    [12, 68, 124],
    LT_BLUE_BG:   [230, 241, 251],
    LT_BLUE_BD:   [181, 212, 244],
    ACCENT_BLUE:  [24, 95, 165],
    GRAY_BG:      [248, 250, 252],
    GRAY_BD:      [226, 232, 240],
    TEXT_PRI:     [26, 26, 26],
    TEXT_BODY:    [51, 51, 51],
    TEXT_LABEL:   [100, 116, 139],
    TEXT_MUTED:   [148, 163, 184],
    RED:          [220, 38, 38],
    RED_DARK:     [163, 45, 45],
    WHITE:        [255, 255, 255],
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const TOTAL_ALIAS = '{totalPages}';
  let pageNum = 1;
  let y = 0;

  const setTC = c => doc.setTextColor(...c);
  const setFC = c => doc.setFillColor(...c);
  const setDC = c => doc.setDrawColor(...c);
  const rnd = (x, yy, w, h) =>
    (doc.roundedRect ? doc.roundedRect(x, yy, w, h, 3, 3, 'FD') : doc.rect(x, yy, w, h, 'FD'));

  // ── Page header (blue banner + light-blue subheader) ──
  function drawPageHeader() {
    // Blue banner
    setFC(C.BRAND_BLUE);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

    // "FlightComp" bold 20pt
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); setTC(C.WHITE);
    doc.text('FlightComp', ML, 12);

    // Subtitle 9pt, white at ~70% opacity on blue → light blue-white
    const subtitle = (result?.regulation === 'UK261')
      ? 'UK Civil Aviation Act 2006 · Official compensation claim'
      : 'EU Regulation 261/2004 · Official compensation claim';
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.setTextColor(195, 219, 248);
    doc.text(subtitle, ML, HEADER_H - 3);

    // Light-blue subheader bar
    setFC(C.LT_BLUE_BG);
    doc.rect(0, HEADER_H, PAGE_W, SUBHD_H, 'F');

    // "FORMAL CLAIM" left, date right
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setTC(C.DARK_BLUE);
    doc.text('FORMAL CLAIM', ML, HEADER_H + 5.5);

    const todayStr = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
    doc.setFont('helvetica', 'normal'); setTC(C.ACCENT_BLUE);
    doc.text(todayStr, PAGE_W - MR, HEADER_H + 5.5, { align: 'right' });
  }

  // ── Page footer ──
  function drawFooter() {
    setDC(C.GRAY_BD); doc.setLineWidth(0.3);
    doc.line(ML, FOOTER_Y, PAGE_W - MR, FOOTER_Y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setTC(C.TEXT_MUTED);
    doc.text('Generated by FlightComp · flight-comp.vercel.app · EU261 Claim Document', ML, FOOTER_Y + 5);
    doc.text(`Page ${pageNum} of ${TOTAL_ALIAS}`, PAGE_W - MR, FOOTER_Y + 5, { align: 'right' });
  }

  // ── New page ──
  function newPage() {
    drawFooter();
    doc.addPage();
    pageNum++;
    drawPageHeader();
    y = CONTENT_Y;
  }

  // ── Page-break guard ──
  function checkPage(needed = LINE_H) {
    if (y + needed > FOOTER_Y - 5) newPage();
  }

  // ── Section header with coloured underline ──
  function drawSection(title, red = false) {
    checkPage(14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    setTC(red ? C.RED_DARK : C.DARK_BLUE);
    doc.text(title, ML, y); y += 3.5;
    setDC(red ? C.RED : C.BRAND_BLUE); doc.setLineWidth(0.7);
    doc.line(ML, y, PAGE_W - MR, y); y += 5;
  }

  // ── Inline segment parser ──
  function buildSegs(text, extraPats = []) {
    const pats = [
      { re: /(?:€|£)\s*\d[\d,.]*|\d[\d,.]*\s*(?:EUR|GBP|euros?|pounds?)/gi, bold:true, color:C.TEXT_BODY },
      { re: /(?:EU|UK|EC)\s*(?:Regulation\s*)?261(?:\/2004)?/gi,             bold:true, color:C.TEXT_BODY },
      { re: /within\s+14\s+days?|14[\s-]days?/gi,                            bold:true, color:C.RED       },
      ...extraPats,
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
      if (h.start>cur) segs.push({ text:text.slice(cur,h.start), bold:false, color:C.TEXT_BODY });
      segs.push({ text:text.slice(h.start,h.end), bold:h.bold, color:h.color });
      cur = h.end;
    }
    if (cur<text.length) segs.push({ text:text.slice(cur), bold:false, color:C.TEXT_BODY });
    return segs;
  }

  // ── Word-wrapped inline paragraph renderer ──
  function renderSegs(segs, { lh=LINE_H, gap=PARA_GAP, size=BODY_SIZE }={}) {
    const tokens = [];
    for (const seg of segs) {
      for (const part of seg.text.split(/(\s+)/)) {
        if (part) tokens.push({ text:part, bold:seg.bold, color:seg.color });
      }
    }
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

  const renderPara = (text, opts) => renderSegs(buildSegs(text), opts);

  // ── Two-column table box ──
  function drawTableBox(rows) {
    if (!rows.length) return;
    const ROW_H = 6, PAD = 4;
    const boxH = PAD * 2 + rows.length * ROW_H;
    checkPage(boxH + 4);
    setFC(C.GRAY_BG); setDC(C.GRAY_BD); doc.setLineWidth(0.5);
    rnd(ML, y, CONTENT_W, boxH);
    let ry = y + PAD + 3.5;
    const COL = ML + 52;
    for (const [label, value] of rows) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
      doc.text(label, ML + PAD, ry);
      doc.setFont('helvetica', 'bold'); setTC(C.TEXT_PRI);
      doc.text(String(value), COL, ry);
      ry += ROW_H;
    }
    y += boxH + 6;
  }

  // ═══════════════════════════════════════════════
  // PARSE LETTER
  // ═══════════════════════════════════════════════
  const rawParas = letter.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const rawSubj  = rawParas.find(p => /^re:/i.test(p));
  const nonSubj  = rawParas.filter(p => !/^re:/i.test(p));
  const signoffI = nonSubj.findIndex(p => /^(sincerely|yours (faithfully|sincerely|truly))/i.test(p));
  const bodyParas = signoffI >= 0 ? nonSubj.slice(0, signoffI) : nonSubj;
  const signoffPara = signoffI >= 0 ? nonSubj[signoffI] : 'Sincerely,';

  const aInfo      = getAirlineInfo(claimData?.flightNumber);
  const airlineName = aInfo?.name || 'The Airline';
  const regulation  = result?.regulation || 'EU261';
  const compAmount  = result?.compensation?.amount || '';
  const senderName  = details?.name  || '';
  const senderEmail = details?.email || '';

  // ═══════════════════════════════════════════════
  // PAGE 1
  // ═══════════════════════════════════════════════
  drawPageHeader();
  y = CONTENT_Y;

  // ── Recipient address ──
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
  doc.text('Customer Relations / Claims Department', ML, y); y += 5;
  doc.text(airlineName, ML, y); y += 8;

  // ── Subject line ──
  const subjCore = rawSubj
    ? rawSubj.replace(/^re:\s*/i, '')
    : `Flight ${claimData?.flightNumber || ''} — Formal ${regulation} compensation claim`;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setTC(C.TEXT_PRI);
  const subjLines = doc.splitTextToSize(`Re: ${subjCore}`, CONTENT_W);
  for (const sl of subjLines) { doc.text(sl, ML, y); y += 6.5; }
  y += 0.5;
  setDC(C.BRAND_BLUE); doc.setLineWidth(0.7);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 7;

  // ── Opening paragraph ──
  if (bodyParas.length > 0) renderPara(bodyParas[0]);

  // ── FLIGHT DETAILS section ──
  drawSection('FLIGHT DETAILS');
  const flightRows = [
    claimData?.flightNumber            && ['Flight number',    claimData.flightNumber],
    claimData?.flightDate              && ['Date of travel',   claimData.flightDate],
    (claimData?.from && claimData?.to) && ['Route', `${claimData.from} → ${claimData.to}`],
    result?.distanceKm                 && ['Distance',         `${result.distanceKm.toLocaleString()} km`],
    senderName                         && ['Passenger name',   senderName],
  ].filter(Boolean);
  drawTableBox(flightRows);

  // ── LEGAL BASIS section + remaining letter body ──
  if (bodyParas.length > 1) {
    drawSection('LEGAL BASIS');
    for (const para of bodyParas.slice(1)) renderPara(para);
  }

  // ── AMOUNT DUE section ──
  if (compAmount) {
    const articleLabel = result?.compensation?.article
      ? `AMOUNT DUE — ${result.compensation.article.toUpperCase()}`
      : 'AMOUNT DUE — ARTICLE 7';
    drawSection(articleLabel);
    const ABOX_H = 20;
    checkPage(ABOX_H + 6);
    setFC(C.LT_BLUE_BG); setDC(C.LT_BLUE_BD); doc.setLineWidth(1);
    if (doc.roundedRect) doc.roundedRect(ML, y, CONTENT_W, ABOX_H, 4, 4, 'FD');
    else doc.rect(ML, y, CONTENT_W, ABOX_H, 'FD');
    // Large amount
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24); setTC(C.DARK_BLUE);
    doc.text(compAmount, ML + 5, y + 13);
    // Label below
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setTC(C.ACCENT_BLUE);
    doc.text('Compensation claimed', ML + 5, y + 18.5);
    // Badge right
    const BW = 40, BH = 7, BX = PAGE_W - MR - BW - 2, BY = y + (ABOX_H - BH) / 2;
    setFC(C.DARK_BLUE);
    if (doc.roundedRect) doc.roundedRect(BX, BY, BW, BH, 2, 2, 'F');
    else doc.rect(BX, BY, BW, BH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); setTC(C.WHITE);
    doc.text('LEGALLY ENTITLED', BX + BW / 2, BY + 4.8, { align: 'center' });
    y += ABOX_H + 6;
  }

  // ═══════════════════════════════════════════════
  // PAGE 2
  // ═══════════════════════════════════════════════
  if (pageNum === 1) newPage(); // ensure formal sections always on page 2+

  // ── FORMAL REQUEST section ──
  drawSection('FORMAL REQUEST & PAYMENT DETAILS');
  const reqText = `I formally request that ${airlineName} process this claim and remit the applicable compensation to the passenger at the contact details below within the statutory timeframe.`;
  renderPara(reqText);

  const passengerRows = [
    senderName  && ['Passenger name', senderName],
    senderEmail && ['Email address',  senderEmail],
  ].filter(Boolean);
  drawTableBox(passengerRows);

  // ── RESPONSE DEADLINE section (RED) ──
  y += 4;
  drawSection('RESPONSE DEADLINE', true);

  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 14);
  const deadlineDateStr = deadlineDate.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const regFull = regulation === 'UK261'
    ? 'the UK Civil Aviation Act 2006'
    : 'EU Regulation 261/2004';
  const deadlineText = `Under ${regFull}, you are required to respond to this formal claim within 14 days of receipt. I require your written response no later than ${deadlineDateStr}. Failure to respond or an unsatisfactory response may result in escalation to the relevant National Enforcement Body and, if necessary, legal proceedings.`;

  const escDeadline = deadlineDateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  renderSegs(buildSegs(deadlineText, [
    { re: new RegExp(escDeadline, 'g'), bold:true, color:C.RED },
  ]));

  // ── Closing & sign-off ──
  y += 2;
  renderPara('I trust you will handle this claim promptly and in accordance with your statutory obligations.');

  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_BODY);
  checkPage(); doc.text('Sincerely,', ML, y); y += 15;

  if (senderName) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_PRI);
    checkPage(); doc.text(senderName, ML, y); y += LINE_H;
  }
  if (senderEmail) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
    checkPage(); doc.text(senderEmail, ML, y); y += LINE_H;
  }
  const signDate = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
  checkPage(); doc.text(signDate, ML, y);

  // ── Finalise ──
  drawFooter();
  doc.putTotalPages(TOTAL_ALIAS);
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

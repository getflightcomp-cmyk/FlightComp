import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getAirlineContact, getEscalationAuthority, getResponseDeadlineDays } from '../lib/airline-contacts';
import { tryResolveAirport } from '../lib/eu261';

/* ══════════════════════════════════════════════════════
   Success page — shown after Stripe payment completes
   Flow: loading → collect (extra details) → generating → ready
══════════════════════════════════════════════════════ */

// ── Inline segment parser (on-screen preview) ─────────
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

// ── Post-payment extra details form ───────────────────
function FlightDetailsForm({ claimData, result, onSubmit }) {
  const [scheduledTime, setScheduledTime] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isDelay = claimData?.disruption === 'delayed';

  async function handleSubmit() {
    setLoading(true);
    await onSubmit({ scheduledTime, actualTime, incidentDescription });
  }

  return (
    <div className="details-screen">
      <div className="details-body">
        <div>
          <div className="q-label">One more step</div>
          <h2 className="q-head" style={{ fontSize: 22 }}>Add flight timing details</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            These details help us write a more specific letter that&apos;s harder for airlines to dismiss.
            All fields are optional.
          </p>
        </div>

        {isDelay && (
          <>
            <div className="field-group">
              <label className="field-label">Scheduled arrival time</label>
              <input
                className="field-input"
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
              />
              <span className="field-hint">The time your flight was supposed to arrive.</span>
            </div>

            <div className="field-group">
              <label className="field-label">Actual arrival time</label>
              <input
                className="field-input"
                type="time"
                value={actualTime}
                onChange={e => setActualTime(e.target.value)}
              />
              <span className="field-hint">The time your flight actually landed or docked at the gate.</span>
            </div>
          </>
        )}

        <div className="field-group">
          <label className="field-label">Brief description of what happened</label>
          <textarea
            className="field-textarea"
            placeholder="e.g., Flight was delayed on the tarmac for 2 hours due to mechanical issue. No communication from crew for first 45 minutes."
            value={incidentDescription}
            onChange={e => setIncidentDescription(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <span className="field-hint">2–3 sentences. Used in your letter for specific, factual language.</span>
        </div>

        <button
          className="btn-pay"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate My Flight Compensation Kit →'}
        </button>
        <div className="secure-note">Takes about 15 seconds · All 6 documents included</div>
      </div>
    </div>
  );
}

// ── PDF text sanitizer ────────────────────────────────
// jsPDF uses Windows-1252 encoding; sanitize chars outside that range.
function sanitizePdf(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    // Arrow characters (not in Windows-1252)
    .replace(/→/g, ' to ')
    .replace(/←/g, ' from ')
    // Turkish non-Latin-1 characters
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    // Curly quotes → straight quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // En/em dashes
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--');
}

// ── Delay duration formatter ───────────────────────────
function calcDelay(scheduled, actual) {
  if (!scheduled || !actual) return null;
  const [sh, sm] = scheduled.split(':').map(Number);
  const [ah, am] = actual.split(':').map(Number);
  let mins = (ah * 60 + am) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { mins, h, m, label: h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m` };
}

// ── Unicode font loader (DejaVu Sans supports Turkish + all Latin Extended) ──
async function loadUnicodeFont(doc) {
  try {
    const toB64 = async (url) => {
      const r = await fetch(url);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 8192)
        bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
      return btoa(bin);
    };
    const [regB64, boldB64] = await Promise.all([
      toB64('https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'),
      toB64('https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'),
    ]);
    if (!regB64 || !boldB64) return false;
    doc.addFileToVFS('DejaVuSans.ttf', regB64);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFileToVFS('DejaVuSans-Bold.ttf', boldB64);
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
    return true;
  } catch {
    return false;
  }
}

// ── PDF Claim Kit builder ─────────────────────────────
async function buildPdf({ letter, claimData, details, result, flightDetails }) {
  const { jsPDF } = await import('jspdf');

  // ── Layout constants ──
  const PAGE_W = 210, PAGE_H = 297;
  const ML = 25, MR = 25;
  const CONTENT_W = PAGE_W - ML - MR;
  const HEADER_H  = 18;
  const CONTENT_Y = HEADER_H + 20;
  const FOOTER_Y  = 280;
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
    GREEN:        [22, 163, 74],
    GREEN_BG:     [220, 252, 231],
    RED:          [220, 38, 38],
    RED_DARK:     [163, 45, 45],
    ORANGE:       [234, 88, 12],
    WHITE:        [255, 255, 255],
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Patch doc.text and doc.splitTextToSize to auto-sanitize non-Latin-1 characters
  // (handles →, Turkish ı/ğ/ş, curly quotes, etc.)
  const _origText  = doc.text.bind(doc);
  const _origSplit = doc.splitTextToSize.bind(doc);
  doc.text = (text, ...args) => {
    if (typeof text === 'string') text = sanitizePdf(text);
    else if (Array.isArray(text)) text = text.map(t => typeof t === 'string' ? sanitizePdf(t) : t);
    return _origText(text, ...args);
  };
  doc.splitTextToSize = (text, maxWidth, opts) =>
    _origSplit(typeof text === 'string' ? sanitizePdf(text) : text, maxWidth, opts);

  // Load DejaVu Sans for proper Unicode rendering (Turkish chars, etc.)
  const unicodeFontsLoaded = await loadUnicodeFont(doc);
  if (unicodeFontsLoaded) {
    const _origSetFont = doc.setFont.bind(doc);
    doc.setFont = (family, style, ...args) => {
      const f = (family === 'helvetica' || family === 'Helvetica') ? 'DejaVuSans' : family;
      return _origSetFont(f, style || 'normal', ...args);
    };
  }

  const TOTAL_ALIAS = '{totalPages}';
  let pageNum = 1;
  let y = 0;
  let sectionSubtitle = ''; // cover page: no subtitle; set by newPage() for inner pages

  const setTC = c => doc.setTextColor(...c);
  const setFC = c => doc.setFillColor(...c);
  const setDC = c => doc.setDrawColor(...c);
  const rnd = (x, yy, w, h) =>
    (doc.roundedRect ? doc.roundedRect(x, yy, w, h, 3, 3, 'FD') : doc.rect(x, yy, w, h, 'FD'));

  // ── Page header ──
  function drawPageHeader() {
    setFC(C.BRAND_BLUE);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setTC(C.WHITE);
    doc.text('Flight Compensation Kit', ML, 11.5);
    if (sectionSubtitle) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.setTextColor(195, 219, 248);
      doc.text(sectionSubtitle, ML, HEADER_H - 3);
    }
  }

  // ── Page footer ──
  function drawFooter(branded = false) {
    setDC(C.GRAY_BD); doc.setLineWidth(0.3);
    doc.line(ML, FOOTER_Y, PAGE_W - MR, FOOTER_Y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setTC(C.TEXT_MUTED);
    if (branded) {
      doc.text('Prepared with FlightComp — getflightcomp.com', ML, FOOTER_Y + 5);
    }
    doc.text(`Page ${pageNum} of ${TOTAL_ALIAS}`, PAGE_W - MR, FOOTER_Y + 5, { align: 'right' });
  }

  // ── New page ──
  function newPage() {
    drawFooter(false);
    doc.addPage();
    pageNum++;
    sectionSubtitle = regHeaderText;
    drawPageHeader();
    y = CONTENT_Y;
  }

  // ── Page-break guard ──
  function checkPage(needed = LINE_H) {
    if (y + needed > FOOTER_Y - 5) newPage();
  }

  // ── Section header ──
  function drawSection(title, accent = C.DARK_BLUE, lineColor = C.BRAND_BLUE) {
    checkPage(14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    setTC(accent);
    doc.text(title, ML, y); y += 3.5;
    setDC(lineColor); doc.setLineWidth(0.7);
    doc.line(ML, y, PAGE_W - MR, y); y += 5;
  }

  // ── Inline segment builder ──
  function buildSegs(text, extraPats = []) {
    const pats = [
      { re: /(?:€|£|CA\$)\s*[\d,]+/gi,                                      bold: true,  color: C.TEXT_BODY },
      { re: /(?:EU|UK|EC)\s*(?:Regulation\s*)?261(?:\/2004)?/gi,             bold: true,  color: C.TEXT_BODY },
      { re: /within\s+14\s+days?|14[\s-]days?/gi,                            bold: true,  color: C.RED       },
      { re: /within\s+30\s+days?|30[\s-]days?/gi,                            bold: true,  color: C.ORANGE    },
      ...extraPats,
    ];
    const hits = [];
    for (const { re, bold, color } of pats) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text)) !== null)
        hits.push({ start: m.index, end: m.index + m[0].length, bold, color });
    }
    hits.sort((a, b) => a.start - b.start);
    const clean = []; let cur = 0;
    for (const h of hits) { if (h.start >= cur) { clean.push(h); cur = h.end; } }
    const segs = []; cur = 0;
    for (const h of clean) {
      if (h.start > cur) segs.push({ text: text.slice(cur, h.start), bold: false, color: C.TEXT_BODY });
      segs.push({ text: text.slice(h.start, h.end), bold: h.bold, color: h.color });
      cur = h.end;
    }
    if (cur < text.length) segs.push({ text: text.slice(cur), bold: false, color: C.TEXT_BODY });
    return segs;
  }

  // ── Word-wrapped paragraph renderer ──
  function renderSegs(segs, { lh = LINE_H, gap = PARA_GAP, size = BODY_SIZE } = {}) {
    const tokens = [];
    for (const seg of segs) {
      for (const part of seg.text.split(/(\s+)/)) {
        if (part) tokens.push({ text: part, bold: seg.bold, color: seg.color });
      }
    }
    const lines = []; let curLine = { toks: [], w: 0 };
    for (const tok of tokens) {
      doc.setFont('helvetica', tok.bold ? 'bold' : 'normal'); doc.setFontSize(size);
      const tw = doc.getTextWidth(tok.text);
      const ws = /^\s+$/.test(tok.text);
      if (!ws && curLine.w + tw > CONTENT_W && curLine.toks.length > 0) {
        lines.push(curLine); curLine = { toks: [], w: 0 };
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
        setTC(tok.color);
        doc.text(tok.text, lx, y);
        lx += doc.getTextWidth(tok.text);
      }
      y += lh;
    }
    y += gap;
  }

  const renderPara = (text, opts) => renderSegs(buildSegs(text), opts);

  function renderBold(text, opts) {
    renderSegs([{ text, bold: true, color: C.TEXT_PRI }], opts);
  }

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

  // ── Contact info box ──
  function drawContactBox(contact) {
    const lines = [];
    if (contact.claimsEmail) lines.push(['Email', contact.claimsEmail]);
    if (contact.claimsFormUrl) lines.push(['Online form', contact.claimsFormUrl]);
    if (contact.mailingAddress) lines.push(['Post', contact.mailingAddress]);
    if (!lines.length) return;
    const ROW_H = 7, PAD = 4;
    const boxH = PAD * 2 + lines.length * ROW_H + 2;
    checkPage(boxH + 4);
    setFC(C.LT_BLUE_BG); setDC(C.LT_BLUE_BD); doc.setLineWidth(0.5);
    rnd(ML, y, CONTENT_W, boxH);
    let ry = y + PAD + 4;
    for (const [label, value] of lines) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setTC(C.DARK_BLUE);
      doc.text(label + ':', ML + PAD, ry);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setTC(C.TEXT_BODY);
      const labelW = doc.getTextWidth(label + ': ') + 2;
      const valLines = doc.splitTextToSize(value, CONTENT_W - labelW - PAD * 2);
      doc.text(valLines[0], ML + PAD + labelW, ry);
      ry += ROW_H;
    }
    y += boxH + 6;
  }

  // ── Numbered step ──
  function drawStep(num, text, size = BODY_SIZE) {
    checkPage(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(size); setTC(C.DARK_BLUE);
    doc.text(`${num}.`, ML, y);
    doc.setFont('helvetica', 'normal'); setTC(C.TEXT_BODY);
    const wrapped = doc.splitTextToSize(text, CONTENT_W - 8);
    doc.text(wrapped, ML + 8, y);
    y += wrapped.length * (size * 0.4) + 4;
  }

  // ── Template letter box ──
  function drawTemplateLetter(paragraphs) {
    const PAD = 5;
    // First measure height
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    let totalH = PAD * 2;
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, CONTENT_W - PAD * 2 - 4);
      totalH += lines.length * 4.5 + 3;
    }
    checkPage(Math.min(totalH, 60));
    setFC(C.GRAY_BG); setDC(C.GRAY_BD); doc.setLineWidth(0.5);
    // Draw box (approximate — content may overflow to new page)
    doc.rect(ML, y, CONTENT_W, Math.min(totalH, FOOTER_Y - y - 10), 'FD');
    y += PAD;
    for (const para of paragraphs) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_BODY);
      const lines = doc.splitTextToSize(para, CONTENT_W - PAD * 2 - 4);
      for (const line of lines) {
        checkPage(4.5);
        doc.text(line, ML + PAD, y);
        y += 4.5;
      }
      y += 3;
    }
    y += PAD;
  }

  // ── Callout box (tinted) ──
  function drawCallout(text, color = C.LT_BLUE_BG, borderColor = C.LT_BLUE_BD) {
    const PAD = 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, CONTENT_W - PAD * 2 - 4);
    const boxH = PAD * 2 + lines.length * 4.5;
    checkPage(boxH + 4);
    setFC(color); setDC(borderColor); doc.setLineWidth(0.5);
    rnd(ML, y, CONTENT_W, boxH);
    let ty = y + PAD + 3.5;
    setTC(C.TEXT_BODY);
    for (const line of lines) {
      doc.text(line, ML + PAD + 2, ty);
      ty += 4.5;
    }
    y += boxH + 5;
  }

  // ═══════════════════════════════════════════════
  // PARSE & COMMON DATA
  // ═══════════════════════════════════════════════
  const rawParas    = letter.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const rawSubj     = rawParas.find(p => /^re:/i.test(p));
  const nonSubj     = rawParas.filter(p => !/^re:/i.test(p));
  const signoffI    = nonSubj.findIndex(p => /^(sincerely|yours (faithfully|sincerely|truly))/i.test(p));
  const bodyParas   = signoffI >= 0 ? nonSubj.slice(0, signoffI) : nonSubj;

  const regulation   = result?.regulation || 'EU261';
  const compAmount   = result?.compensation?.amount || '';
  const senderName   = details?.name  || '';
  const senderEmail  = details?.email || '';
  const flightNum    = claimData?.flightNumber || '';
  const flightDate   = claimData?.flightDate   || '';
  const fromCode     = claimData?.from || '';
  const toCode       = claimData?.to   || '';

  // Airline contact lookup — prefer airlineCode, fall back to flight number prefix
  const airlineIATA   = claimData?.airlineCode || flightNum.trim().toUpperCase().replace(/\s/g, '').slice(0, 2);
  const airlineContact = getAirlineContact(airlineIATA);
  const airlineName   = airlineContact?.name || 'The Airline';
  const escalation    = getEscalationAuthority(regulation, result?.depInfo);
  const deadlineDays  = getResponseDeadlineDays(regulation);

  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);
  const deadlineDateStr = deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 14);
  const followUpDateStr = followUpDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const escalationDate = new Date();
  escalationDate.setDate(escalationDate.getDate() + 30);
  const escalationDateStr = escalationDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const regFull =
    regulation === 'UK261' ? 'UK261/2004'
    : regulation === 'APPR' ? 'Canada APPR (SOR/2019-150)'
    : regulation === 'SHY'  ? 'Turkey SHY'
    : 'EU Regulation 261/2004';

  // Dynamic header subtitle (shown on all non-cover pages)
  const regHeaderText =
    regulation === 'UK261' ? 'UK Regulation 261'
    : regulation === 'APPR' ? 'Canadian Air Passenger Protection Regulations (APPR)'
    : regulation === 'SHY'  ? 'Turkey SHY Passenger Rights Regulation'
    : 'EU Regulation 261/2004';

  // Resolve route to IATA codes for display
  const resolveCode = (raw) => {
    if (!raw) return raw;
    const t = raw.trim();
    if (/^[A-Z]{3}$/i.test(t)) return t.toUpperCase();
    return tryResolveAirport(t) || t;
  };
  const fromIATA = resolveCode(fromCode);
  const toIATA   = resolveCode(toCode);

  const delayInfo = calcDelay(flightDetails?.scheduledTime, flightDetails?.actualTime);

  // Format any date string (YYYY-MM-DD or similar) as "15 March 2026"
  const fmtDate = (dateStr) => {
    if (!dateStr) return dateStr;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const flightDateFmt = fmtDate(flightDate);

  // ═══════════════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════════════
  // Draw cover header with regulation subtitle
  sectionSubtitle = regHeaderText;
  drawPageHeader();
  y = CONTENT_Y;

  // Title block
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); setTC(C.TEXT_PRI);
  doc.text('Claims Overview', ML, y); y += 9;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); setTC(C.TEXT_LABEL);
  doc.text('A summary of your claim details and what to expect.', ML, y); y += 10;

  // Claim summary box
  const SUMBOX_H = 36;
  setFC(C.LT_BLUE_BG); setDC(C.LT_BLUE_BD); doc.setLineWidth(1);
  if (doc.roundedRect) doc.roundedRect(ML, y, CONTENT_W, SUMBOX_H, 4, 4, 'FD');
  else doc.rect(ML, y, CONTENT_W, SUMBOX_H, 'FD');

  const col1 = ML + 5, col2 = ML + CONTENT_W / 2;
  let bly = y + 8;
  const drawSumRow = (label, value, cx) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setTC(C.ACCENT_BLUE);
    doc.text(label.toUpperCase(), cx, bly);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setTC(C.DARK_BLUE);
    doc.text(value || '—', cx, bly + 5);
  };
  drawSumRow('Regulation', regFull, col1);
  drawSumRow('Target Compensation', compAmount || 'See letter', col2);
  bly += 16;
  drawSumRow('Flight', flightNum || '—', col1);
  drawSumRow('Date', flightDateFmt || '—', col2);
  y += SUMBOX_H + 8;

  // "This kit contains" list
  drawSection('THIS KIT CONTAINS');
  const kitItems = [
    ['1', 'How to Submit Your Claim — airline contact details and step-by-step instructions'],
    ['2', 'Formal Compensation Claim Letter — personalised, ready to send'],
    ['3', '14-Day Follow-Up Template — if the airline hasn\'t responded after 2 weeks'],
    ['4', '30-Day Escalation Template — if the airline rejects or ignores your claim'],
    ['5', 'What to Expect Guide — common airline responses and how to handle them'],
  ];
  for (const [num, desc] of kitItems) {
    checkPage(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setTC(C.BRAND_BLUE);
    doc.text(num, ML + 1, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
    doc.text(desc, ML + 8, y);
    y += 7;
  }
  y += 4;

  // Quick-start callout
  checkPage(24);
  setFC([237, 253, 245]); setDC([134, 239, 172]); doc.setLineWidth(0.7);
  if (doc.roundedRect) doc.roundedRect(ML, y, CONTENT_W, 22, 3, 3, 'FD');
  else doc.rect(ML, y, CONTENT_W, 22, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setTC(C.GREEN);
  doc.text('QUICK START', ML + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_BODY);
  const qs = airlineContact?.claimsEmail
    ? `Send the Formal Compensation Claim Letter to ${airlineContact.claimsEmail}`
    : `Submit via the airline's online claims form — see How to Submit Your Claim section.`;
  const qsLines = doc.splitTextToSize(qs, CONTENT_W - 10);
  doc.text(qsLines, ML + 5, y + 13);
  y += 26;

  // ═══════════════════════════════════════════════
  // PAGE 2 — HOW TO SUBMIT YOUR CLAIM
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text('How to Submit Your Claim', ML, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_LABEL);
  doc.text(`Airline: ${airlineName}  \u00B7  Regulation: ${regFull}`, ML, y); y += 10;

  // Contact block
  drawSection('AIRLINE CONTACT DETAILS');
  if (airlineContact) {
    drawContactBox(airlineContact);
  } else {
    renderPara(`We don't have specific contact details for ${airlineName} on file. Search "[airline name] EU261 claim" or "[airline name] customer relations" to find the correct contact.`);
  }

  // Step-by-step
  drawSection('STEP-BY-STEP INSTRUCTIONS');
  const subSteps = [
    `Send the Formal Compensation Claim Letter (next section) to ${airlineName} using the contact details above. Email is fastest; post requires proof of delivery.`,
    'Keep a copy of everything you send and note today\'s date as your submission date.',
    `The airline has ${deadlineDays} days to respond under ${regFull}. Mark your calendar for ${deadlineDateStr}.`,
    `If you don't receive a response by ${followUpDateStr}, send the 14-Day Follow-Up Template included in this kit.`,
    `If the airline rejects your claim or you receive no satisfactory response by ${escalationDateStr}, send the 30-Day Escalation Template and file a complaint with ${escalation.name}.`,
  ];
  subSteps.forEach((step, i) => drawStep(i + 1, step));

  y += 4;
  drawSection('ESCALATION AUTHORITY');
  renderPara(`If the airline does not resolve your claim, file a free complaint with:`);
  {
    const PAD = 4;
    const nameWrapped = doc.splitTextToSize(escalation.name, CONTENT_W - PAD * 2);
    const boxH = PAD * 2 + nameWrapped.length * 5.5 + 2;
    checkPage(boxH + 4);
    setFC(C.LT_BLUE_BG); setDC(C.LT_BLUE_BD); doc.setLineWidth(0.5);
    rnd(ML, y, CONTENT_W, boxH);
    let ry = y + PAD + 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setTC(C.DARK_BLUE);
    for (const nl of nameWrapped) { doc.text(nl, ML + PAD, ry); ry += 5.5; }
    y += boxH + 6;
  }
  if (escalation.note) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
    const noteLines = doc.splitTextToSize(escalation.note, CONTENT_W);
    for (const nl of noteLines) { checkPage(); doc.text(nl, ML, y); y += 4.5; }
    y += 3;
  }

  // ═══════════════════════════════════════════════
  // PAGE 3 — CLAIM LETTER
  // ═══════════════════════════════════════════════
  newPage();

  // Section title + instruction (Change 4a + 4b)
  drawSection('FORMAL COMPENSATION CLAIM LETTER');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
  doc.text('Send this letter to your airline\'s claims department via email. Keep a copy for your records.', ML, y); y += 9;

  // Gray shading behind letter body (Change 4c)
  const LPAD = 4;
  setFC(C.GRAY_BG); setDC(C.GRAY_BD); doc.setLineWidth(0.5);
  doc.rect(ML - LPAD, y - 1, CONTENT_W + LPAD * 2, FOOTER_Y - y - 5, 'FD');
  y += LPAD + 1;

  // Sender contact block — appears once (Change 5, item 1)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
  if (senderName) { checkPage(); doc.text(senderName, ML, y); y += LINE_H; }
  if (details?.address) {
    const addrLines = doc.splitTextToSize(details.address, CONTENT_W / 2);
    for (const l of addrLines) { checkPage(); doc.text(l, ML, y); y += LINE_H; }
  }
  if (senderEmail) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
    checkPage(); doc.text(senderEmail, ML, y); y += LINE_H;
  }
  if (senderName || details?.address || senderEmail) y += 4;

  // Date — appears once (Change 5, item 2)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
  checkPage(); doc.text(todayStr, ML, y); y += 8;

  // Recipient address — appears once (Change 5, item 3)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
  doc.text('Customer Relations / Claims Department', ML, y); y += 5;
  doc.text(airlineName, ML, y); y += 8;

  // Subject line — fixed format with named-month flight date (Change 5, item 4)
  const subjLine = `Re: Flight ${flightNum} on ${flightDateFmt} — Compensation Claim under ${regFull}`;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setTC(C.TEXT_PRI);
  const subjLines = doc.splitTextToSize(subjLine, CONTENT_W);
  for (const sl of subjLines) { doc.text(sl, ML, y); y += 6.5; }
  y += 0.5;
  setDC(C.BRAND_BLUE); doc.setLineWidth(0.7);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 7;

  // Salutation (Change 5, item 5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_BODY);
  checkPage(); doc.text('To whom it may concern,', ML, y); y += 8;

  // Filter body paragraphs — skip any that duplicate header/salutation (Change 5)
  const filteredBodyParas = bodyParas.filter(p => {
    if (/^dear\s/i.test(p)) return false;
    if (/^customer relations/i.test(p)) return false;
    if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(p.trim())) return false;
    return true;
  });

  // Letter body (Change 5, item 6)
  if (filteredBodyParas.length > 0) renderPara(filteredBodyParas[0]);

  // Flight details table
  drawSection('FLIGHT DETAILS');
  const flightRows = [
    flightNum                               && ['Flight number',    flightNum],
    flightDate                              && ['Date of travel',   flightDateFmt],
    (fromIATA && toIATA)                    && ['Route',            `${fromIATA} to ${toIATA}`],
    result?.distanceKm                      && ['Distance',         `${result.distanceKm.toLocaleString()} km`],
    flightDetails?.scheduledTime            && ['Scheduled arrival', flightDetails.scheduledTime],
    flightDetails?.actualTime               && ['Actual arrival',   flightDetails.actualTime],
    delayInfo                               && ['Delay duration',   delayInfo.label],
  ].filter(Boolean);
  drawTableBox(flightRows);

  // Legal basis + rest of letter body
  if (filteredBodyParas.length > 1) {
    drawSection('LEGAL BASIS & CLAIM');
    for (const para of filteredBodyParas.slice(1)) renderPara(para);
  }

  // Closing — payment request with deadline date in red
  y += 4;
  renderSegs([
    { text: `I request that you process this compensation claim and provide payment within ${deadlineDays} days of this letter `, bold: false, color: C.TEXT_BODY },
    { text: `(${deadlineDateStr})`, bold: true, color: C.RED },
    { text: '.', bold: false, color: C.TEXT_BODY },
  ]);
  renderPara('I trust you will handle this claim promptly and in accordance with your statutory obligations.');
  y += 2;

  // Sign-off — sender name + email only; no duplicate date (Change 5, item 7)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_BODY);
  checkPage(); doc.text('Sincerely,', ML, y); y += 14;
  if (senderName) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_PRI);
    checkPage(); doc.text(senderName, ML, y); y += LINE_H;
  }
  if (senderEmail) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
    checkPage(); doc.text(senderEmail, ML, y); y += LINE_H;
  }

  // ═══════════════════════════════════════════════
  // 14-DAY FOLLOW-UP PAGE
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text('14-Day Follow-Up Template', ML, y); y += 8;

  drawCallout(
    `Send this follow-up if you have not received a response by ${followUpDateStr} (14 days after your original submission).`,
    C.LT_BLUE_BG, C.LT_BLUE_BD
  );

  drawSection('FOLLOW-UP LETTER');
  drawTemplateLetter([
    followUpDateStr,
    '',
    'Customer Relations Department',
    airlineName,
    '',
    `Re: Follow-Up — Compensation Claim for Flight ${flightNum} on ${flightDateFmt}`,
    '',
    `Dear Sir or Madam,`,
    '',
    `I am writing to follow up on a formal compensation claim I submitted on ${todayStr} regarding flight ${flightNum} on ${flightDateFmt} from ${fromIATA} to ${toIATA}.`,
    '',
    `I have not yet received a response or acknowledgement of my claim. Under ${regFull}, airlines are required to respond to passenger compensation claims within a reasonable timeframe. I submitted my original claim 14 days ago and have still not received a substantive reply.`,
    '',
    `I kindly request that you acknowledge receipt of my original claim and provide a written update on its status within 7 days of this letter.`,
    '',
    `If I do not receive a response, I will escalate this matter to the ${escalation.name}.`,
    '',
    'Sincerely,',
    senderName || '[Your full name]',
    senderEmail || '[Your email]',
  ].filter(s => s !== null));

  y += 4;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); setTC(C.TEXT_MUTED);
  doc.text('Note: Update the submission date if you are sending this at a different time.', ML, y); y += 8;

  // ═══════════════════════════════════════════════
  // 30-DAY ESCALATION PAGE
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text('30-Day Escalation Template', ML, y); y += 8;

  drawCallout(
    `Send this escalation letter if you have not received a satisfactory response by ${escalationDateStr} (30 days after your original submission).`,
    [255, 247, 237], [254, 215, 170]
  );

  drawSection('ESCALATION LETTER');
  drawTemplateLetter([
    escalationDateStr,
    '',
    'Customer Relations Department',
    airlineName,
    '',
    `Re: Escalation Notice — Unanswered Compensation Claim for Flight ${flightNum} on ${flightDateFmt}`,
    '',
    'Dear Sir or Madam,',
    '',
    `I am writing to formally escalate my compensation claim regarding flight ${flightNum} on ${flightDateFmt} from ${fromIATA} to ${toIATA}.`,
    '',
    `I submitted a formal claim on ${todayStr} under ${regFull}. As of the date of this letter, I have not received a substantive response or resolution.`,
    '',
    compAmount
      ? `Under ${regFull}, I am legally entitled to compensation of ${compAmount} per passenger. This amount remains outstanding.`
      : `Under ${regFull}, I am legally entitled to compensation for the disruption experienced. This remains outstanding.`,
    '',
    `I require a full written response within 14 days of this letter. If I do not receive a satisfactory resolution, I will immediately file a formal complaint with the ${escalation.name} and reserve all rights to pursue further legal remedies, including proceedings in the relevant small claims court.`,
    '',
    'Sincerely,',
    senderName || '[Your full name]',
    senderEmail || '[Your email]',
  ].filter(s => s !== null));

  y += 4;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); setTC(C.TEXT_MUTED);
  doc.text('Note: Update the original claim submission date before sending.', ML, y); y += 8;

  // ═══════════════════════════════════════════════
  // WHAT TO EXPECT PAGE
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text('What to Expect After Submitting Your Claim', ML, y); y += 10;

  drawSection('TYPICAL TIMELINE');
  const timeline = [
    '1–3 days: Acknowledge receipt (most airlines, if you email).',
    '14–30 days: Initial response — may be an offer, a rejection, or a request for more information.',
    '30–60 days: Full resolution for straightforward claims.',
    '60–90 days: More complex cases, or airlines that are slow to respond.',
    '90+ days: Escalate to the relevant authority — do not wait longer than this.',
  ];
  for (const t of timeline) renderPara(t, { gap: 3 });
  y += 3;

  drawSection('COMMON AIRLINE RESPONSES');
  const responses = [
    ['"Extraordinary circumstances" or "force majeure"',
     'Airlines frequently use this defense. If the actual cause was mechanical, crew-related, or operational, this defense does not apply. Respond in writing citing the specific cause and stating it does not meet the legal definition of extraordinary circumstances.'],
    ['"We need more information"',
     'Respond promptly with any documents requested — booking confirmation, boarding passes, correspondence. Keep copies of everything you send.'],
    ['"Your claim is rejected"',
     'Do not accept a rejection without a written explanation citing specific legal grounds. Use the 30-day escalation template (page 5) and file with the relevant authority.'],
    ['No response after 14 days',
     'Send the 14-day follow-up template (page 4). If still no response after 30 days total, send the escalation template and file with the authority below.'],
    ['"We offer you a voucher instead"',
     'You are not obliged to accept a voucher. Under EU261/UK261/APPR, you are entitled to cash compensation. Reply in writing that you do not accept the voucher and require cash payment.'],
  ];
  for (const [heading, detail] of responses) {
    checkPage(20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setTC(C.DARK_BLUE);
    const headLines = doc.splitTextToSize(heading, CONTENT_W);
    doc.text(headLines, ML, y); y += headLines.length * 4.5 + 1;
    renderPara(detail, { gap: 6 });
  }

  drawSection('YOUR ESCALATION PATH');
  drawStep(1, `Send your Formal Compensation Claim Letter to ${airlineName} using the contact details in the How to Submit section.`);
  drawStep(2, `If no response in 14 days, send the 14-Day Follow-Up Template included in this kit.`);
  drawStep(3, `If no resolution in 30 days, send the 30-Day Escalation Template and file with ${escalation.name}.`);
  drawStep(4, `If the authority doesn't resolve it within 8 weeks, consider Alternative Dispute Resolution (ADR) or small claims court.`);

  y += 3;
  drawCallout(
    'Small claims court is a viable option in most jurisdictions for claims of this size and does not require a solicitor. Filing fees are typically £30–£100 (UK), €25–€75 (EU), or CA$75–$200 (Canada).',
    C.GRAY_BG, C.GRAY_BD
  );

  // ── Final branded footer on last page ──
  drawFooter(true);
  doc.putTotalPages(TOTAL_ALIAS);
  return doc;
}

// ═══════════════════════════════════════════════
// Main page component
// ═══════════════════════════════════════════════
export default function Success() {
  const router = useRouter();
  // 'loading' | 'collect' | 'generating' | 'ready' | 'error'
  const [state, setState] = useState('loading');
  const [letter, setLetter] = useState('');
  const [claimData, setClaimData] = useState(null);
  const [details, setDetails] = useState(null);
  const [result, setResult] = useState(null);
  const [flightDetails, setFlightDetails] = useState({ scheduledTime: '', actualTime: '', incidentDescription: '' });
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const hasFetched = useRef(false);

  // Load claim data from sessionStorage, then prompt for extra details
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
    setState('collect');
  }, []);

  // Called when user submits extra details form
  async function handleGenerate(extraDetails) {
    setFlightDetails(extraDetails);
    setState('generating');
    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: claimData,
          result,
          details,
          flightDetails: extraDetails,
        }),
      });
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setLetter(json.letter);
      setState('ready');
      sessionStorage.removeItem('fc_claim');
      // Save purchase record for 30-day follow-up cron (fire-and-forget)
      fetch('/api/save-kit-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: claimData, result, details }),
      }).catch(() => {});
    } catch {
      setState('error');
    }
  }

  async function downloadPdf() {
    if (!letter) return;
    setPdfLoading(true);
    try {
      const doc = await buildPdf({ letter, claimData, details, result, flightDetails });
      const flightNum = claimData?.flightNumber?.replace(/\s/g, '') || 'flight';
      const date = claimData?.flightDate || new Date().toISOString().split('T')[0];
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const fileName = `FlightComp-ClaimKit-${flightNum}-${date}.pdf`;
      if (isMobile) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) {
          const a = document.createElement('a');
          a.href = url; a.download = fileName; a.click();
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

  // ── Loading (reading sessionStorage) ──
  if (state === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-title">Loading your claim data…</div>
      </div>
    );
  }

  // ── Error ──
  if (state === 'error') {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Something went wrong</div>
        <div className="error-sub">
          We couldn&apos;t load your claim data. If you&apos;ve already paid,
          please email <strong>support@getflightcomp.com</strong> with your booking
          reference and we&apos;ll send your letter manually.
        </div>
        <button className="btn-retry" onClick={() => router.push('/')}>← Back to start</button>
      </div>
    );
  }

  // ── Collect extra details ──
  if (state === 'collect') {
    return (
      <FlightDetailsForm
        claimData={claimData}
        result={result}
        onSubmit={handleGenerate}
      />
    );
  }

  // ── Generating ──
  if (state === 'generating') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-title">Building your Flight Compensation Kit…</div>
        <div className="loading-sub">
          Writing your personalised claim letter and preparing all 5 documents.
          This takes about 15 seconds.
        </div>
      </div>
    );
  }

  // ── Ready ──
  const regulation = result?.regulation || 'EU261';

  return (
    <div className="success-screen">
      <div className="success-header">
        <div className="success-icon">✅</div>
        <div className="success-title">Your Flight Compensation Kit is ready</div>
        <div className="success-sub">
          {details?.name || 'Your'} · {regulation} ·{' '}
          {result?.compensation?.amount ? `Up to ${result.compensation.amount}` : 'Compensation pending'} ·{' '}
          6-page PDF kit
        </div>
      </div>

      {/* Letter preview */}
      <LetterDisplay letter={letter} />

      {/* Download */}
      <div className="letter-actions">
        <button className="btn-action primary" onClick={downloadPdf} disabled={pdfLoading}>
          {pdfLoading ? '⏳ Generating PDF…' : '⬇️ Download Flight Compensation Kit (PDF)'}
        </button>
        <button className="btn-action" onClick={copyLetter}>
          {copied ? '✓ Copied!' : '📋 Copy letter text'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          PDF includes: claim letter · submission guide · follow-up templates · what to expect
        </span>
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

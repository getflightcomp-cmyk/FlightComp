import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getAirlineContact, getEscalationAuthority, getResponseDeadlineDays } from '../lib/airline-contacts';
import { tryResolveAirport } from '../lib/eu261';
import { trackEvent } from '../lib/analytics';

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

// ── PDF translation strings (5 languages) ────────────
const PDF_STRINGS = {
  en: {
    page_header: 'Flight Compensation Kit',
    footer_branded: 'Prepared with FlightComp \u2014 getflightcomp.com',
    page_counter: (n, total) => `Page ${n} of ${total}`,
    claims_overview_title: 'Claims Overview',
    claims_overview_sub: 'A summary of your claim details and what to expect.',
    label_regulation: 'Regulation',
    label_compensation: 'Target Compensation',
    label_flight: 'Flight',
    label_date: 'Date',
    section_kit_contains: 'THIS KIT CONTAINS',
    kit_1: 'How to Submit Your Claim \u2014 airline contact details and step-by-step instructions',
    kit_2: "Formal Compensation Claim Letter \u2014 personalised, ready to send",
    kit_3: "14-Day Follow-Up Template \u2014 if the airline hasn't responded after 2 weeks",
    kit_4: '30-Day Escalation Template \u2014 if the airline rejects or ignores your claim',
    kit_5: 'What to Expect Guide \u2014 common airline responses and how to handle them',
    quick_start_label: 'QUICK START',
    qs_email: (email) => `Send the Formal Compensation Claim Letter to ${email}`,
    qs_portal: (airline) => `Submit via ${airline}'s online claims portal \u2014 see How to Submit Your Claim (page 2) for instructions.`,
    how_to_submit_title: 'How to Submit Your Claim',
    airline_line: (airline, reg) => `Airline: ${airline}  \u00B7  Regulation: ${reg}`,
    section_contact: 'AIRLINE CONTACT DETAILS',
    send_to: (email) => `Send your claim to: ${email}`,
    web_form_para: (airline) => `${airline} accepts claims through their online portal. Search "${airline} flight compensation claim" to find their submission page. When filling out the form, use the details and legal citations from the Formal Compensation Claim Letter included in this kit.`,
    unknown_airline_para: (airline, regSearch) => `We don't have specific contact details for ${airline} on file. Search "${airline} ${regSearch}" or "${airline} customer relations" to find the correct contact.`,
    section_steps: 'STEP-BY-STEP INSTRUCTIONS',
    substep_email_1: (email) => `Send the Formal Compensation Claim Letter (page 3) via email to: ${email}`,
    substep_email_2: 'Use the subject line from the letter as your email subject and copy the full letter text into the body of the email.',
    substep_email_3: 'Keep a copy of the sent email and note today\'s date as your submission date.',
    substep_email_4: (days, reg, date) => `The airline has ${days} days to respond under ${reg}. If you do not receive a response by ${date}, send the 14-Day Follow-Up Template included in this kit.`,
    substep_email_5: (escDate, esc, reg) => `If the airline rejects your claim or you receive no satisfactory response by ${escDate}, send the 30-Day Escalation Template and file a complaint with ${esc}.`,
    substep_portal_1: (airline) => `Go to ${airline}'s website and find their claims or customer relations portal. Search "${airline} flight compensation claim" to find the correct page.`,
    substep_portal_2: 'Fill out the airline\'s online form using the details from your Formal Compensation Claim Letter (page 3). In any free-text or description fields, copy the key paragraphs from your claim letter \u2014 especially the legal basis, flight details, and compensation amount.',
    substep_portal_3: 'Save or screenshot your submission confirmation and any reference number the airline provides.',
    substep_portal_4: (days, reg, fuDate, airline) => `The airline has ${days} days to respond under ${reg}. If you do not receive a response by ${fuDate}, submit the Follow-Up Template content (page 5) through the same portal or via email to ${airline}'s general customer service.`,
    substep_portal_5: (escDate, esc) => `If the airline rejects your claim or you receive no satisfactory response by ${escDate}, use the 30-Day Escalation Template and file a complaint with ${esc}.`,
    section_escalation_authority: 'ESCALATION AUTHORITY',
    escalation_intro: 'If the airline does not resolve your claim within 30 days, you can file a free complaint with:',
    formal_letter_title: 'Formal Compensation Claim Letter',
    callout_email: 'Send this letter to your airline\'s claims department via email. Keep a copy for your records.',
    callout_portal: (airline) => `Use the content of this letter when submitting your claim through ${airline}'s online portal. Copy the legal citations and compensation details into the form's text fields.`,
    customer_relations: 'Customer Relations / Claims Department',
    to_whom: 'To whom it may concern,',
    opening_sentence: (reg, disruption) => `I am writing to claim statutory compensation under ${reg} for the ${disruption} of the above-referenced flight.`,
    section_legal: 'LEGAL BASIS & CLAIM',
    closing_payment_pre: (days) => `I request that you process this compensation claim and provide payment within ${days} days of this letter `,
    closing_trust: 'I trust you will handle this claim promptly and in accordance with your statutory obligations.',
    sign_off: 'Sincerely,',
    dear_sir: 'Dear Sir or Madam,',
    follow_up_title: '14-Day Follow-Up Template',
    follow_up_callout_email: (email, date) => `Send this follow-up via email to ${email} if you have not received a response by ${date} (14 days after your original submission).`,
    follow_up_callout_portal: (airline, date) => `Submit this follow-up through ${airline}'s online portal, or contact their customer service team directly referencing your original claim submission and reference number, if you have not received a response by ${date}.`,
    section_follow_up: 'FOLLOW-UP LETTER',
    fu_customer_relations: 'Customer Relations Department',
    fu_re: (flightNum, flightDate) => `Re: Follow-Up \u2014 Compensation Claim for Flight ${flightNum} on ${flightDate}`,
    fu_dear: 'Dear Sir or Madam,',
    fu_para1: (today, flightNum, flightDate, from, to) => `I am writing to follow up on a formal compensation claim I submitted on ${today} regarding flight ${flightNum} on ${flightDate} from ${from} to ${to}.`,
    fu_para2: (reg) => `I have not yet received a response or acknowledgement of my claim. Under ${reg}, airlines are required to respond to passenger compensation claims within a reasonable timeframe. I submitted my original claim 14 days ago and have still not received a substantive reply.`,
    fu_para3: 'I kindly request that you acknowledge receipt of my original claim and provide a written update on its status within 7 days of this letter.',
    fu_para4: (esc) => `If I do not receive a response, I will escalate this matter to the ${esc}.`,
    fu_sincerely: 'Sincerely,',
    fu_name_placeholder: '[Your full name]',
    fu_email_placeholder: '[Your email]',
    follow_up_note: 'Note: Update the submission date if you are sending this at a different time.',
    escalation_title: '30-Day Escalation Template',
    esc_callout_email: (email, date) => `Send this escalation letter via email to ${email} if you have not received a satisfactory response by ${date} (30 days after your original submission).`,
    esc_callout_portal: (airline, date) => `Submit this escalation through ${airline}'s online portal, or contact their customer service team directly referencing your claim, if you have not received a satisfactory response by ${date}.`,
    section_escalation_letter: 'ESCALATION LETTER',
    esc_customer_relations: 'Customer Relations Department',
    esc_re: (flightNum, flightDate) => `Re: Escalation Notice \u2014 Unanswered Compensation Claim for Flight ${flightNum} on ${flightDate}`,
    esc_dear: 'Dear Sir or Madam,',
    esc_para1: (flightNum, flightDate, from, to) => `I am writing to formally escalate my compensation claim regarding flight ${flightNum} on ${flightDate} from ${from} to ${to}.`,
    esc_para2: (today, reg) => `I submitted a formal claim on ${today} under ${reg}. As of the date of this letter, I have not received a substantive response or resolution.`,
    esc_para3_amount: (reg, amount) => `Under ${reg}, I am legally entitled to compensation of ${amount} per passenger. This amount remains outstanding.`,
    esc_para3_no_amount: (reg) => `Under ${reg}, I am legally entitled to compensation for the disruption experienced. This remains outstanding.`,
    esc_para4: (esc) => `I require a full written response within 14 days of this letter. If I do not receive a satisfactory resolution, I will immediately file a formal complaint with the ${esc} and reserve all rights to pursue further legal remedies, including proceedings in the relevant small claims court.`,
    esc_sincerely: 'Sincerely,',
    esc_name_placeholder: '[Your full name]',
    esc_email_placeholder: '[Your email]',
    escalation_note: 'Note: Update the original claim submission date before sending.',
    what_to_expect_title: 'What to Expect After Submitting Your Claim',
    section_timeline: 'TYPICAL TIMELINE',
    timeline_1: '1\u20133 days: Acknowledge receipt (most airlines, if you email).',
    timeline_2: '14\u201330 days: Initial response \u2014 may be an offer, a rejection, or a request for more information.',
    timeline_3: '30\u201360 days: Full resolution for straightforward claims.',
    timeline_4: '60\u201390 days: More complex cases, or airlines that are slow to respond.',
    timeline_5: '90+ days: Escalate to the relevant authority \u2014 do not wait longer than this.',
    section_responses: 'COMMON AIRLINE RESPONSES',
    resp_1_head: '"Extraordinary circumstances" or "force majeure"',
    resp_1_detail: 'Airlines frequently use this defense. If the actual cause was mechanical, crew-related, or operational, this defense does not apply. Respond in writing citing the specific cause and stating it does not meet the legal definition of extraordinary circumstances.',
    resp_2_head: '"We need more information"',
    resp_2_detail: 'Respond promptly with any documents requested \u2014 booking confirmation, boarding passes, correspondence. Keep copies of everything you send.',
    resp_3_head: '"Your claim is rejected"',
    resp_3_detail: 'Do not accept a rejection without a written explanation citing specific legal grounds. Use the 30-day escalation template (page 5) and file with the relevant authority.',
    resp_4_head: 'No response after 14 days',
    resp_4_detail: 'Send the 14-day follow-up template (page 4). If still no response after 30 days total, send the escalation template and file with the authority below.',
    resp_5_head: '"We offer you a voucher instead"',
    resp_5_detail: 'You are not obliged to accept a voucher. Under EU261/UK261/APPR, you are entitled to cash compensation. Reply in writing that you do not accept the voucher and require cash payment.',
    section_your_path: 'YOUR ESCALATION PATH',
    path_1: (airline) => `Send your Formal Compensation Claim Letter to ${airline} using the contact details in the How to Submit section.`,
    path_2: 'If no response in 14 days, send the 14-Day Follow-Up Template included in this kit.',
    path_3: (esc) => `If no resolution in 30 days, send the 30-Day Escalation Template and file with ${esc}.`,
    path_4: "If the authority doesn't resolve it within 8 weeks, consider Alternative Dispute Resolution (ADR) or small claims court.",
    final_callout: 'Small claims court is a viable option in most jurisdictions for claims of this size and does not require a solicitor. Filing fees are typically \u00A330\u2013\u00A3100 (UK), \u20AC25\u2013\u20AC75 (EU), or CA$75\u2013$200 (Canada).',
    row_flight_number: 'Flight number',
    row_date_of_travel: 'Date of travel',
    row_route: 'Route',
    row_distance: 'Distance',
    row_scheduled: 'Scheduled arrival',
    row_actual: 'Actual arrival',
    row_delay: 'Delay duration',
    disruption_delay: 'delay',
    disruption_cancel: 'cancellation',
    disruption_denied: 'denied boarding',
    disruption_other: 'disruption',
    route_to: (from, to) => `${from} to ${to}`,
    letter_subject_line: (flightNum, flightDate, regFull) => `Re: Flight ${flightNum} on ${flightDate} — Compensation Claim under ${regFull}`,
  },
  tr: {
    page_header: 'Ucus Tazminat Kiti',
    footer_branded: 'FlightComp ile hazirlanmistir \u2014 getflightcomp.com',
    page_counter: (n, total) => `Sayfa ${n} / ${total}`,
    claims_overview_title: 'Talep Ozeti',
    claims_overview_sub: 'Talep bilgilerinizin ozeti ve beklentileriniz.',
    label_regulation: 'Duzenleme',
    label_compensation: 'Hedef Tazminat',
    label_flight: 'Ucus',
    label_date: 'Tarih',
    section_kit_contains: 'BU KIT ICERIR',
    kit_1: 'Talebinizi Nasil Sunarsınız \u2014 havayolu iletisim bilgileri ve adim adim talimatlar',
    kit_2: 'Resmi Tazminat Talep Mektubu \u2014 kisisellestirilmis, gondermeye hazir',
    kit_3: '14 Gunluk Takip Sablonu \u2014 2 hafta sonra havayolu yanit vermezse',
    kit_4: '30 Gunluk Eskalasyon Sablonu \u2014 havayolu talebinizi reddederse veya yanit vermezse',
    kit_5: 'Beklentiler Rehberi \u2014 yaygin havayolu yanitleri ve nasil ele alinacagi',
    quick_start_label: 'HIZLI BASLANGIC',
    qs_email: (email) => `Resmi Tazminat Talep Mektubunu ${email} adresine gonderin`,
    qs_portal: (airline) => `${airline} sirketinin cevrimici talep portali uzerinden gonderin \u2014 talimatlar icin Talebinizi Nasil Sunarsınız bolumune (sayfa 2) bakin.`,
    how_to_submit_title: 'Talebinizi Nasil Sunarsınız',
    airline_line: (airline, reg) => `Havayolu: ${airline}  \u00B7  Duzenleme: ${reg}`,
    section_contact: 'HAVAYOLU ILETISIM BILGILERI',
    send_to: (email) => `Talebinizi su adrese gonderin: ${email}`,
    web_form_para: (airline) => `${airline}, talepleri cevrimici portallari uzerinden kabul etmektedir. Basvuru sayfasini bulmak icin "${airline} ucus tazminati talebi" seklinde arama yapin. Formu doldururken bu kitte yer alan Resmi Tazminat Talep Mektubundaki bilgileri kullanin.`,
    unknown_airline_para: (airline, regSearch) => `${airline} icin belirli iletisim bilgilerimiz bulunmamaktadir. Dogru iletisimi bulmak icin "${airline} ${regSearch}" veya "${airline} musteri iliskileri" seklinde arama yapin.`,
    section_steps: 'ADIM ADIM TALIMATLAR',
    substep_email_1: (email) => `Resmi Tazminat Talep Mektubunu (sayfa 3) e-posta ile su adrese gonderin: ${email}`,
    substep_email_2: 'Mektuptaki konu satirini e-postanizin konusu olarak kullanin ve mektubun tam metnini e-postanizin govdesine kopyalayin.',
    substep_email_3: 'Gonderdigeniz e-postanin bir kopyasini saklayin ve bugunun tarihini basvuru tarihiniz olarak not edin.',
    substep_email_4: (days, reg, date) => `Havayolunun ${reg} kapsaminda ${days} gun icinde yanit vermesi gerekmektedir. ${date} tarihine kadar yanit alamazsaniz, bu kitte yer alan 14 Gunluk Takip Sablonunu gonderin.`,
    substep_email_5: (escDate, esc) => `Havayolunuz talebinizi reddederse veya ${escDate} tarihine kadar tatmin edici bir yanit alamazsaniz, 30 Gunluk Eskalasyon Sablonunu gonderin ve ${esc} kurumuna sikayet bildirin.`,
    substep_portal_1: (airline) => `${airline} sirketinin web sitesine gidin ve talep veya musteri iliskileri portalini bulun. Dogru sayfayi bulmak icin "${airline} ucus tazminati talebi" seklinde arama yapin.`,
    substep_portal_2: "Havayolunun cevrimici formunu Resmi Tazminat Talep Mektubunuzdaki (sayfa 3) bilgileri kullanarak doldurun. Serbest metin alanlarina mektubunuzdaki hukuki dayanak, ucus bilgileri ve tazminat tutarini iceren ana paragraflari kopyalayin.",
    substep_portal_3: 'Basvuru onayinizi ve havayolunun verdigi referans numarasini kaydedin veya ekran goruntusunu alin.',
    substep_portal_4: (days, reg, fuDate, airline) => `Havayolunun ${reg} kapsaminda ${days} gun icinde yanit vermesi gerekmektedir. ${fuDate} tarihine kadar yanit alamazsaniz, Takip Sablonu icerigini (sayfa 5) ayni portal uzerinden veya ${airline} musteri hizmetlerine e-posta ile gonderin.`,
    substep_portal_5: (escDate, esc) => `Havayolunuz talebinizi reddederse veya ${escDate} tarihine kadar tatmin edici bir yanit alamazsaniz, 30 Gunluk Eskalasyon Sablonunu kullanin ve ${esc} kurumuna sikayet bildirin.`,
    section_escalation_authority: 'YETKILI MERCI',
    escalation_intro: 'Havayolu 30 gun icinde talebinizi cozmazse, asagidaki kuruma ucretsiz sikayet bildirebilirsiniz:',
    formal_letter_title: 'Resmi Tazminat Talep Mektubu',
    callout_email: 'Bu mektubu e-posta ile havayolunuzun talep departmanina gonderin. Kaydınız icin bir kopyasini saklayin.',
    callout_portal: (airline) => `${airline} sirketinin cevrimici portali uzerinden talebinizi sunarken bu mektubun icerigini kullanin. Hukuki atiflari ve tazminat bilgilerini formdaki metin alanlarina kopyalayin.`,
    customer_relations: 'Musteri Iliskileri / Talep Departmani',
    to_whom: 'Ilgili Makama,',
    opening_sentence: (reg, disruption) => `${reg} kapsaminda yukarida belirtilen ucusun ${disruption}u nedeniyle yasal tazminat talep etmek uzere yaziyorum.`,
    section_legal: 'HUKUKI DAYANAK VE TALEP',
    closing_payment_pre: (days) => `Bu tazminat talebini islemek ve mektubun tarihinden itibaren ${days} gun icinde odeme yapmanixi talep ediyorum `,
    closing_trust: 'Bu talebi derhal ve yasal yukumlulukleriniz cercevesinde ele alacaginiza inaniyorum.',
    sign_off: 'Saygilarimla,',
    dear_sir: 'Saygin Yetkili,',
    follow_up_title: '14 Gunluk Takip Sablonu',
    follow_up_callout_email: (email, date) => `Orijinal basvurunuzdan 14 gun sonraki son tarih olan ${date} tarihine kadar yanit alamazsaniz bu takip mesajini ${email} adresine gonderin.`,
    follow_up_callout_portal: (airline, date) => `${date} tarihine kadar yanit alamazsaniz bu takip mesajini ${airline} sirketinin cevrimici portali uzerinden veya musteri hizmetleri ekibiyle dogrudan iletiserek gonderin.`,
    section_follow_up: 'TAKIP MEKTUBU',
    fu_customer_relations: 'Musteri Iliskileri Departmani',
    fu_re: (flightNum, flightDate) => `Konu: Takip \u2014 ${flightNum} Nolu Ucus / ${flightDate} Tarihli Tazminat Talebi`,
    fu_dear: 'Saygin Yetkili,',
    fu_para1: (today, flightNum, flightDate, from, to) => `${from}-${to} guzergahinda, ${flightDate} tarihinde gerceklesen ${flightNum} nolu ucusa iliskin ${today} tarihinde yaptigim resmi tazminat talebini takip etmek amaciyla yaziyorum.`,
    fu_para2: (reg) => `Talebime henuz hicbir yanit veya teyit alinamadim. ${reg} kapsaminda havayollarinin makul sure icerisinde yanit vermesi gerekmektedir. Asil talep mektubumu 14 gun once gonderdigim halde hala somut bir yanit alamadim.`,
    fu_para3: 'Asil talep mektubumun alindiginin teyit edilmesini ve 7 gun icinde durumu bildiren yazili bir guncelleme yapilmasini talep ediyorum.',
    fu_para4: (esc) => `Yanit alamamam halinde konuyu ${esc} kurumuna iletecegim.`,
    fu_sincerely: 'Saygilarimla,',
    fu_name_placeholder: '[Adiniz Soyadiniz]',
    fu_email_placeholder: '[E-posta adresiniz]',
    follow_up_note: 'Not: Bu mektubu farkli bir zamanda gonderiyorsaniz basvuru tarihini guncelleyin.',
    escalation_title: '30 Gunluk Eskalasyon Sablonu',
    esc_callout_email: (email, date) => `Orijinal basvurunuzdan 30 gun sonraki son tarih olan ${date} tarihine kadar tatmin edici bir yanit alamazsaniz bu eskalasyon mektubunu ${email} adresine gonderin.`,
    esc_callout_portal: (airline, date) => `${date} tarihine kadar tatmin edici bir yanit alamazsaniz bu eskalasyonu ${airline} sirketinin cevrimici portali uzerinden gonderin.`,
    section_escalation_letter: 'ESKALASYON MEKTUBU',
    esc_customer_relations: 'Musteri Iliskileri Departmani',
    esc_re: (flightNum, flightDate) => `Konu: Eskalasyon Bildirimi \u2014 ${flightNum} Nolu Ucus / ${flightDate} Tarihli Yanitlanmamis Tazminat Talebi`,
    esc_dear: 'Saygin Yetkili,',
    esc_para1: (flightNum, flightDate, from, to) => `${from}-${to} guzergahinda, ${flightDate} tarihinde gerceklesen ${flightNum} nolu ucusa iliskin tazminat talebimi resmi olarak iletmek uzere yaziyorum.`,
    esc_para2: (today, reg) => `${reg} kapsaminda ${today} tarihinde resmi bir talep sundum. Mektubun tarih itibarıyla, somut bir yanit veya cozum elde edemedim.`,
    esc_para3_amount: (reg, amount) => `${reg} kapsaminda yolcu basina ${amount} tazminat almaya yasal olarak hakkım bulunmaktadir. Bu tutar hala odenmemistir.`,
    esc_para3_no_amount: (reg) => `${reg} kapsaminda yasanan aksaklik nedeniyle tazminat almaya yasal olarak hakkım bulunmaktadir. Bu talep hala karsilanmamistir.`,
    esc_para4: (esc) => `Bu mektubun tarihinden itibaren 14 gun icinde tam yazili yanit verilmesini talep ediyorum. Tatmin edici bir cozum saglanmamasi halinde, derhal ${esc} kurumuna resmi sikayet bildirip kucuk talep mahkemesindeki yargı yollari dahil tum yasal haklarimi saklı tutacagim.`,
    esc_sincerely: 'Saygilarimla,',
    esc_name_placeholder: '[Adiniz Soyadiniz]',
    esc_email_placeholder: '[E-posta adresiniz]',
    escalation_note: 'Not: Gondermeden once asil talep basvuru tarihini guncelleyin.',
    what_to_expect_title: 'Talebinizi Gonderdikten Sonra Ne Beklenir',
    section_timeline: 'TIPIK ZAMAN CIZELGESI',
    timeline_1: '1\u20133 gun: Alindi onayı (cogu havayolu, e-posta ile basvurularda).',
    timeline_2: '14\u201330 gun: Ilk yanit \u2014 teklif, red veya ek bilgi talebi olabilir.',
    timeline_3: '30\u201360 gun: Basit taleplerde tam cozum.',
    timeline_4: '60\u201390 gun: Daha karmasik davalar veya yavas yanit veren havayollari.',
    timeline_5: '90+ gun: Ilgili kuruma yonlendirin \u2014 daha uzun beklemeyiniz.',
    section_responses: 'YAYGIN HAVAYOLU YANITLERI',
    resp_1_head: '"Olaganustu kosullar" veya "mucbir sebep"',
    resp_1_detail: 'Havayollari bu savunmayı sik kullanir. Gercek neden mekanik, personel veya operasyonel bir sorunsa bu savunma gecerli degildir. Gercek nedeni belirterek bunun yasal "olaganustu kosul" tanimi kapsamina girmadigini yazili olarak bildirin.',
    resp_2_head: '"Daha fazla bilgiye ihtiyacimiz var"',
    resp_2_detail: 'Talep edilen belgeleri \u2014 rezervasyon teyidi, binis kartlari, yazismalar \u2014 derhal gonderin. Gonderdiklerinizin kopyalarini sakladiginizdan emin olun.',
    resp_3_head: '"Talebiniz reddedildi"',
    resp_3_detail: 'Belirli hukuki gerekceleri iceren yazili bir aciklama olmaksizin reddi kabul etmeyin. 30 gunluk eskalasyon sablonunu (sayfa 5) kullanin ve ilgili kuruma basvurun.',
    resp_4_head: '14 gun sonra yanit yok',
    resp_4_detail: '14 gunluk takip sablonunu (sayfa 4) gonderin. 30 gun sonra hala yanit yoksa eskalasyon sablonunu gonderin ve asagidaki kuruma basvurun.',
    resp_5_head: '"Size kupon teklif ediyoruz"',
    resp_5_detail: 'Kupon kabul etmek zorunda degilsiniz. AB261/UK261/APPR kapsaminda nakit tazminat almaya hakkınız vardir. Kuponu kabul etmediginizi ve nakit odeme talep ettiginizi yazili olarak bildirin.',
    section_your_path: 'ESKALASYON YOLUNUZ',
    path_1: (airline) => `Talebinizi Nasil Sunarsınız bolumundeki iletisim bilgilerini kullanarak Resmi Tazminat Talep Mektubunuzu ${airline} sirketine gonderin.`,
    path_2: '14 gun icinde yanit gelmezse bu kitteki 14 Gunluk Takip Sablonunu gonderin.',
    path_3: (esc) => `30 gun icinde cozum saglanmazsa 30 Gunluk Eskalasyon Sablonunu gonderin ve ${esc} kurumuna basvurun.`,
    path_4: 'Kurum 8 hafta icinde sorunu cozmazse Alternatif Anlasmazlik Cozumu (ADR) veya kucuk talep mahkemesini dusunun.',
    final_callout: 'Kucuk talep mahkemesi, bu boyuttaki talepler icin pek cok yargı bolgesinde gecerli bir secenektir ve avukat gerektirmez. Basvuru ucretleri genellikle 30\u2013100 GBP (Birlesik Krallık), 25\u201375 EUR (AB) veya 75\u2013200 CA$ (Kanada) arasındadir.',
    row_flight_number: 'Ucus numarasi',
    row_date_of_travel: 'Seyahat tarihi',
    row_route: 'Guzergah',
    row_distance: 'Mesafe',
    row_scheduled: 'Planlanan varis',
    row_actual: 'Gercek varis',
    row_delay: 'Gecikme suresi',
    disruption_delay: 'gecikmesi',
    disruption_cancel: 'iptali',
    disruption_denied: 'yolcu kabul reddine',
    disruption_other: 'aksama',
    route_to: (from, to) => `${from} - ${to}`,
    letter_subject_line: (flightNum, flightDate, regFull) => `Konu: ${flightNum} numaralı uçuş, ${flightDate} — ${regFull} kapsamında tazminat talebi`,
  },
  fr: {
    page_header: "Kit d'indemnisation de vol",
    footer_branded: 'Prepare avec FlightComp \u2014 getflightcomp.com',
    page_counter: (n, total) => `Page ${n} sur ${total}`,
    claims_overview_title: 'Apercu de la demande',
    claims_overview_sub: 'Un resume de vos informations de demande et de ce a quoi vous attendre.',
    label_regulation: 'Reglementation',
    label_compensation: 'Indemnisation cible',
    label_flight: 'Vol',
    label_date: 'Date',
    section_kit_contains: 'CE KIT CONTIENT',
    kit_1: 'Comment soumettre votre demande \u2014 coordonnees de la compagnie aerienne et instructions etape par etape',
    kit_2: "Lettre de demande d'indemnisation officielle \u2014 personnalisee, prete a etre envoyee",
    kit_3: "Modele de suivi a 14 jours \u2014 si la compagnie aerienne n'a pas repondu apres 2 semaines",
    kit_4: "Modele d'escalade a 30 jours \u2014 si la compagnie aerienne rejette ou ignore votre demande",
    kit_5: 'Guide Quoi attendre \u2014 reponses courantes des compagnies aeriennes et comment les gerer',
    quick_start_label: 'DEMARRAGE RAPIDE',
    qs_email: (email) => `Envoyez la Lettre de demande d'indemnisation officielle a ${email}`,
    qs_portal: (airline) => `Soumettez via le portail de reclamations en ligne de ${airline} \u2014 voir Comment soumettre votre demande (page 2) pour les instructions.`,
    how_to_submit_title: 'Comment soumettre votre demande',
    airline_line: (airline, reg) => `Compagnie aerienne\u00A0: ${airline}  \u00B7  Reglementation\u00A0: ${reg}`,
    section_contact: 'COORDONNEES DE LA COMPAGNIE AERIENNE',
    send_to: (email) => `Envoyez votre demande a\u00A0: ${email}`,
    web_form_para: (airline) => `${airline} accepte les demandes via son portail en ligne. Recherchez "${airline} demande d'indemnisation de vol" pour trouver la page de soumission. Lors du remplissage du formulaire, utilisez les details et citations juridiques de la Lettre de demande d'indemnisation incluse dans ce kit.`,
    unknown_airline_para: (airline, regSearch) => `Nous ne disposons pas des coordonnees specifiques de ${airline}. Recherchez "${airline} ${regSearch}" ou "${airline} service client" pour trouver le bon contact.`,
    section_steps: 'INSTRUCTIONS ETAPE PAR ETAPE',
    substep_email_1: (email) => `Envoyez la Lettre de demande d'indemnisation officielle (page 3) par e-mail a\u00A0: ${email}`,
    substep_email_2: "Utilisez la ligne d'objet de la lettre comme sujet de votre e-mail et copiez le texte integral de la lettre dans le corps de l'e-mail.",
    substep_email_3: "Conservez une copie de l'e-mail envoye et notez la date d'aujourd'hui comme date de soumission.",
    substep_email_4: (days, reg, date) => `La compagnie aerienne dispose de ${days} jours pour repondre en vertu du ${reg}. Si vous ne recevez pas de reponse avant le ${date}, envoyez le Modele de suivi a 14 jours inclus dans ce kit.`,
    substep_email_5: (escDate, esc) => `Si la compagnie aerienne rejette votre demande ou si vous ne recevez pas de reponse satisfaisante avant le ${escDate}, envoyez le Modele d'escalade a 30 jours et deposez une plainte aupres de ${esc}.`,
    substep_portal_1: (airline) => `Rendez-vous sur le site de ${airline} et trouvez leur portail de reclamations ou de service client. Recherchez "${airline} demande d'indemnisation de vol" pour trouver la bonne page.`,
    substep_portal_2: "Remplissez le formulaire en ligne de la compagnie en utilisant les details de votre Lettre de demande d'indemnisation officielle (page 3). Dans les champs de texte libre, copiez les paragraphes cles de votre lettre \u2014 notamment la base juridique, les details du vol et le montant de l'indemnisation.",
    substep_portal_3: 'Sauvegardez ou capturez votre confirmation de soumission et tout numero de reference fourni.',
    substep_portal_4: (days, reg, fuDate, airline) => `La compagnie dispose de ${days} jours pour repondre en vertu du ${reg}. Sans reponse avant le ${fuDate}, soumettez le contenu du Modele de suivi (page 5) via le meme portail ou par e-mail au service client de ${airline}.`,
    substep_portal_5: (escDate, esc) => `Si la compagnie rejette votre demande ou sans reponse satisfaisante avant le ${escDate}, utilisez le Modele d'escalade a 30 jours et deposez une plainte aupres de ${esc}.`,
    section_escalation_authority: "AUTORITE DE RECOURS",
    escalation_intro: "Si la compagnie aerienne ne resout pas votre demande dans les 30 jours, vous pouvez deposer gratuitement une plainte aupres de\u00A0:",
    formal_letter_title: "Lettre de demande d'indemnisation officielle",
    callout_email: "Envoyez cette lettre au service des reclamations de votre compagnie aerienne par e-mail. Conservez-en une copie pour vos dossiers.",
    callout_portal: (airline) => `Utilisez le contenu de cette lettre lors de la soumission de votre demande via le portail en ligne de ${airline}. Copiez les citations juridiques et les details d'indemnisation dans les champs de texte du formulaire.`,
    customer_relations: 'Service client / Departement des reclamations',
    to_whom: 'A qui de droit,',
    opening_sentence: (reg, disruption) => `Je me permets de vous contacter afin de reclamer une indemnisation legale en vertu du ${reg} pour le ${disruption} du vol mentionne ci-dessus.`,
    section_legal: 'BASE JURIDIQUE ET DEMANDE',
    closing_payment_pre: (days) => `Je vous prie de bien vouloir traiter cette demande d'indemnisation et d'effectuer le paiement dans les ${days} jours suivant cette lettre `,
    closing_trust: 'Je vous fais confiance pour traiter cette demande rapidement et conformement a vos obligations legales.',
    sign_off: 'Cordialement,',
    dear_sir: 'Madame, Monsieur,',
    follow_up_title: 'Modele de suivi a 14 jours',
    follow_up_callout_email: (email, date) => `Envoyez ce suivi par e-mail a ${email} si vous n'avez pas recu de reponse avant le ${date} (14 jours apres votre soumission initiale).`,
    follow_up_callout_portal: (airline, date) => `Soumettez ce suivi via le portail en ligne de ${airline}, ou contactez directement leur service client en faisant reference a votre soumission initiale, si vous n'avez pas recu de reponse avant le ${date}.`,
    section_follow_up: 'LETTRE DE SUIVI',
    fu_customer_relations: 'Service client',
    fu_re: (flightNum, flightDate) => `Objet\u00A0: Suivi \u2014 Demande d'indemnisation pour le vol ${flightNum} du ${flightDate}`,
    fu_dear: 'Madame, Monsieur,',
    fu_para1: (today, flightNum, flightDate, from, to) => `Je me permets de faire suite a une demande d'indemnisation formelle que j'ai soumise le ${today} concernant le vol ${flightNum} du ${flightDate} de ${from} a ${to}.`,
    fu_para2: (reg) => `Je n'ai pas encore recu de reponse ni d'accuse de reception concernant ma demande. En vertu du ${reg}, les compagnies aeriennes sont tenues de repondre aux demandes d'indemnisation des passagers dans un delai raisonnable. J'ai soumis ma demande initiale il y a 14 jours et n'ai toujours pas recu de reponse concrete.`,
    fu_para3: "Je vous prie de bien vouloir accuser reception de ma demande initiale et de me communiquer une mise a jour ecrite sur son statut dans les 7 jours suivant cette lettre.",
    fu_para4: (esc) => `Sans reponse de votre part, je transmettrai cette affaire a ${esc}.`,
    fu_sincerely: 'Cordialement,',
    fu_name_placeholder: '[Votre nom complet]',
    fu_email_placeholder: '[Votre adresse e-mail]',
    follow_up_note: "Note\u00A0: Mettez a jour la date de soumission si vous envoyez cette lettre a un autre moment.",
    escalation_title: "Modele d'escalade a 30 jours",
    esc_callout_email: (email, date) => `Envoyez cette lettre d'escalade par e-mail a ${email} si vous n'avez pas recu de reponse satisfaisante avant le ${date} (30 jours apres votre soumission initiale).`,
    esc_callout_portal: (airline, date) => `Soumettez cette escalade via le portail en ligne de ${airline}, ou contactez directement leur service client en faisant reference a votre demande, si vous n'avez pas recu de reponse satisfaisante avant le ${date}.`,
    section_escalation_letter: "LETTRE D'ESCALADE",
    esc_customer_relations: 'Service client',
    esc_re: (flightNum, flightDate) => `Objet\u00A0: Avis d'escalade \u2014 Demande d'indemnisation non traitee pour le vol ${flightNum} du ${flightDate}`,
    esc_dear: 'Madame, Monsieur,',
    esc_para1: (flightNum, flightDate, from, to) => `Je me permets de faire formellement remonter ma demande d'indemnisation concernant le vol ${flightNum} du ${flightDate} de ${from} a ${to}.`,
    esc_para2: (today, reg) => `J'ai soumis une demande formelle le ${today} en vertu du ${reg}. A la date de cette lettre, je n'ai toujours pas recu de reponse concrete ni de resolution.`,
    esc_para3_amount: (reg, amount) => `En vertu du ${reg}, j'ai droit a une indemnisation de ${amount} par passager. Ce montant reste impaye.`,
    esc_para3_no_amount: (reg) => `En vertu du ${reg}, j'ai droit a une indemnisation pour la perturbation subie. Cette demande reste en attente.`,
    esc_para4: (esc) => `J'exige une reponse ecrite complete dans les 14 jours suivant cette lettre. Sans resolution satisfaisante, je deposerai immediatement une plainte formelle aupres de ${esc} et me reserve tous les droits de recours juridiques, y compris une procedure devant la juridiction competente.`,
    esc_sincerely: 'Cordialement,',
    esc_name_placeholder: '[Votre nom complet]',
    esc_email_placeholder: '[Votre adresse e-mail]',
    escalation_note: "Note\u00A0: Mettez a jour la date de soumission initiale avant d'envoyer.",
    what_to_expect_title: 'A quoi s\'attendre apres avoir soumis votre demande',
    section_timeline: 'CALENDRIER TYPIQUE',
    timeline_1: '1\u20133 jours\u00A0: Accuse de reception (la plupart des compagnies, par e-mail).',
    timeline_2: '14\u201330 jours\u00A0: Reponse initiale \u2014 peut etre une offre, un refus ou une demande d\'informations complementaires.',
    timeline_3: '30\u201360 jours\u00A0: Resolution complete pour les demandes simples.',
    timeline_4: '60\u201390 jours\u00A0: Cas plus complexes ou compagnies lentes a repondre.',
    timeline_5: '90+ jours\u00A0: Transmettez a l\'autorite competente \u2014 n\'attendez pas plus longtemps.',
    section_responses: 'REPONSES COURANTES DES COMPAGNIES AERIENNES',
    resp_1_head: '"Circonstances extraordinaires" ou "force majeure"',
    resp_1_detail: 'Les compagnies aeriennes invoquent frequemment cet argument. Si la cause reelle etait mecanique, liee au personnel ou operationnelle, cet argument ne tient pas. Repondez par ecrit en citant la cause specifique et en indiquant qu\'elle ne correspond pas a la definition juridique des circonstances extraordinaires.',
    resp_2_head: '"Nous avons besoin de plus d\'informations"',
    resp_2_detail: 'Repondez rapidement avec les documents demandes \u2014 confirmation de reservation, cartes d\'embarquement, correspondances. Conservez des copies de tout ce que vous envoyez.',
    resp_3_head: '"Votre demande est rejetee"',
    resp_3_detail: "N'acceptez pas un refus sans explication ecrite citant des motifs juridiques specifiques. Utilisez le modele d'escalade a 30 jours (page 5) et deposez une plainte aupres de l'autorite competente.",
    resp_4_head: 'Aucune reponse apres 14 jours',
    resp_4_detail: "Envoyez le modele de suivi a 14 jours (page 4). Toujours sans reponse apres 30 jours au total, envoyez le modele d'escalade et deposez une plainte aupres de l'autorite ci-dessous.",
    resp_5_head: '"Nous vous proposons un bon d\'echange"',
    resp_5_detail: "Vous n'etes pas oblige d'accepter un bon. En vertu d'EU261/UK261/APPR, vous avez droit a une indemnisation en especes. Repondez par ecrit que vous refusez le bon et exigez un paiement en especes.",
    section_your_path: "VOTRE PARCOURS D'ESCALADE",
    path_1: (airline) => `Envoyez votre Lettre de demande d'indemnisation officielle a ${airline} en utilisant les coordonnees de la section Comment soumettre.`,
    path_2: 'Sans reponse dans les 14 jours, envoyez le Modele de suivi a 14 jours inclus dans ce kit.',
    path_3: (esc) => `Sans resolution dans les 30 jours, envoyez le Modele d'escalade a 30 jours et deposez une plainte aupres de ${esc}.`,
    path_4: "Si l'autorite ne resout pas le litige dans les 8 semaines, envisagez la Resolution Alternative des Litiges (RAL) ou le tribunal des petits litiges.",
    final_callout: "Le tribunal des petits litiges est une option viable dans la plupart des pays pour des demandes de cette taille et ne necessite pas d'avocat. Les frais de depot sont generalement de 30\u2013100 GBP (R.-U.), 25\u201375 EUR (UE) ou 75\u2013200 CA$ (Canada).",
    row_flight_number: 'Numero de vol',
    row_date_of_travel: 'Date du voyage',
    row_route: 'Itineraire',
    row_distance: 'Distance',
    row_scheduled: 'Arrivee prevue',
    row_actual: 'Arrivee reelle',
    row_delay: 'Duree du retard',
    disruption_delay: 'retard',
    disruption_cancel: 'annulation',
    disruption_denied: "refus d'embarquement",
    disruption_other: 'perturbation',
    route_to: (from, to) => `${from} a ${to}`,
    letter_subject_line: (flightNum, flightDate, regFull) => `Objet : Vol ${flightNum} du ${flightDate} — Demande d'indemnisation en vertu de ${regFull}`,
  },
  de: {
    page_header: 'Fluggastrechte-Kit',
    footer_branded: 'Erstellt mit FlightComp \u2014 getflightcomp.com',
    page_counter: (n, total) => `Seite ${n} von ${total}`,
    claims_overview_title: 'Anspruchsubersicht',
    claims_overview_sub: 'Eine Zusammenfassung Ihrer Anspruchsdetails und was Sie erwarten konnen.',
    label_regulation: 'Verordnung',
    label_compensation: 'Angestrebte Entschadigung',
    label_flight: 'Flug',
    label_date: 'Datum',
    section_kit_contains: 'DIESER KIT ENTHALT',
    kit_1: 'So reichen Sie Ihren Anspruch ein \u2014 Kontaktdaten der Fluggesellschaft und schrittweise Anleitung',
    kit_2: 'Formeller Entschadigungsanspruchsbrief \u2014 personalisiert, versandbereit',
    kit_3: '14-Tage-Nachfassvorlage \u2014 falls die Fluggesellschaft nach 2 Wochen nicht geantwortet hat',
    kit_4: '30-Tage-Eskalationsvorlage \u2014 falls die Fluggesellschaft Ihren Anspruch ablehnt oder ignoriert',
    kit_5: 'Erwartungsleitfaden \u2014 haufige Antworten der Fluggesellschaft und wie Sie damit umgehen',
    quick_start_label: 'SCHNELLSTART',
    qs_email: (email) => `Senden Sie den formellen Entschadigungsanspruchsbrief an ${email}`,
    qs_portal: (airline) => `Reichen Sie Ihren Anspruch uber das Online-Portal von ${airline} ein \u2014 Anweisungen finden Sie unter So reichen Sie Ihren Anspruch ein (Seite 2).`,
    how_to_submit_title: 'So reichen Sie Ihren Anspruch ein',
    airline_line: (airline, reg) => `Fluggesellschaft: ${airline}  \u00B7  Verordnung: ${reg}`,
    section_contact: 'KONTAKTDATEN DER FLUGGESELLSCHAFT',
    send_to: (email) => `Senden Sie Ihren Anspruch an: ${email}`,
    web_form_para: (airline) => `${airline} nimmt Anspruche uber ihr Online-Portal entgegen. Suchen Sie nach "${airline} Fluggastrechte Anspruch", um die Einreichungsseite zu finden. Verwenden Sie beim Ausfullen des Formulars die Angaben und rechtlichen Zitate aus dem in diesem Kit enthaltenen formellen Entschadigungsanspruchsbrief.`,
    unknown_airline_para: (airline, regSearch) => `Wir haben keine spezifischen Kontaktdaten fur ${airline} vorliegen. Suchen Sie nach "${airline} ${regSearch}" oder "${airline} Kundenservice", um den richtigen Kontakt zu finden.`,
    section_steps: 'SCHRITT-FUR-SCHRITT-ANLEITUNG',
    substep_email_1: (email) => `Senden Sie den formellen Entschadigungsanspruchsbrief (Seite 3) per E-Mail an: ${email}`,
    substep_email_2: 'Verwenden Sie die Betreffzeile des Briefes als Betreff Ihrer E-Mail und kopieren Sie den vollstandigen Brieftext in den E-Mail-Text.',
    substep_email_3: 'Bewahren Sie eine Kopie der gesendeten E-Mail auf und notieren Sie das heutige Datum als Ihr Einreichungsdatum.',
    substep_email_4: (days, reg, date) => `Die Fluggesellschaft hat gemas ${reg} ${days} Tage Zeit zu antworten. Erhalten Sie bis zum ${date} keine Antwort, senden Sie die in diesem Kit enthaltene 14-Tage-Nachfassvorlage.`,
    substep_email_5: (escDate, esc) => `Lehnt die Fluggesellschaft Ihren Anspruch ab oder erhalten Sie bis zum ${escDate} keine zufriedenstellende Antwort, senden Sie die 30-Tage-Eskalationsvorlage und reichen Sie eine Beschwerde bei ${esc} ein.`,
    substep_portal_1: (airline) => `Besuchen Sie die Website von ${airline} und finden Sie deren Anspruchs- oder Kundenserviceportal. Suchen Sie nach "${airline} Fluggastrechte Anspruch", um die richtige Seite zu finden.`,
    substep_portal_2: 'Fullen Sie das Online-Formular der Fluggesellschaft mit den Angaben aus Ihrem formellen Entschadigungsanspruchsbrief (Seite 3) aus. Kopieren Sie in Freitextfelder die wichtigsten Absatze aus Ihrem Brief \u2014 insbesondere die Rechtsgrundlage, Flugdaten und den Entschadigungsbetrag.',
    substep_portal_3: 'Speichern Sie Ihre Einreichungsbestatigung und jede Referenznummer, die die Fluggesellschaft bereitstellt.',
    substep_portal_4: (days, reg, fuDate, airline) => `Die Fluggesellschaft hat gemas ${reg} ${days} Tage Zeit zu antworten. Erhalten Sie bis zum ${fuDate} keine Antwort, reichen Sie den Inhalt der Nachfassvorlage (Seite 5) uber dasselbe Portal oder per E-Mail beim allgemeinen Kundenservice von ${airline} ein.`,
    substep_portal_5: (escDate, esc) => `Lehnt die Fluggesellschaft Ihren Anspruch ab oder erhalten Sie bis zum ${escDate} keine zufriedenstellende Antwort, verwenden Sie die 30-Tage-Eskalationsvorlage und reichen Sie eine Beschwerde bei ${esc} ein.`,
    section_escalation_authority: 'SCHLICHTUNGSSTELLE',
    escalation_intro: 'Wenn die Fluggesellschaft Ihren Anspruch innerhalb von 30 Tagen nicht lost, konnen Sie kostenlos eine Beschwerde einreichen bei:',
    formal_letter_title: 'Formeller Entschadigungsanspruchsbrief',
    callout_email: 'Senden Sie diesen Brief per E-Mail an die Anspruchsabteilung Ihrer Fluggesellschaft. Bewahren Sie eine Kopie fur Ihre Unterlagen auf.',
    callout_portal: (airline) => `Verwenden Sie den Inhalt dieses Briefes, wenn Sie Ihren Anspruch uber das Online-Portal von ${airline} einreichen. Kopieren Sie die rechtlichen Zitate und Entschadigungsdetails in die Textfelder des Formulars.`,
    customer_relations: 'Kundendienst / Reklamationsabteilung',
    to_whom: 'Sehr geehrte Damen und Herren,',
    opening_sentence: (reg, disruption) => `Ich schreibe Ihnen, um gemas ${reg} eine gesetzliche Entschadigung fur die ${disruption} des oben genannten Fluges geltend zu machen.`,
    section_legal: 'RECHTSGRUNDLAGE UND ANSPRUCH',
    closing_payment_pre: (days) => `Ich bitte Sie, diesen Entschadigungsanspruch zu bearbeiten und die Zahlung innerhalb von ${days} Tagen nach diesem Schreiben zu leisten `,
    closing_trust: 'Ich vertraue darauf, dass Sie diesen Anspruch umgehend und in Ubereinstimmung mit Ihren gesetzlichen Verpflichtungen bearbeiten werden.',
    sign_off: 'Mit freundlichen Gruen,',
    dear_sir: 'Sehr geehrte Damen und Herren,',
    follow_up_title: '14-Tage-Nachfassvorlage',
    follow_up_callout_email: (email, date) => `Senden Sie diese Nachfass-E-Mail an ${email}, falls Sie bis zum ${date} (14 Tage nach Ihrer ursprunglichen Einreichung) keine Antwort erhalten haben.`,
    follow_up_callout_portal: (airline, date) => `Reichen Sie dieses Nachfassschreiben uber das Online-Portal von ${airline} ein oder kontaktieren Sie deren Kundenservice direkt, falls Sie bis zum ${date} keine Antwort erhalten haben.`,
    section_follow_up: 'NACHFASSBRIEF',
    fu_customer_relations: 'Kundendienstabteilung',
    fu_re: (flightNum, flightDate) => `Betr.: Nachfassung \u2014 Entschadigungsanspruch fur Flug ${flightNum} am ${flightDate}`,
    fu_dear: 'Sehr geehrte Damen und Herren,',
    fu_para1: (today, flightNum, flightDate, from, to) => `Ich schreibe Ihnen bezuglich eines formellen Entschadigungsanspruchs, den ich am ${today} fur Flug ${flightNum} am ${flightDate} von ${from} nach ${to} eingereicht habe.`,
    fu_para2: (reg) => `Ich habe noch keine Antwort oder Eingangsbestatigung zu meinem Anspruch erhalten. Gemas ${reg} sind Fluggesellschaften verpflichtet, auf Entschadigungsanspruche von Passagieren innerhalb einer angemessenen Frist zu antworten. Ich habe meinen ursprunglichen Anspruch vor 14 Tagen eingereicht und noch keine substantielle Antwort erhalten.`,
    fu_para3: 'Ich bitte Sie freundlich, den Eingang meines ursprunglichen Anspruchs zu bestatigen und innerhalb von 7 Tagen nach diesem Schreiben eine schriftliche Aktualisierung zum Bearbeitungsstand zu ubermitteln.',
    fu_para4: (esc) => `Sollte ich keine Antwort erhalten, werde ich diese Angelegenheit an ${esc} weiterleiten.`,
    fu_sincerely: 'Mit freundlichen Gruen,',
    fu_name_placeholder: '[Ihr vollstandiger Name]',
    fu_email_placeholder: '[Ihre E-Mail-Adresse]',
    follow_up_note: 'Hinweis: Aktualisieren Sie das Einreichungsdatum, wenn Sie dieses Schreiben zu einem anderen Zeitpunkt versenden.',
    escalation_title: '30-Tage-Eskalationsvorlage',
    esc_callout_email: (email, date) => `Senden Sie diesen Eskalationsbrief per E-Mail an ${email}, falls Sie bis zum ${date} (30 Tage nach Ihrer ursprunglichen Einreichung) keine zufriedenstellende Antwort erhalten haben.`,
    esc_callout_portal: (airline, date) => `Reichen Sie diese Eskalation uber das Online-Portal von ${airline} ein, falls Sie bis zum ${date} keine zufriedenstellende Antwort erhalten haben.`,
    section_escalation_letter: 'ESKALATIONSBRIEF',
    esc_customer_relations: 'Kundendienstabteilung',
    esc_re: (flightNum, flightDate) => `Betr.: Eskalationshinweis \u2014 Unbeantworteter Entschadigungsanspruch fur Flug ${flightNum} am ${flightDate}`,
    esc_dear: 'Sehr geehrte Damen und Herren,',
    esc_para1: (flightNum, flightDate, from, to) => `Ich schreibe Ihnen, um meinen Entschadigungsanspruch bezuglich Flug ${flightNum} am ${flightDate} von ${from} nach ${to} formell zu eskalieren.`,
    esc_para2: (today, reg) => `Ich habe am ${today} gemas ${reg} einen formellen Anspruch eingereicht. Zum Datum dieses Schreibens habe ich noch keine substantielle Antwort oder Losung erhalten.`,
    esc_para3_amount: (reg, amount) => `Gemas ${reg} habe ich rechtlichen Anspruch auf eine Entschadigung von ${amount} pro Passagier. Dieser Betrag steht noch aus.`,
    esc_para3_no_amount: (reg) => `Gemas ${reg} habe ich rechtlichen Anspruch auf Entschadigung fur die erlittene Storung. Dieser Anspruch ist noch nicht erfullt.`,
    esc_para4: (esc) => `Ich fordere eine vollstandige schriftliche Antwort innerhalb von 14 Tagen nach diesem Schreiben. Sollte keine zufriedenstellende Losung erfolgen, werde ich umgehend eine formelle Beschwerde bei ${esc} einreichen und mir alle Rechte auf weitere Rechtsbehelfe vorbehalten, einschliesslich Klagen beim zustandigen Gericht.`,
    esc_sincerely: 'Mit freundlichen Gruen,',
    esc_name_placeholder: '[Ihr vollstandiger Name]',
    esc_email_placeholder: '[Ihre E-Mail-Adresse]',
    escalation_note: 'Hinweis: Aktualisieren Sie das ursprungliche Einreichungsdatum vor dem Versenden.',
    what_to_expect_title: 'Was Sie nach der Einreichung Ihres Anspruchs erwarten konnen',
    section_timeline: 'TYPISCHER ZEITPLAN',
    timeline_1: '1\u20133 Tage: Eingangsbestatigung (die meisten Fluggesellschaften, bei E-Mail-Einreichung).',
    timeline_2: '14\u201330 Tage: Erste Antwort \u2014 kann ein Angebot, eine Ablehnung oder eine Anfrage nach weiteren Informationen sein.',
    timeline_3: '30\u201360 Tage: Vollstandige Losung bei einfachen Anspruchen.',
    timeline_4: '60\u201390 Tage: Komplexere Falle oder Fluggesellschaften, die langsam reagieren.',
    timeline_5: '90+ Tage: Wenden Sie sich an die zustandige Behorde \u2014 warten Sie nicht langer.',
    section_responses: 'HAUFIGE ANTWORTEN DER FLUGGESELLSCHAFT',
    resp_1_head: '"Aussergewohnliche Umstande" oder "hohere Gewalt"',
    resp_1_detail: 'Fluggesellschaften verwenden diese Verteidigung haufig. Wenn die tatsachliche Ursache mechanischer, personalbezogener oder betrieblicher Natur war, gilt diese Verteidigung nicht. Antworten Sie schriftlich und nennen Sie die spezifische Ursache, die nicht der rechtlichen Definition aussergewohnlicher Umstande entspricht.',
    resp_2_head: '"Wir benotigen weitere Informationen"',
    resp_2_detail: 'Antworten Sie umgehend mit den angeforderten Dokumenten \u2014 Buchungsbestatigung, Bordkarten, Korrespondenz. Bewahren Sie Kopien von allem auf, was Sie versenden.',
    resp_3_head: '"Ihr Anspruch wird abgelehnt"',
    resp_3_detail: 'Akzeptieren Sie keine Ablehnung ohne schriftliche Erklarung mit spezifischen rechtlichen Grunden. Verwenden Sie die 30-Tage-Eskalationsvorlage (Seite 5) und reichen Sie eine Beschwerde bei der zustandigen Behorde ein.',
    resp_4_head: 'Keine Antwort nach 14 Tagen',
    resp_4_detail: 'Senden Sie die 14-Tage-Nachfassvorlage (Seite 4). Wenn nach insgesamt 30 Tagen noch keine Antwort eingegangen ist, senden Sie die Eskalationsvorlage und reichen Sie eine Beschwerde bei der unten genannten Behorde ein.',
    resp_5_head: '"Wir bieten Ihnen stattdessen einen Gutschein an"',
    resp_5_detail: 'Sie sind nicht verpflichtet, einen Gutschein anzunehmen. Gemas EU261/UK261/APPR haben Sie Anspruch auf eine Barentschadigung. Antworten Sie schriftlich, dass Sie den Gutschein nicht akzeptieren und eine Barzahlung verlangen.',
    section_your_path: 'IHR ESKALATIONSPFAD',
    path_1: (airline) => `Senden Sie Ihren formellen Entschadigungsanspruchsbrief an ${airline} unter Verwendung der Kontaktdaten im Abschnitt So reichen Sie Ihren Anspruch ein.`,
    path_2: 'Wenn nach 14 Tagen keine Antwort erfolgt, senden Sie die in diesem Kit enthaltene 14-Tage-Nachfassvorlage.',
    path_3: (esc) => `Wenn nach 30 Tagen keine Losung erfolgt, senden Sie die 30-Tage-Eskalationsvorlage und reichen Sie eine Beschwerde bei ${esc} ein.`,
    path_4: 'Wenn die Behorde das Problem nicht innerhalb von 8 Wochen lost, erwaegen Sie alternative Streitbeilegung (ADR) oder das Amtsgericht.',
    final_callout: 'Das Amtsgericht ist in den meisten Rechtsordnungen fur Anspruche dieser Grosse eine praktikable Option und erfordert keinen Anwalt. Die Anmeldegebuhren betragen in der Regel 30\u2013100 GBP (UK), 25\u201375 EUR (EU) oder 75\u2013200 CA$ (Kanada).',
    row_flight_number: 'Flugnummer',
    row_date_of_travel: 'Reisedatum',
    row_route: 'Strecke',
    row_distance: 'Entfernung',
    row_scheduled: 'Geplante Ankunft',
    row_actual: 'Tatsachliche Ankunft',
    row_delay: 'Verspatungsdauer',
    disruption_delay: 'Verspatung',
    disruption_cancel: 'Annullierung',
    disruption_denied: 'Nichtbeforderung',
    disruption_other: 'Storung',
    route_to: (from, to) => `${from} nach ${to}`,
    letter_subject_line: (flightNum, flightDate, regFull) => `Betreff: Flug ${flightNum} am ${flightDate} — Entschadigungsanspruch gemas ${regFull}`,
  },
  es: {
    page_header: 'Kit de compensacion de vuelo',
    footer_branded: 'Preparado con FlightComp \u2014 getflightcomp.com',
    page_counter: (n, total) => `Pagina ${n} de ${total}`,
    claims_overview_title: 'Resumen de la reclamacion',
    claims_overview_sub: 'Un resumen de los detalles de tu reclamacion y que esperar.',
    label_regulation: 'Reglamento',
    label_compensation: 'Compensacion objetivo',
    label_flight: 'Vuelo',
    label_date: 'Fecha',
    section_kit_contains: 'ESTE KIT CONTIENE',
    kit_1: 'Como presentar tu reclamacion \u2014 datos de contacto de la aerolinea e instrucciones paso a paso',
    kit_2: 'Carta formal de reclamacion de compensacion \u2014 personalizada, lista para enviar',
    kit_3: 'Plantilla de seguimiento a 14 dias \u2014 si la aerolinea no ha respondido en 2 semanas',
    kit_4: 'Plantilla de escalada a 30 dias \u2014 si la aerolinea rechaza o ignora tu reclamacion',
    kit_5: 'Guia Que esperar \u2014 respuestas habituales de las aerolineas y como gestionarlas',
    quick_start_label: 'INICIO RAPIDO',
    qs_email: (email) => `Envia la Carta formal de reclamacion de compensacion a ${email}`,
    qs_portal: (airline) => `Presenta tu reclamacion a traves del portal de reclamaciones en linea de ${airline} \u2014 consulta Como presentar tu reclamacion (pagina 2) para obtener instrucciones.`,
    how_to_submit_title: 'Como presentar tu reclamacion',
    airline_line: (airline, reg) => `Aerolinea: ${airline}  \u00B7  Reglamento: ${reg}`,
    section_contact: 'DATOS DE CONTACTO DE LA AEROLINEA',
    send_to: (email) => `Envia tu reclamacion a: ${email}`,
    web_form_para: (airline) => `${airline} acepta reclamaciones a traves de su portal en linea. Busca "${airline} reclamacion compensacion vuelo" para encontrar la pagina de envio. Al rellenar el formulario, utiliza los detalles y las citas legales de la Carta formal de reclamacion incluida en este kit.`,
    unknown_airline_para: (airline, regSearch) => `No disponemos de datos de contacto especificos para ${airline}. Busca "${airline} ${regSearch}" o "${airline} atencion al cliente" para encontrar el contacto correcto.`,
    section_steps: 'INSTRUCCIONES PASO A PASO',
    substep_email_1: (email) => `Envia la Carta formal de reclamacion de compensacion (pagina 3) por correo electronico a: ${email}`,
    substep_email_2: 'Utiliza el asunto de la carta como asunto de tu correo electronico y copia el texto completo de la carta en el cuerpo del mensaje.',
    substep_email_3: 'Guarda una copia del correo enviado y anota la fecha de hoy como tu fecha de envio.',
    substep_email_4: (days, reg, date) => `La aerolinea tiene ${days} dias para responder segun el ${reg}. Si no recibes respuesta antes del ${date}, envia la Plantilla de seguimiento a 14 dias incluida en este kit.`,
    substep_email_5: (escDate, esc) => `Si la aerolinea rechaza tu reclamacion o no recibes una respuesta satisfactoria antes del ${escDate}, envia la Plantilla de escalada a 30 dias y presenta una queja ante ${esc}.`,
    substep_portal_1: (airline) => `Ve al sitio web de ${airline} y busca su portal de reclamaciones o atencion al cliente. Busca "${airline} reclamacion compensacion vuelo" para encontrar la pagina correcta.`,
    substep_portal_2: 'Rellena el formulario en linea de la aerolinea con los datos de tu Carta formal de reclamacion de compensacion (pagina 3). En los campos de texto libre, copia los parrafos clave de tu carta \u2014 especialmente la base legal, los datos del vuelo y el importe de la compensacion.',
    substep_portal_3: 'Guarda o captura tu confirmacion de envio y cualquier numero de referencia que proporcione la aerolinea.',
    substep_portal_4: (days, reg, fuDate, airline) => `La aerolinea tiene ${days} dias para responder segun el ${reg}. Si no recibes respuesta antes del ${fuDate}, presenta el contenido de la Plantilla de seguimiento (pagina 5) a traves del mismo portal o por correo electronico al servicio de atencion al cliente de ${airline}.`,
    substep_portal_5: (escDate, esc) => `Si la aerolinea rechaza tu reclamacion o no recibes una respuesta satisfactoria antes del ${escDate}, utiliza la Plantilla de escalada a 30 dias y presenta una queja ante ${esc}.`,
    section_escalation_authority: 'AUTORIDAD DE ESCALADA',
    escalation_intro: 'Si la aerolinea no resuelve tu reclamacion en 30 dias, puedes presentar gratuitamente una queja ante:',
    formal_letter_title: 'Carta formal de reclamacion de compensacion',
    callout_email: 'Envia esta carta al departamento de reclamaciones de tu aerolinea por correo electronico. Guarda una copia para tus registros.',
    callout_portal: (airline) => `Utiliza el contenido de esta carta cuando presentes tu reclamacion a traves del portal en linea de ${airline}. Copia las citas legales y los detalles de compensacion en los campos de texto del formulario.`,
    customer_relations: 'Atencion al cliente / Departamento de reclamaciones',
    to_whom: 'A quien corresponda,',
    opening_sentence: (reg, disruption) => `Me dirijo a ustedes para reclamar una compensacion estatutaria en virtud del ${reg} por el ${disruption} del vuelo mencionado anteriormente.`,
    section_legal: 'BASE LEGAL Y RECLAMACION',
    closing_payment_pre: (days) => `Solicito que procesen esta reclamacion de compensacion y realicen el pago en un plazo de ${days} dias a partir de esta carta `,
    closing_trust: 'Confio en que gestionaran esta reclamacion con prontitud y de acuerdo con sus obligaciones legales.',
    sign_off: 'Atentamente,',
    dear_sir: 'Estimado/a senor/a,',
    follow_up_title: 'Plantilla de seguimiento a 14 dias',
    follow_up_callout_email: (email, date) => `Envia este seguimiento por correo electronico a ${email} si no has recibido respuesta antes del ${date} (14 dias despues de tu envio inicial).`,
    follow_up_callout_portal: (airline, date) => `Presenta este seguimiento a traves del portal en linea de ${airline}, o contacta directamente con su equipo de atencion al cliente haciendo referencia a tu envio inicial, si no has recibido respuesta antes del ${date}.`,
    section_follow_up: 'CARTA DE SEGUIMIENTO',
    fu_customer_relations: 'Departamento de atencion al cliente',
    fu_re: (flightNum, flightDate) => `Asunto: Seguimiento \u2014 Reclamacion de compensacion para el vuelo ${flightNum} del ${flightDate}`,
    fu_dear: 'Estimado/a senor/a,',
    fu_para1: (today, flightNum, flightDate, from, to) => `Me pongo en contacto para hacer seguimiento de una reclamacion formal de compensacion que presente el ${today} en relacion con el vuelo ${flightNum} del ${flightDate} de ${from} a ${to}.`,
    fu_para2: (reg) => `Aun no he recibido respuesta ni acuse de recibo de mi reclamacion. En virtud del ${reg}, las aerolineas estan obligadas a responder a las reclamaciones de compensacion de los pasajeros en un plazo razonable. Presente mi reclamacion inicial hace 14 dias y todavia no he recibido una respuesta sustantiva.`,
    fu_para3: 'Le ruego que confirme la recepcion de mi reclamacion inicial y proporcione una actualizacion escrita sobre su estado en los 7 dias siguientes a esta carta.',
    fu_para4: (esc) => `Si no recibo respuesta, escalare este asunto a ${esc}.`,
    fu_sincerely: 'Atentamente,',
    fu_name_placeholder: '[Tu nombre completo]',
    fu_email_placeholder: '[Tu correo electronico]',
    follow_up_note: 'Nota: Actualiza la fecha de envio si envias esta carta en un momento diferente.',
    escalation_title: 'Plantilla de escalada a 30 dias',
    esc_callout_email: (email, date) => `Envia esta carta de escalada por correo electronico a ${email} si no has recibido una respuesta satisfactoria antes del ${date} (30 dias despues de tu envio inicial).`,
    esc_callout_portal: (airline, date) => `Presenta esta escalada a traves del portal en linea de ${airline}, o contacta directamente con su servicio de atencion al cliente haciendo referencia a tu reclamacion, si no has recibido una respuesta satisfactoria antes del ${date}.`,
    section_escalation_letter: 'CARTA DE ESCALADA',
    esc_customer_relations: 'Departamento de atencion al cliente',
    esc_re: (flightNum, flightDate) => `Asunto: Aviso de escalada \u2014 Reclamacion de compensacion sin respuesta para el vuelo ${flightNum} del ${flightDate}`,
    esc_dear: 'Estimado/a senor/a,',
    esc_para1: (flightNum, flightDate, from, to) => `Me dirijo a ustedes para escalar formalmente mi reclamacion de compensacion en relacion con el vuelo ${flightNum} del ${flightDate} de ${from} a ${to}.`,
    esc_para2: (today, reg) => `Presente una reclamacion formal el ${today} en virtud del ${reg}. A la fecha de esta carta, no he recibido una respuesta sustantiva ni una resolucion.`,
    esc_para3_amount: (reg, amount) => `En virtud del ${reg}, tengo derecho legal a una compensacion de ${amount} por pasajero. Este importe sigue pendiente.`,
    esc_para3_no_amount: (reg) => `En virtud del ${reg}, tengo derecho legal a una compensacion por la interrupcion sufrida. Esta reclamacion sigue pendiente.`,
    esc_para4: (esc) => `Exijo una respuesta escrita completa en los 14 dias siguientes a esta carta. Si no recibo una resolucion satisfactoria, presentare de inmediato una queja formal ante ${esc} y me reservo todos los derechos para ejercer acciones legales, incluidos procedimientos en el tribunal de reclamaciones de menor cuantia correspondiente.`,
    esc_sincerely: 'Atentamente,',
    esc_name_placeholder: '[Tu nombre completo]',
    esc_email_placeholder: '[Tu correo electronico]',
    escalation_note: 'Nota: Actualiza la fecha de envio de la reclamacion original antes de enviar.',
    what_to_expect_title: 'Que esperar despues de presentar tu reclamacion',
    section_timeline: 'CALENDARIO TIPICO',
    timeline_1: '1\u20133 dias: Acuse de recibo (la mayoria de aerolineas, si envias por correo electronico).',
    timeline_2: '14\u201330 dias: Respuesta inicial \u2014 puede ser una oferta, un rechazo o una solicitud de mas informacion.',
    timeline_3: '30\u201360 dias: Resolucion completa para reclamaciones sencillas.',
    timeline_4: '60\u201390 dias: Casos mas complejos o aerolineas que tardan en responder.',
    timeline_5: '90+ dias: Escala a la autoridad competente \u2014 no esperes mas.',
    section_responses: 'RESPUESTAS COMUNES DE LA AEROLINEA',
    resp_1_head: '"Circunstancias extraordinarias" o "fuerza mayor"',
    resp_1_detail: 'Las aerolineas utilizan frecuentemente esta defensa. Si la causa real fue mecanica, relacionada con la tripulacion u operativa, esta defensa no se aplica. Responde por escrito citando la causa especifica e indicando que no cumple la definicion legal de circunstancias extraordinarias.',
    resp_2_head: '"Necesitamos mas informacion"',
    resp_2_detail: 'Responde rapidamente con los documentos solicitados \u2014 confirmacion de reserva, tarjetas de embarque, correspondencia. Guarda copias de todo lo que envies.',
    resp_3_head: '"Tu reclamacion ha sido rechazada"',
    resp_3_detail: 'No aceptes un rechazo sin una explicacion escrita que cite motivos legales especificos. Utiliza la plantilla de escalada a 30 dias (pagina 5) y presenta una queja ante la autoridad competente.',
    resp_4_head: 'Sin respuesta tras 14 dias',
    resp_4_detail: 'Envia la plantilla de seguimiento a 14 dias (pagina 4). Si sigues sin respuesta tras 30 dias en total, envia la plantilla de escalada y presenta una queja ante la autoridad indicada a continuacion.',
    resp_5_head: '"Te ofrecemos un bono en lugar de dinero"',
    resp_5_detail: 'No estas obligado/a a aceptar un bono. En virtud del EU261/UK261/APPR, tienes derecho a una compensacion en efectivo. Responde por escrito que no aceptas el bono y exiges el pago en efectivo.',
    section_your_path: 'TU RUTA DE ESCALADA',
    path_1: (airline) => `Envia tu Carta formal de reclamacion de compensacion a ${airline} utilizando los datos de contacto de la seccion Como presentar tu reclamacion.`,
    path_2: 'Si no recibes respuesta en 14 dias, envia la Plantilla de seguimiento a 14 dias incluida en este kit.',
    path_3: (esc) => `Si no hay resolucion en 30 dias, envia la Plantilla de escalada a 30 dias y presenta una queja ante ${esc}.`,
    path_4: 'Si la autoridad no resuelve el asunto en 8 semanas, considera la Resolucion Alternativa de Disputas (RAD) o el tribunal de reclamaciones de menor cuantia.',
    final_callout: 'El tribunal de reclamaciones de menor cuantia es una opcion viable en la mayoria de jurisdicciones para reclamaciones de este tamano y no requiere abogado. Las tasas de presentacion suelen ser de 30\u2013100 GBP (RU), 25\u201375 EUR (UE) o 75\u2013200 CA$ (Canada).',
    row_flight_number: 'Numero de vuelo',
    row_date_of_travel: 'Fecha de viaje',
    row_route: 'Ruta',
    row_distance: 'Distancia',
    row_scheduled: 'Llegada programada',
    row_actual: 'Llegada real',
    row_delay: 'Duracion del retraso',
    disruption_delay: 'retraso',
    disruption_cancel: 'cancelacion',
    disruption_denied: 'denegacion de embarque',
    disruption_other: 'interrupcion',
    route_to: (from, to) => `${from} a ${to}`,
    letter_subject_line: (flightNum, flightDate, regFull) => `Asunto: Vuelo ${flightNum} del ${flightDate} — Reclamacion de compensacion en virtud del ${regFull}`,
  },
};

// ── PDF Claim Kit builder ─────────────────────────────
async function buildPdf({ letter, claimData, details, result, flightDetails, language = 'en' }) {
  const { jsPDF } = await import('jspdf');

  // ── Translation helper ──
  const _lang = ['en', 'tr', 'fr', 'de', 'es'].includes(language) ? language : 'en';
  const t = (key, ...args) => {
    const val = PDF_STRINGS[_lang]?.[key] ?? PDF_STRINGS.en[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
  };

  // ── Locale-aware date formatter ──
  const DATE_LOCALES = { en: 'en-GB', tr: 'tr-TR', fr: 'fr-CA', de: 'de-DE', es: 'es-ES' };
  const dateLocale = DATE_LOCALES[_lang] || 'en-GB';

  const fmtDate = (input) => {
    if (!input) return '';
    let d;
    if (input instanceof Date) {
      d = input;
    } else {
      // Parse YYYY-MM-DD as local date to avoid UTC offset issues
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(input));
      d = iso ? new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3])) : new Date(input);
    }
    if (isNaN(d.getTime())) return String(input); // fall back to raw string if unparseable
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ── Layout constants ──
  const PAGE_W = 210, PAGE_H = 297;
  const ML = 25, MR = 25;
  const CONTENT_W = PAGE_W - ML - MR;
  const HEADER_H  = 18;
  const CONTENT_Y = HEADER_H + 14;
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
  // When set, newPage() draws a continuation gray shading box on each new page.
  // { lx, w, vPad } — left x, width, and vertical padding to advance y after drawing.
  let letterBox = null;

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
    doc.text(t('page_header'), ML, 11.5);
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
      doc.text(t('footer_branded'), ML, FOOTER_Y + 5);
    }
    doc.text(t('page_counter', pageNum, TOTAL_ALIAS), PAGE_W - MR, FOOTER_Y + 5, { align: 'right' });
  }

  // ── New page ──
  function newPage() {
    drawFooter(false);
    doc.addPage();
    pageNum++;
    sectionSubtitle = regHeaderText;
    drawPageHeader();
    y = CONTENT_Y;
    // Continue gray shading box when rendering a letter that spans multiple pages
    if (letterBox) {
      setFC(C.GRAY_BG); setDC(C.GRAY_BD); doc.setLineWidth(0.5);
      doc.rect(letterBox.lx, y, letterBox.w, FOOTER_Y - y - 5, 'FD');
      y += letterBox.vPad;
    }
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
  // URLs are intentionally excluded — PDFs are static and links don't work reliably.
  // Airlines with web-form-only contact get a search instruction via renderPara instead.
  function drawContactBox(contact) {
    const lines = [];
    if (contact.claimsEmail) lines.push(['Email', contact.claimsEmail]);
    // claimsFormUrl is deliberately not rendered here
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
    doc.rect(ML, y, CONTENT_W, Math.min(totalH, FOOTER_Y - y - 10), 'FD');
    // Activate shading so page breaks within this letter continue the gray box
    letterBox = { lx: ML, w: CONTENT_W, vPad: PAD };
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
    letterBox = null; // end template letter shading
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
  const flightNum      = claimData?.flightNumber || '';
  const flightDateRaw  = claimData?.flightDate   || '';
  const flightDate     = fmtDate(flightDateRaw);  // localized human-readable
  const fromCode       = claimData?.from || '';
  const toCode       = claimData?.to   || '';

  // Airline contact lookup — prefer airlineCode, fall back to flight number prefix
  const airlineIATA   = claimData?.airlineCode || flightNum.trim().toUpperCase().replace(/\s/g, '').slice(0, 2);
  const airlineContact = getAirlineContact(airlineIATA);
  const airlineName   = airlineContact?.name || 'The Airline';
  const escalation    = getEscalationAuthority(regulation, result?.depInfo);
  const deadlineDays  = getResponseDeadlineDays(regulation);

  const todayStr = fmtDate(new Date());
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);
  const deadlineDateStr = fmtDate(deadlineDate);

  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 14);
  const followUpDateStr = fmtDate(followUpDate);

  const escalationDate = new Date();
  escalationDate.setDate(escalationDate.getDate() + 30);
  const escalationDateStr = fmtDate(escalationDate);

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

  // Search-hint keyword used in airline contact fallback messages on page 2
  const regSearchTerm =
    regulation === 'UK261' ? 'UK261 claim'
    : regulation === 'APPR' ? 'Canada flight compensation'
    : regulation === 'SHY'  ? 'Turkey flight compensation'
    : 'EU261 claim';

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

  // flightDate is already locale-formatted; flightDateFmt kept for downstream compatibility
  const flightDateFmt = flightDate;

  // Replace ISO dates (YYYY-MM-DD) in AI letter body text with locale-formatted dates
  const fmtDatesInText = (text) => {
    if (!text) return text;
    return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, yr, mo, dy) =>
      new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy))
        .toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    );
  };

  // ═══════════════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════════════
  // Draw cover header with regulation subtitle
  sectionSubtitle = regHeaderText;
  drawPageHeader();
  y = CONTENT_Y;

  // Title block
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); setTC(C.TEXT_PRI);
  doc.text(t('claims_overview_title'), ML, y); y += 9;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); setTC(C.TEXT_LABEL);
  doc.text(t('claims_overview_sub'), ML, y); y += 10;

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
  drawSumRow(t('label_regulation'), regFull, col1);
  drawSumRow(t('label_compensation'), compAmount || 'See letter', col2);
  bly += 16;
  drawSumRow(t('label_flight'), flightNum || '—', col1);
  drawSumRow(t('label_date'), flightDateFmt || '—', col2);
  y += SUMBOX_H + 8;

  // "This kit contains" list
  drawSection(t('section_kit_contains'));
  const kitItems = [
    ['1', t('kit_1')],
    ['2', t('kit_2')],
    ['3', t('kit_3')],
    ['4', t('kit_4')],
    ['5', t('kit_5')],
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
  doc.text(t('quick_start_label'), ML + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_BODY);
  const qs = airlineContact?.claimsEmail
    ? t('qs_email', airlineContact.claimsEmail)
    : t('qs_portal', airlineName);
  const qsLines = doc.splitTextToSize(qs, CONTENT_W - 10);
  doc.text(qsLines, ML + 5, y + 13);
  y += 26;

  // ═══════════════════════════════════════════════
  // PAGE 2 — HOW TO SUBMIT YOUR CLAIM
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text(t('how_to_submit_title'), ML, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_LABEL);
  doc.text(t('airline_line', airlineName, regFull), ML, y); y += 10;

  // Contact block
  drawSection(t('section_contact'));
  if (airlineContact?.claimsEmail || airlineContact?.mailingAddress) {
    // Has a direct contact — show email and/or mailing address (no URLs)
    drawContactBox(airlineContact);
    if (airlineContact.claimsEmail) {
      renderPara(t('send_to', airlineContact.claimsEmail));
    }
    if (airlineContact.webFormOnly || (!airlineContact.claimsEmail && airlineContact.claimsFormUrl)) {
      // Should not normally reach here, but guard just in case
      renderPara(t('web_form_para', airlineName));
    }
  } else if (airlineContact?.claimsFormUrl || airlineContact?.webFormOnly) {
    // Web-form-only airline — no printable URL, give search instructions
    renderPara(t('web_form_para', airlineName));
  } else {
    // Unknown airline
    renderPara(t('unknown_airline_para', airlineName, regSearchTerm));
  }

  // Step-by-step — instructions differ based on whether airline accepts email or web-form only
  drawSection(t('section_steps'));
  const subSteps = airlineContact?.claimsEmail ? [
    t('substep_email_1', airlineContact.claimsEmail),
    t('substep_email_2'),
    t('substep_email_3'),
    t('substep_email_4', deadlineDays, regFull, followUpDateStr),
    t('substep_email_5', escalationDateStr, escalation.name, regFull),
  ] : [
    t('substep_portal_1', airlineName),
    t('substep_portal_2'),
    t('substep_portal_3'),
    t('substep_portal_4', deadlineDays, regFull, followUpDateStr, airlineName),
    t('substep_portal_5', escalationDateStr, escalation.name),
  ];
  subSteps.forEach((step, i) => drawStep(i + 1, step));

  y += 4;
  drawSection(t('section_escalation_authority'));
  renderPara(t('escalation_intro'));
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

  // ═══════════════════════════════════════════════
  // PAGE 3 — CLAIM LETTER
  // ═══════════════════════════════════════════════
  newPage();

  // Section title + instruction — styled to match follow-up/escalation pages
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text(t('formal_letter_title'), ML, y); y += 8;
  drawCallout(
    airlineContact?.claimsEmail
      ? t('callout_email')
      : t('callout_portal', airlineName),
    C.LT_BLUE_BG, C.LT_BLUE_BD
  );

  // Gray shading behind letter body — continues across pages via letterBox
  const LPAD = 4;
  letterBox = { lx: ML - LPAD, w: CONTENT_W + LPAD * 2, vPad: LPAD };
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

  // Date — appears once
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
  checkPage(); doc.text(todayStr, ML, y); y += 8;

  // Flight details table — before recipient so it reads like a reference block
  const flightRows = [
    flightNum                               && [t('row_flight_number'),  flightNum],
    flightDate                              && [t('row_date_of_travel'), flightDateFmt],
    (fromIATA && toIATA)                    && [t('row_route'),          t('route_to', fromIATA, toIATA)],
    result?.distanceKm                      && [t('row_distance'),       `${result.distanceKm.toLocaleString()} km`],
    flightDetails?.scheduledTime            && [t('row_scheduled'),      flightDetails.scheduledTime],
    flightDetails?.actualTime               && [t('row_actual'),         flightDetails.actualTime],
    delayInfo                               && [t('row_delay'),          delayInfo.label],
  ].filter(Boolean);
  if (flightRows.length) { drawTableBox(flightRows); y += 2; }

  // Recipient address
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTC(C.TEXT_BODY);
  doc.text(t('customer_relations'), ML, y); y += 5;
  doc.text(airlineName, ML, y); y += 8;

  // Subject line — localized per language
  const subjLine = t('letter_subject_line', flightNum, flightDateFmt, regFull);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setTC(C.TEXT_PRI);
  const subjLines = doc.splitTextToSize(subjLine, CONTENT_W);
  for (const sl of subjLines) { doc.text(sl, ML, y); y += 6.5; }
  y += 0.5;
  setDC(C.BRAND_BLUE); doc.setLineWidth(0.7);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 7;

  // Salutation
  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_BODY);
  checkPage(); doc.text(t('to_whom'), ML, y); y += 8;

  // Filter body paragraphs — strip header/salutation/sender/closing duplicates from AI letter
  const filteredBodyParas = bodyParas.filter(p => {
    const txt = p.trim();
    if (!txt) return false;
    // Strip common salutations the scaffolding already draws
    if (/^dear\s/i.test(txt)) return false;
    if (/^to whom it may concern/i.test(txt)) return false;
    if (/^sayın\s/i.test(txt)) return false;          // Turkish salutation
    if (/^estimad[oa]\/a\s/i.test(txt)) return false; // Spanish salutation
    if (/^sehr geehrte/i.test(txt)) return false;     // German salutation
    if (/^madame,?\s*monsieur/i.test(txt)) return false; // French salutation
    // Strip lone "Customer Relations" lines
    if (/^customer relations/i.test(txt)) return false;
    if (/^müşteri ilişkileri/i.test(txt)) return false;
    if (/^service client/i.test(txt)) return false;
    if (/^kundenservice/i.test(txt)) return false;
    if (/^atención al cliente/i.test(txt)) return false;
    // Strip lone date lines (e.g. "20 April 2026")
    if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(txt)) return false;
    // Strip sender name / email (catches Claude's self-added closings)
    if (senderName && txt.includes(senderName)) return false;
    if (senderEmail && txt.includes(senderEmail)) return false;
    // Strip closings in all 5 languages
    if (/^(sincerely|yours faithfully|yours sincerely|regards|kind regards)/i.test(txt)) return false;
    if (/^(saygılarımla|saygılarımızla)/i.test(txt)) return false;         // Turkish
    if (/^(cordialement|veuillez agréer|sincères salutations)/i.test(txt)) return false; // French
    if (/^(mit freundlichen grüßen|hochachtungsvoll)/i.test(txt)) return false; // German
    if (/^(atentamente|cordialmente|un saludo)/i.test(txt)) return false;  // Spanish
    // Strip subject-line duplicates (scaffolding now draws its own)
    if (/^(re:|konu:|objet\s*:|betreff:|asunto:)/i.test(txt)) return false;
    // Strip "I am writing to..." opening (replaced by fixed opening sentence)
    if (/^i am writing to/i.test(txt)) return false;
    if (/^size bu mektubu/i.test(txt)) return false;
    return true;
  });

  // Fixed opening sentence — references flight details box, avoids repetition
  const disruptionType =
    claimData?.disruption === 'delayed'    ? t('disruption_delay')
    : claimData?.disruption === 'cancelled'  ? t('disruption_cancel')
    : claimData?.disruption === 'denied'     ? t('disruption_denied')
    : t('disruption_other');
  renderPara(t('opening_sentence', regFull, disruptionType));

  // Legal basis — all filtered body paragraphs with date formatting applied
  if (filteredBodyParas.length > 0) {
    drawSection(t('section_legal'));
    for (const para of filteredBodyParas) renderPara(fmtDatesInText(para));
  }

  // Closing — payment request with deadline date in red
  y += 4;
  renderSegs([
    { text: t('closing_payment_pre', deadlineDays), bold: false, color: C.TEXT_BODY },
    { text: `(${deadlineDateStr})`, bold: true, color: C.RED },
    { text: '.', bold: false, color: C.TEXT_BODY },
  ]);
  renderPara(t('closing_trust'));
  y += 2;

  // Sign-off — sender name + email only; no duplicate date (Change 5, item 7)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_BODY);
  checkPage(); doc.text(t('sign_off'), ML, y); y += 14;
  if (senderName) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); setTC(C.TEXT_PRI);
    checkPage(); doc.text(senderName, ML, y); y += LINE_H;
  }
  if (senderEmail) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTC(C.TEXT_LABEL);
    checkPage(); doc.text(senderEmail, ML, y); y += LINE_H;
  }
  letterBox = null; // end claim letter shading

  // ═══════════════════════════════════════════════
  // 14-DAY FOLLOW-UP PAGE
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text(t('follow_up_title'), ML, y); y += 8;

  drawCallout(
    airlineContact?.claimsEmail
      ? t('follow_up_callout_email', airlineContact.claimsEmail, followUpDateStr)
      : t('follow_up_callout_portal', airlineName, followUpDateStr),
    C.LT_BLUE_BG, C.LT_BLUE_BD
  );

  drawSection(t('section_follow_up'));
  drawTemplateLetter([
    followUpDateStr,
    '',
    t('fu_customer_relations'),
    airlineName,
    '',
    t('fu_re', flightNum, flightDateFmt),
    '',
    t('fu_dear'),
    '',
    t('fu_para1', todayStr, flightNum, flightDateFmt, fromIATA, toIATA),
    '',
    t('fu_para2', regFull),
    '',
    t('fu_para3'),
    '',
    t('fu_para4', escalation.name),
    '',
    t('fu_sincerely'),
    senderName || t('fu_name_placeholder'),
    senderEmail || t('fu_email_placeholder'),
  ].filter(s => s !== null));

  y += 4;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); setTC(C.TEXT_MUTED);
  doc.text(t('follow_up_note'), ML, y); y += 8;

  // ═══════════════════════════════════════════════
  // 30-DAY ESCALATION PAGE
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text(t('escalation_title'), ML, y); y += 8;

  drawCallout(
    airlineContact?.claimsEmail
      ? t('esc_callout_email', airlineContact.claimsEmail, escalationDateStr)
      : t('esc_callout_portal', airlineName, escalationDateStr),
    [255, 247, 237], [254, 215, 170]
  );

  drawSection(t('section_escalation_letter'));
  drawTemplateLetter([
    escalationDateStr,
    '',
    t('esc_customer_relations'),
    airlineName,
    '',
    t('esc_re', flightNum, flightDateFmt),
    '',
    t('esc_dear'),
    '',
    t('esc_para1', flightNum, flightDateFmt, fromIATA, toIATA),
    '',
    t('esc_para2', todayStr, regFull),
    '',
    compAmount
      ? t('esc_para3_amount', regFull, compAmount)
      : t('esc_para3_no_amount', regFull),
    '',
    t('esc_para4', escalation.name),
    '',
    t('esc_sincerely'),
    senderName || t('esc_name_placeholder'),
    senderEmail || t('esc_email_placeholder'),
  ].filter(s => s !== null));

  y += 4;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); setTC(C.TEXT_MUTED);
  doc.text(t('escalation_note'), ML, y); y += 8;

  // ═══════════════════════════════════════════════
  // WHAT TO EXPECT PAGE
  // ═══════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTC(C.TEXT_PRI);
  doc.text(t('what_to_expect_title'), ML, y); y += 10;

  drawSection(t('section_timeline'));
  const timeline = [
    t('timeline_1'),
    t('timeline_2'),
    t('timeline_3'),
    t('timeline_4'),
    t('timeline_5'),
  ];
  for (const t of timeline) renderPara(t, { gap: 3 });
  y += 3;

  drawSection(t('section_responses'));
  const responses = [
    [t('resp_1_head'), t('resp_1_detail')],
    [t('resp_2_head'), t('resp_2_detail')],
    [t('resp_3_head'), t('resp_3_detail')],
    [t('resp_4_head'), t('resp_4_detail')],
    [t('resp_5_head'), t('resp_5_detail')],
  ];
  for (const [heading, detail] of responses) {
    checkPage(20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setTC(C.DARK_BLUE);
    const headLines = doc.splitTextToSize(heading, CONTENT_W);
    doc.text(headLines, ML, y); y += headLines.length * 4.5 + 1;
    renderPara(detail, { gap: 6 });
  }

  drawSection(t('section_your_path'));
  drawStep(1, t('path_1', airlineName));
  drawStep(2, t('path_2'));
  drawStep(3, t('path_3', escalation.name));
  drawStep(4, t('path_4'));

  y += 3;
  drawCallout(t('final_callout'), C.GRAY_BG, C.GRAY_BD);

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
  const [language, setLanguage] = useState('en');
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
    const lang = answers?.language;
    if (lang && ['en', 'tr', 'fr', 'de', 'es'].includes(lang)) setLanguage(lang);
    trackEvent('kit_purchase_completed');
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
          language: language || 'en',
        }),
      });
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setLetter(json.letter);
      setState('ready');
      sessionStorage.removeItem('fc_claim');
      // Client-side fallback — webhook is the source of truth; this runs in case
      // the webhook fires before the session is available or is delayed.
      // stripeSessionId enables deduplication so both never create duplicate records.
      const stripeSessionId = new URLSearchParams(window.location.search).get('session_id') || null;
      fetch('/api/save-kit-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: claimData, result, details, stripeSessionId }),
      }).catch(() => {});
      // Mark email_captures row as converted (kit purchased)
      if (details?.email) {
        fetch('/api/mark-converted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: details.email }),
        }).catch(() => {});
      }
    } catch {
      setState('error');
    }
  }

  async function downloadPdf() {
    if (!letter) return;
    setPdfLoading(true);
    try {
      const doc = await buildPdf({ letter, claimData, details, result, flightDetails, language });
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

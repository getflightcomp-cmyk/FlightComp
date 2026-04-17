import { useState } from 'react';
import Head from 'next/head';
import { assessClaim, assessClaimAPPR, assessClaimSHY, detectRegulation, tryResolveAirport } from '../lib/eu261';
import { resolveAirline, getCarrierRegion, isLargeCanadianCarrier } from '../lib/carriers';

/* ══════════════════════════════════════════════════════
   Deutsche Lokalisierung — eigenständige Seite
   Canonical: https://www.getflightcomp.com/de
   Abdeckung: EU261 / UK261 / APPR / SHY (gleiche Logik, DE-Strings)
══════════════════════════════════════════════════════ */

function ProgressBar({ step, total, onBack }) {
  return (
    <div className="prog-wrap">
      <div className="prog-head">
        <button className="prog-back" onClick={onBack}>
          ← Zurück
        </button>
        <span className="prog-step">{step}/{total}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

function Q1Disruption({ value, onChange }) {
  const opts = [
    { value: 'delayed',    icon: '⏱️', title: 'Verspätet',        sub: 'Flug hat sich verspätet' },
    { value: 'cancelled',  icon: '✕',  title: 'Annulliert',        sub: 'Flug hat nicht stattgefunden' },
    { value: 'denied',     icon: '🚫', title: 'Nichtbeförderung',  sub: 'Sie wurden nicht an Bord gelassen' },
    { value: 'downgraded', icon: '⬇️', title: 'Herabstufung',      sub: 'In eine niedrigere Klasse eingestuft als gebucht' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={1} total={6} onBack={() => history.back()} />
      <div className="q-body">
        <div className="q-label">Frage 1 von 6</div>
        <h2 className="q-head">Was ist mit Ihrem Flug passiert?</h2>
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

function Q2FlightNumber({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={2} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 2 von 6</div>
        <h2 className="q-head">Wie lautete Ihre Flugnummer?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="z. B. LH 123"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <p className="q-helper">
          Diese finden Sie auf Ihrer Bordkarte oder Buchungsbestätigung.{' '}
          <strong>Lassen Sie das Feld leer, falls unbekannt.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Weiter →</button>
      </div>
    </div>
  );
}

function Q3Date({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={3} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 3 von 6</div>
        <h2 className="q-head">Wann hat der Flug stattgefunden?</h2>
        <input
          className="inp inp-date"
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          autoFocus
        />
        <p className="q-helper">
          EU261-Ansprüche: <strong>3-Jahres-Frist</strong> (6&nbsp;Jahre UK261, 1&nbsp;Jahr APPR).
          Auch ältere Flüge können geprüft werden.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!value}>Weiter →</button>
      </div>
    </div>
  );
}

function Q4Route({ from, to, onFromChange, onToChange, onNext, onBack }) {
  const fromResolved = from.trim().length > 2 ? tryResolveAirport(from) : true;
  const toResolved   = to.trim().length > 2   ? tryResolveAirport(to)   : true;
  const fromWarn = from.trim().length > 2 && !fromResolved;
  const toWarn   = to.trim().length > 2   && !toResolved;
  return (
    <div className="screen">
      <ProgressBar step={4} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 4 von 6</div>
        <h2 className="q-head">Wie war Ihre Route?</h2>
        <div className="route-row">
          <div className="route-wrap">
            <span className="route-lbl">Von</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Code oder Stadt (z. B. FRA, Frankfurt)"
              value={from}
              onChange={e => onFromChange(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {fromWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                Flughafen nicht erkannt. Versuchen Sie den 3-Buchstaben-Code (z.&nbsp;B. FRA, LHR, CDG).
              </span>
            )}
          </div>
          <div className="route-arrow">↓</div>
          <div className="route-wrap">
            <span className="route-lbl">Nach</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Code oder Stadt (z. B. LHR, London)"
              value={to}
              onChange={e => onToChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {toWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                Flughafen nicht erkannt. Versuchen Sie den 3-Buchstaben-Code (z.&nbsp;B. FRA, LHR, CDG).
              </span>
            )}
          </div>
        </div>
        <p className="q-helper">
          Gilt für Flüge ab <strong>EU/EWR/UK-Flughäfen</strong> (EU261/UK261), <strong>kanadischen Flughäfen</strong> (APPR) und Flüge in der <strong>Türkei</strong> (SHY).
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!from.trim() || !to.trim()}>
          Weiter →
        </button>
      </div>
    </div>
  );
}

function QAirline({ value, onChange, onNext, onBack }) {
  const resolved = value.trim().length > 1 ? resolveAirline(value) : true;
  const showWarn = value.trim().length > 2 && !resolved;
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 5 von 7</div>
        <h2 className="q-head">Welche Fluggesellschaft hat Ihren Flug durchgeführt?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="z. B. Lufthansa oder LH"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {showWarn && (
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            Fluggesellschaft nicht erkannt. Versuchen Sie den 2-Buchstaben-IATA-Code (z.&nbsp;B. LH, BA, AF) oder lassen Sie das Feld leer.
          </span>
        )}
        <p className="q-helper">
          Geben Sie den Namen oder IATA-Code ein (z.&nbsp;B. LH, BA, AF).{' '}
          <strong>Lassen Sie das Feld leer, falls unbekannt.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Weiter →</button>
      </div>
    </div>
  );
}

function Q5Delay({ value, onChange, disruption, onBack }) {
  const opts = [
    { value: 'under2', title: 'Weniger als 2 Stunden' },
    { value: '2to3',   title: '2 bis 3 Stunden' },
    { value: '3to4',   title: '3 bis 4 Stunden' },
    { value: '4plus',  title: '4 Stunden oder mehr' },
  ];
  if (disruption !== 'delayed') return null;
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 5 von 6</div>
        <h2 className="q-head">Wie lang war die Verspätung bei der Ankunft?</h2>
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
          EU261 erfordert eine <strong>Verspätung von mindestens 3 Stunden am Zielort</strong>.
        </p>
      </div>
    </div>
  );
}

function Q6Reason({ value, onChange, onBack }) {
  const opts = [
    { value: 'technical', icon: '🔧', title: 'Technisches / mechanisches Problem', sub: 'Flugzeugdefekt, Wartungsproblem' },
    { value: 'crew',      icon: '👥', title: 'Personalmangel',                      sub: 'Fehlendes Personal, Zeitprobleme' },
    { value: 'weather',   icon: '🌩️', title: 'Wetterbedingungen',                  sub: 'Sturm, Nebel, Eis oder ATC-Beschränkungen' },
    { value: 'none',      icon: '❓', title: 'Kein Grund angegeben',                sub: 'Die Fluggesellschaft hat nichts erklärt' },
    { value: 'other',     icon: '📋', title: 'Sonstiges',                           sub: 'Streik, Flughafenüberlastung usw.' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={6} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 6 von 6</div>
        <h2 className="q-head">Welchen Grund hat die Fluggesellschaft angegeben?</h2>
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

function Q5SHYDelay({ value, onChange, onBack }) {
  const opts = [
    { value: 'under2', title: 'Weniger als 2 Stunden' },
    { value: '2to3',   title: '2 bis 3 Stunden' },
    { value: '3to4',   title: '3 bis 4 Stunden' },
    { value: '4plus',  title: '5 Stunden oder mehr' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 5 von 6</div>
        <h2 className="q-head">Wie lang war die Verspätung bei der Ankunft?</h2>
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
          Hinweis: Nach türkischem SHY-Recht <strong>begründen Verspätungen keinen Anspruch auf finanzielle Entschädigung</strong> — nur Betreuungsrechte (Verpflegung, Unterkunft) gelten.
        </p>
      </div>
    </div>
  );
}

function QSHYReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'airline',      icon: '🔧', title: 'Verantwortlichkeit der Fluggesellschaft', sub: 'Technisches Problem, Personalmangel, Überbuchung, operatives Problem' },
    { value: 'forcemajeure', icon: '🌩️', title: 'Höhere Gewalt',                           sub: 'Extremwetter, politische Instabilität, Naturkatastrophe, Flughafenstreik, Sicherheitsrisiko' },
    { value: 'unknown',      icon: '❓', title: 'Kein Grund angegeben',                    sub: 'Die Fluggesellschaft hat nichts erklärt' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage {step} von {total}</div>
        <h2 className="q-head">Was hat den Vorfall verursacht?</h2>
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
        <p className="q-helper">
          Technische Defekte und Personalmangel <strong>gelten gemäß SHY nicht</strong> als höhere Gewalt — sie fallen in die Verantwortung der Fluggesellschaft.
        </p>
      </div>
    </div>
  );
}

function QSHYNotified({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'yes', icon: '✓', title: 'Ja, 14+ Tage im Voraus',       sub: 'Ich wurde mindestens 14 Tage vor Abflug benachrichtigt' },
    { value: 'no',  icon: '✕', title: 'Nein – weniger als 14 Tage',    sub: 'Ich wurde weniger als 14 Tage vorher oder am Flughafen informiert' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage {step} von {total}</div>
        <h2 className="q-head">Wurden Sie im Voraus über die Annullierung informiert?</h2>
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
        <p className="q-helper">
          SHY verpflichtet Fluggesellschaften zur Entschädigung bei Annullierungen nur, wenn die Benachrichtigung <strong>weniger als 14 Tage</strong> vor Abflug erfolgt.
        </p>
      </div>
    </div>
  );
}

function Q5APPR({ value, onChange, onBack }) {
  const opts = [
    { value: 'under3', title: 'Weniger als 3 Stunden' },
    { value: '3to6',   title: '3 bis 6 Stunden' },
    { value: '6to9',   title: '6 bis 9 Stunden' },
    { value: '9plus',  title: '9 Stunden oder mehr' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage 5 von 7</div>
        <h2 className="q-head">Wie lang war die Verspätung bei der Ankunft?</h2>
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
          APPR-Entschädigung beginnt ab einer <strong>Verspätung von 3 Stunden am Zielort</strong>.
        </p>
      </div>
    </div>
  );
}

function QAirlineSize({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'large',   icon: '✈️', title: 'Große Fluggesellschaft',   sub: 'Air Canada, WestJet, Porter, Sunwing, Swoop, Flair, Air Transat' },
    { value: 'small',   icon: '🛩️', title: 'Kleine Fluggesellschaft',  sub: 'Regionaler oder Charter-Beförderer, der oben nicht aufgeführt ist' },
    { value: 'unknown', icon: '❓', title: 'Nicht sicher',              sub: 'Es gelten die Sätze für große Fluggesellschaften' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage {step} von {total}</div>
        <h2 className="q-head">Wie groß ist die Fluggesellschaft?</h2>
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
        <p className="q-helper">
          Die APPR-Entschädigungsbeträge unterscheiden sich je nach Größe der Fluggesellschaft.
        </p>
      </div>
    </div>
  );
}

function QAPPRReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'controlled',   icon: '🔧', title: 'Im Einflussbereich der Fluggesellschaft',       sub: 'Technisches Problem, Personalmangel, Planung, Überbuchung' },
    { value: 'safety',       icon: '⚠️', title: 'Sicherheitsbedingt',                            sub: 'Sicherheitsproblem, das die Stilllegung des Flugzeugs erfordert' },
    { value: 'uncontrolled', icon: '🌩️', title: 'Außerhalb des Einflussbereichs der Fluggesellschaft', sub: 'Extremwetter, ATC, Flughafensicherheit, Vogelschlag' },
    { value: 'unknown',      icon: '❓', title: 'Kein Grund angegeben',                          sub: 'Die Fluggesellschaft hat nichts erklärt' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Frage {step} von {total}</div>
        <h2 className="q-head">Was hat den Vorfall verursacht?</h2>
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

const VERDICT_META_DE = {
  likely:   { badge: 'SIE HABEN WAHRSCHEINLICH ANSPRUCH AUF ENTSCHÄDIGUNG',         dot: '🟢' },
  possibly: { badge: 'SIE KÖNNTEN ANSPRUCH AUF ENTSCHÄDIGUNG HABEN',                dot: '🟡' },
  unlikely: { badge: 'SIE HABEN WAHRSCHEINLICH KEINEN ANSPRUCH AUF ENTSCHÄDIGUNG',  dot: '🔴' },
};

const DISRUPTION_LABELS_DE = {
  cancelled:  'Annullierung',
  delayed:    'Verspätung',
  denied:     'Nichtbeförderung',
  downgraded: 'Herabstufung',
};

function ResultsScreen({ result, answers, onGetLetter, onReset }) {
  const [notifyEmail, setNotifyEmail]     = useState('');
  const [notified, setNotified]           = useState(false);
  const [captureEmail, setCaptureEmail]   = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle');

  const { verdict, regulation, compensation, verdictNote, careRights, distanceKm, shyMeta } = result;
  const meta = VERDICT_META_DE[verdict] ?? VERDICT_META_DE.likely;
  const amountDisplay = compensation?.amount || (verdict !== 'unlikely' ? '€250–€600' : null);
  const isSHYDelay = regulation === 'SHY' && answers.disruption === 'delayed';
  const showPrimaryCTA = verdict === 'likely' || verdict === 'possibly' || isSHYDelay;
  const showSecondaryCTA = (verdict === 'likely' || verdict === 'possibly') && !isSHYDelay;

  function handleNotify(e) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
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

  const regLabel = regulation === 'UK261'
    ? 'UK261/2004'
    : regulation === 'APPR'
    ? 'APPR — Luftfahrt-Fluggastschutzverordnung (SOR/2019-150)'
    : regulation === 'SHY'
    ? 'SHY — Türkische Fluggastrechteverordnung'
    : 'EU-Verordnung 261/2004';

  return (
    <div className="res">
      <div className={`vbanner ${verdict}`}>
        <div className="veyebrow">{meta.dot} Ihr Ergebnis</div>
        <div className="vbadge">{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="vamount">{amountDisplay}</div>
            <div className="vreg">gemäß {regLabel}</div>
          </>
        ) : (
          <div className="vreg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Keine Barentschädigung — Betreuungsrechte können gelten
          </div>
        )}
        {verdictNote && <p className="vnote">{verdictNote}</p>}
        {shyMeta && (
          <div className="vnote" style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            <strong>Frist:</strong> {shyMeta.deadline}<br />
            <strong>Eskalation:</strong> {shyMeta.escalation}
          </div>
        )}
      </div>

      <div className="res-body">

        {verdict !== 'unlikely' && regulation && (
          <div className="reg-citation">
            {regulation === 'EU261' && (
              <>Gemäß <strong>EU-Verordnung 261/2004, Art.&nbsp;7(1)</strong> könnten Sie Anspruch auf eine Entschädigung von <strong>{amountDisplay}</strong> haben. Art.&nbsp;5(1)(c) verpflichtet Fluggesellschaften zur Entschädigung bei Annullierungen, sofern die Passagiere nicht mindestens 14&nbsp;Tage im Voraus informiert wurden.</>
            )}
            {regulation === 'UK261' && (
              <>Gemäß <strong>UK-Verordnung 261 (beibehaltenes EU-Recht), Art.&nbsp;7(1)</strong> könnten Sie Anspruch auf eine Entschädigung von <strong>{amountDisplay}</strong> haben. Die britische Civil Aviation Authority (CAA) setzt diese Rechte für Flüge ab UK-Flughäfen durch.</>
            )}
            {regulation === 'APPR' && (
              <>Gemäß der <strong>kanadischen Luftfahrt-Fluggastschutzverordnung (SOR/2019-150), § 19(1)</strong> könnten Sie Anspruch auf <strong>{amountDisplay}</strong> haben. Die Canadian Transportation Agency nimmt Beschwerden entgegen.</>
            )}
            {regulation === 'SHY' && (
              <>Gemäß der <strong>türkischen SHY-Verordnung über Fluggastrechte</strong> könnten Sie für internationale Flüge Anspruch auf <strong>{amountDisplay}</strong> haben. Die türkische Generaldirektion der Zivilluftfahrt (DGCA) setzt diese Rechte durch.</>
            )}
          </div>
        )}

        {showPrimaryCTA && (() => {
          const disruptionMap = {
            cancelled:  'Annullierung',
            delayed:    'Verspätung von mehr als 3 Stunden',
            denied:     'Nichtbeförderung',
            downgraded: 'Herabstufung',
          };
          const params = new URLSearchParams();
          if (answers.flightNumber) params.set('flight',       answers.flightNumber);
          if (answers.flightDate)   params.set('date',         answers.flightDate);
          if (answers.from)         params.set('from',         answers.from);
          if (answers.to)           params.set('to',           answers.to);
          if (answers.disruption)   params.set('disruption',   disruptionMap[answers.disruption] || answers.disruption);
          if (regulation)           params.set('regulation',   regulation);
          if (compensation?.amount) params.set('compensation', compensation.amount);
          params.set('lang', 'de');
          const authorizeUrl = `/authorize?${params.toString()}`;

          let airlineName = 'der Fluggesellschaft';
          try {
            const carrier = resolveAirline(answers.flightNumber);
            if (carrier?.name) airlineName = carrier.name;
          } catch { /* Standard beibehalten */ }

          return (
            <div className="cta-handle">
              <div className="cta-handle-top">
                <span className="cta-handle-title">Lassen Sie uns Ihre Forderung übernehmen</span>
              </div>
              <div className="cta-howit">
                <div className="cta-step"><span className="cta-step-n">1</span><span>Sie ermächtigen uns, in Ihrem Namen zu handeln.</span></div>
                <div className="cta-step"><span className="cta-step-n">2</span><span>Wir reichen Ihre Forderung direkt bei {airlineName} ein.</span></div>
                <div className="cta-step"><span className="cta-step-n">3</span><span>Wir übernehmen alle weiteren Schritte und Eskalationen.</span></div>
                <div className="cta-step"><span className="cta-step-n">4</span><span>Sie zahlen nur bei Erfolg – 25&nbsp;% Provision. Kein Erfolg, keine Gebühr.</span></div>
              </div>
              <a className="btn-authorize" href={authorizeUrl}>
                Autorisierung starten →
              </a>
              <div className="notify-fallback">
                <p className="notify-fallback-label">Noch nicht bereit? Hinterlassen Sie Ihre E-Mail und wir melden uns.</p>
                {notified ? (
                  <div className="notify-success">✓ Erhalten – wir melden uns bald.</div>
                ) : (
                  <form className="notify-row" onSubmit={handleNotify}>
                    <input
                      className="notify-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Ihre E-Mail-Adresse"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      required
                    />
                    <button className="btn-notify" type="submit" disabled={!notifyEmail.trim()}>
                      Benachrichtigen
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {showSecondaryCTA && (
          <div className="cta-diy">
            <div className="cta-diy-head">
              <span className="cta-diy-title">Holen Sie sich Ihr Entschädigungs-Kit</span>
              <span className="cta-diy-price">$14.99</span>
            </div>
            <p className="cta-diy-desc">
              Ein vollständiges {regulation} Entschädigungs-Kit: personalisierter Forderungsbrief, Einreichungsleitfaden, Nachfass- und Eskalationsvorlagen. Als PDF herunterladen und selbst einreichen.
            </p>
            <button className="btn-diy" onClick={onGetLetter}>
              Mein Entschädigungs-Kit holen – $14.99
            </button>
          </div>
        )}

        <Expander icon="🛡️" label="Was die Fluggesellschaft Ihnen jetzt zur Verfügung stellen muss">
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
              Für dieses Störungsniveau gelten keine sofortigen Betreuungspflichten.
            </p>
          )}
          <div className="care-clarifier">
            Diese sofortigen Ansprüche sind von Ihrer gesetzlichen Entschädigung getrennt. Die Fluggesellschaft schuldet Ihnen beides.
          </div>
        </Expander>

        <div className="summary">
          {[
            ['Vorfall',     DISRUPTION_LABELS_DE[answers.disruption] || '—'],
            ['Flug',        answers.flightNumber || '—'],
            ['Route',       `${answers.from} → ${answers.to}`],
            ['Distanz',     distanceKm ? `~${distanceKm.toLocaleString()} km` : 'Unbekannt'],
            ['Verordnung',  regulation],
            ['Datum',       answers.flightDate || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="sum-label">{label}</div>
              <div className="sum-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="res-disclaimer">
          Haftungsausschluss: FlightComp ist keine Anwaltskanzlei und gibt keine Rechtsberatung. Wir stellen Informationen über Ihre Rechte gemäß EU261/UK261/APPR/SHY bereit und bieten Tools zur Unterstützung Ihrer Forderung. Für Rechtsberatung wenden Sie sich bitte an einen qualifizierten Anwalt.
        </div>

        <div className="reset-link">
          <button onClick={onReset}>← Einen anderen Flug prüfen</button>
        </div>
      </div>
    </div>
  );
}

function PersonalDetailsScreen({ details, onChange, onSubmit, onBack }) {
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
        <button className="prog-back" onClick={onBack}>← Zurück zu den Ergebnissen</button>
      </div>
      <div className="details-body">
        <div>
          <div className="q-label">Fast geschafft</div>
          <h2 className="q-head" style={{ fontSize: 22 }}>Ihre Angaben für den Brief</h2>
        </div>

        <div className="field-group">
          <label className="field-label">Vollständiger Name *</label>
          <input
            className="field-input"
            type="text"
            placeholder="z. B. Maria Müller"
            value={details.name}
            onChange={e => onChange({ name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label className="field-label">E-Mail-Adresse *</label>
          <input
            className="field-input"
            type="email"
            placeholder="maria@beispiel.de"
            value={details.email}
            onChange={e => onChange({ email: e.target.value })}
          />
          <span className="field-hint">Ihre Quittung und etwaige Folgekommunikation werden hierhin gesendet.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Heimatadresse *</label>
          <textarea
            className="field-textarea"
            placeholder={"Musterstraße 1\nBerlin\n10115"}
            value={details.address}
            onChange={e => onChange({ address: e.target.value })}
            rows={3}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Buchungsreferenz</label>
          <input
            className="field-input inp-mono"
            type="text"
            placeholder="z. B. ABC123"
            value={details.bookingRef}
            onChange={e => onChange({ bookingRef: e.target.value.toUpperCase() })}
            style={{ fontSize: 16 }}
          />
          <span className="field-hint">Optional – stärkt Ihre Forderung.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Bank-/Zahlungsdaten</label>
          <textarea
            className="field-textarea"
            placeholder={"IBAN: DE00 0000 0000 0000 0000 00\noder PayPal: maria@beispiel.de\n(Optional – für die Rückzahlung durch die Fluggesellschaft)"}
            value={details.bankDetails}
            onChange={e => onChange({ bankDetails: e.target.value })}
            rows={3}
          />
          <span className="field-hint">Optional. Wird nur in Ihrem Brief verwendet.</span>
        </div>

        <div className="payment-card">
          <span className="payment-card-ico">🔒</span>
          <div className="payment-card-txt">
            <div className="payment-card-title">Sicherer Checkout über Stripe</div>
            <div className="payment-card-sub">
              Ihr Brief wird sofort nach der Zahlung erstellt.
              Kartendaten werden von Stripe verarbeitet – wir sehen sie nie.
            </div>
          </div>
          <span className="payment-price">$14.99</span>
        </div>

        <button className="btn-pay" onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Weiterleitung…' : '$14.99 zahlen und meinen Brief erhalten →'}
        </button>
        <div className="secure-note">🔒 Gesichert durch Stripe · SSL-Verschlüsselung</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Sprachumschalter — Modulebene
══════════════════════════════════════════════════════ */

function LangToggle({ active }) {
  const langs = [
    { code: 'EN', flag: '🇬🇧', href: '/' },
    { code: 'TR', flag: '🇹🇷', href: '/tr' },
    { code: 'FR', flag: '🇫🇷', href: '/fr' },
    { code: 'DE', flag: '🇩🇪', href: '/de' },
    { code: 'ES', flag: '🇪🇸', href: '/es' },
  ];
  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 200, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 240 }}>
      {langs.map(({ code, flag, href }) => {
        const isActive = code === active;
        return (
          <a key={code} href={href} style={{
            fontSize: 11, fontWeight: 700,
            color: isActive ? 'var(--text)' : 'var(--muted)',
            background: isActive ? 'var(--surf2)' : 'var(--surf)',
            border: `1px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
            borderRadius: 6, padding: '3px 7px', textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>{flag} {code}</a>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Hauptseite — Zustandsmaschine
══════════════════════════════════════════════════════ */

const INITIAL_ANSWERS = {
  disruption: '',
  flightNumber: '',
  flightDate: '',
  from: '',
  to: '',
  airlineName: '',
  airlineCode: '',
  carrierRegion: '',
  airlineSizeAutoDetected: false,
  delayLength: '',
  reason: '',
  apprDelayTier: '',
  airlineSize: '',
  apprReason: '',
  shyReason: '',
  shyNotified14: '',
  detectedRegulation: '',
  language: 'de',
};

const INITIAL_DETAILS = {
  name: '',
  email: '',
  address: '',
  bookingRef: '',
  bankDetails: '',
};

export default function GermanHome() {
  const restored = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('fc_claim_de');
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p.answers && p.result ? p : null;
    } catch { return null; }
  })();

  const [screen, setScreen]   = useState(restored ? 'results' : 'hook');
  const [answers, setAnswers] = useState(restored?.answers || INITIAL_ANSWERS);
  const [result, setResult]   = useState(restored?.result || null);
  const [details, setDetails] = useState(restored?.details || INITIAL_DETAILS);

  function update(key, val) {
    setAnswers(a => ({ ...a, [key]: val }));
  }

  function updateDetails(patch) {
    setDetails(d => ({ ...d, ...patch }));
  }

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
    const r = assessClaim({ ...answers, reason: val });
    setResult(r);
    setScreen('results');
  }

  function goFromAirline() {
    setAnswers(prev => {
      const code = resolveAirline(prev.airlineName) || '';
      const carrierReg = code ? (getCarrierRegion(code) || '') : '';
      const reg = detectRegulation(prev.from, prev.to, carrierReg || null);

      const isCACarrier = carrierReg === 'CA';
      let autoSize = '';
      let autoDetected = false;
      if (reg === 'APPR' && code && isCACarrier) {
        autoSize = isLargeCanadianCarrier(code) ? 'large' : 'small';
        autoDetected = true;
      }

      const updated = {
        ...prev,
        airlineCode: code,
        carrierRegion: carrierReg,
        detectedRegulation: reg || '',
        ...(autoSize ? { airlineSize: autoSize, airlineSizeAutoDetected: autoDetected } : {}),
      };

      let nextScreen;
      if (!reg) {
        nextScreen = 'not_covered';
      } else if (reg === 'APPR') {
        if (prev.disruption === 'delayed') {
          nextScreen = 'q5_appr';
        } else {
          nextScreen = autoSize ? 'q_appr_reason' : 'q_airline_size';
        }
      } else if (reg === 'SHY') {
        nextScreen = prev.disruption === 'delayed' ? 'q5_shy' : 'q_shy_reason';
      } else {
        nextScreen = prev.disruption === 'delayed' ? 'q5' : 'q6';
      }
      setTimeout(() => setScreen(nextScreen), 0);
      return updated;
    });
  }

  function handleQ5APPR(val) {
    update('apprDelayTier', val);
    setScreen('q_airline_size');
  }

  function handleQAirlineSize(val) {
    update('airlineSize', val);
    setScreen('q_appr_reason');
  }

  function handleQAPPRReason(val) {
    const r = assessClaimAPPR({ ...answers, apprReason: val });
    update('apprReason', val);
    setResult(r);
    setScreen('results');
  }

  function handleQ5SHY(val) {
    update('delayLength', val);
    setScreen('q_shy_reason');
  }

  function handleQSHYReason(val) {
    const updated = { ...answers, shyReason: val };
    setAnswers(a => ({ ...a, shyReason: val }));
    if (answers.disruption === 'cancelled') {
      setScreen('q_shy_notified');
    } else {
      setResult(assessClaimSHY(updated));
      setScreen('results');
    }
  }

  function handleQSHYNotified(val) {
    const r = assessClaimSHY({ ...answers, shyNotified14: val });
    update('shyNotified14', val);
    setResult(r);
    setScreen('results');
  }

  async function handlePay() {
    const payload = { answers, result, details };
    sessionStorage.setItem('fc_claim_de', JSON.stringify(payload));
    sessionStorage.setItem('fc_claim', JSON.stringify(payload));

    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const claimMeta = {
      email:        details.email                || '',
      name:         details.name                 || '',
      airline:      answers.airlineName          || '',
      flightNumber: answers.flightNumber         || '',
      route:        `${answers.from || ''}–${answers.to || ''}`,
      regulation:   result?.regulation           || '',
      compensation: result?.compensation?.amount || '',
      language:     'de',
    };

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: details.email,
        successUrl: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${base}/de`,
        claimMeta,
      }),
    });

    if (!res.ok) { alert('Die Zahlung konnte nicht eingerichtet werden. Bitte versuchen Sie es erneut.'); return; }
    const { url } = await res.json();
    window.location.href = url;
  }

  const langToggle = <LangToggle active="DE" />;

  if (screen === 'hook') {
    return (
      <>
        <Head>
          <title>Flugverspätung Entschädigung berechnen | FlightComp — EU261 &amp; UK261</title>
          <meta name="description" content="Flug annulliert oder verspätet? In 60 Sekunden prüfen, ob Ihnen bis zu €600 Entschädigung zustehen. EU261, UK261, Kanada APPR und Türkei SHY." />
          <meta name="keywords" content="Flugverspätung Entschädigung, EU261 Entschädigung, Flug annulliert Rechte, Flugausfall Entschädigung, Fluggastrechte" />
          <meta property="og:title" content="Ihr Flug wurde annulliert? Erfahren Sie, was Ihnen zusteht." />
          <meta property="og:description" content="Kostenlose EU261/UK261-Prüfung. Ihr Ergebnis in 60 Sekunden." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.getflightcomp.com/de" />
          <link rel="canonical" href="https://www.getflightcomp.com/de" />
          <link rel="alternate" hrefLang="en" href="https://www.getflightcomp.com/" />
          <link rel="alternate" hrefLang="tr" href="https://www.getflightcomp.com/tr" />
          <link rel="alternate" hrefLang="fr" href="https://www.getflightcomp.com/fr" />
          <link rel="alternate" hrefLang="de" href="https://www.getflightcomp.com/de" />
          <link rel="alternate" hrefLang="es" href="https://www.getflightcomp.com/es" />
          <link rel="alternate" hrefLang="x-default" href="https://www.getflightcomp.com/" />
        </Head>

        {langToggle}

        <div className="lp">

          {/* HERO */}
          <section className="lp-hero">
            <div className="lp-hero-inner">
              <h1 className="lp-h1">
                Ihr Flug wurde annulliert oder hatte eine Verspätung?<br />
                Erfahren Sie in 60 Sekunden, was Ihnen zusteht.
              </h1>
              <div className="lp-badge" style={{ marginTop: 0, marginBottom: 20 }}>✈️ EU261 / UK261 / Kanada APPR / Türkei SHY</div>
              <p className="lp-sub">
                Fluggesellschaften sind gesetzlich verpflichtet, Ihnen bis zu €600 (EU/UK), CA$1.000 (Kanada) oder €600 (Türkei) zu zahlen – aber sie setzen bürokratische Hürden ein, um dies zu vermeiden. Wir überwinden diese für Sie.
              </p>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Meinen Flug prüfen →
              </button>
              <div className="lp-hero-trust">
                <span>Kostenlos</span>
                <span className="lp-dot">·</span>
                <span>Ohne Anmeldung</span>
                <span className="lp-dot">·</span>
                <span>Sofortiges Ergebnis</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                Gilt für Flüge in, nach und aus der EU, UK, Kanada und der Türkei.
                US-Inlandsflüge sind nicht abgedeckt.
              </p>
            </div>
          </section>

          {/* SO FUNKTIONIERT'S */}
          <section className="lp-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">So funktioniert&apos;s</h2>
              <div className="lp-steps">
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">1</span>
                    <span className="lp-step-ico">📋</span>
                  </div>
                  <div className="lp-step-title">Beantworten Sie 6 kurze Fragen</div>
                  <div className="lp-step-body">Flugnummer, Route, Art der Störung, Verspätungsdauer und den Grund der Fluggesellschaft.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">2</span>
                    <span className="lp-step-ico">✅</span>
                  </div>
                  <div className="lp-step-title">Erhalten Sie Ihr Urteil zur Anspruchsberechtigung</div>
                  <div className="lp-step-body">Wir prüfen Ihre Rechte gemäß EU261, UK261, APPR oder SHY und teilen Ihnen mit, ob Sie berechtigt sind – und wie viel Ihnen zusteht.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">3</span>
                    <span className="lp-step-ico">💰</span>
                  </div>
                  <div className="lp-step-title">Wir übernehmen alles</div>
                  <div className="lp-step-body">Ermächtigen Sie uns, Ihre Forderung einzureichen und den Prozess zu verwalten – 25&nbsp;% Provision, kein Erfolg keine Gebühr. Oder holen Sie sich ein Entschädigungs-Kit (14,99&nbsp;$) mit Ihrem personalisierten Brief und Anleitungen.</div>
                </div>
              </div>
            </div>
          </section>

          {/* VERTRAUENSABSCHNITT */}
          <section className="lp-section lp-trust-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Basierend auf der EU-Verordnung 261/2004</h2>
              <p className="lp-body">
                EU-Recht verpflichtet Fluggesellschaften zur Entschädigung von Fluggästen mit bis zu €600 bei Annullierungen, langen Verspätungen und Nichtbeförderung auf qualifizierenden Flügen. Sie brauchen keinen Anwalt – es ist Ihr gesetzliches Recht.
              </p>
              <div className="lp-comp-grid">
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€250</span>
                  <span className="lp-comp-lbl">Flüge unter 1.500&nbsp;km</span>
                </div>
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€400</span>
                  <span className="lp-comp-lbl">Flüge 1.500–3.500&nbsp;km</span>
                </div>
                <div className="lp-comp-card lp-comp-card-hi">
                  <span className="lp-comp-amt">€600</span>
                  <span className="lp-comp-lbl">Flüge über 3.500&nbsp;km</span>
                </div>
              </div>
              <div className="lp-uk-note">Gilt auch für UK-Flüge (UK261 – £220/£350/£520), kanadische Flüge (APPR – CA$400/CA$700/CA$1.000) und türkische Flüge (SHY – €100 Inland&nbsp;/&nbsp;€250–€600 International für Annullierungen &amp; Nichtbeförderung; Verspätungen erhalten nur Betreuungsrechte).</div>
            </div>
          </section>

          {/* FINALER CTA */}
          <section className="lp-final-cta">
            <div className="lp-section-inner lp-final-inner">
              <h2 className="lp-final-h">Prüfen Sie, ob Ihr Flug qualifiziert</h2>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Meinen Flug prüfen →
              </button>
              <div className="lp-final-sub">Kostenlos · 60 Sekunden · Gilt für EU-, UK-, kanadische und türkische Flüge</div>
            </div>
          </section>

          {/* FUSSZEILE */}
          <footer className="lp-footer">
            <div className="lp-footer-inner">
              <div className="lp-footer-brand">FlightComp — EU261/UK261 Fluggastrechte-Tool</div>
              <div className="lp-footer-links">
                <a href="/about">Über uns</a>
                <a href="/how-it-works">So funktioniert&apos;s</a>
                <a href="/blog">Blog</a>
                <a href="/privacy">Datenschutz</a>
                <a href="/terms">AGB</a>
                <a href="mailto:support@getflightcomp.com">Kontakt</a>
              </div>
              <div className="lp-footer-copy">© 2026 Noontide Ventures LLC · FlightComp</div>
            </div>
          </footer>

        </div>
      </>
    );
  }

  if (screen === 'q1') {
    return <>{langToggle}<Q1Disruption value={answers.disruption} onChange={handleQ1} /></>;
  }

  if (screen === 'q2') {
    return (
      <>{langToggle}
        <Q2FlightNumber
          value={answers.flightNumber}
          onChange={v => update('flightNumber', v)}
          onNext={() => setScreen('q3')}
          onBack={() => setScreen('q1')}
        />
      </>
    );
  }

  if (screen === 'q3') {
    return (
      <>{langToggle}
        <Q3Date
          value={answers.flightDate}
          onChange={v => update('flightDate', v)}
          onNext={() => setScreen('q4')}
          onBack={() => setScreen('q2')}
        />
      </>
    );
  }

  if (screen === 'q4') {
    return (
      <>{langToggle}
        <Q4Route
          from={answers.from}
          to={answers.to}
          onFromChange={v => update('from', v)}
          onToChange={v => update('to', v)}
          onNext={() => setScreen('q_airline')}
          onBack={() => setScreen('q3')}
        />
      </>
    );
  }

  if (screen === 'q_airline') {
    return (
      <>{langToggle}
        <QAirline
          value={answers.airlineName}
          onChange={v => update('airlineName', v)}
          onNext={goFromAirline}
          onBack={() => setScreen('q4')}
        />
      </>
    );
  }

  if (screen === 'not_covered') {
    return (
      <>{langToggle}
        <div className="screen">
          <div className="q-body" style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
            <h2 className="q-head" style={{ color: 'var(--text)' }}>Derzeit nicht abgedeckt</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Basierend auf Ihrer Route und Fluggesellschaft wird dieser Flug nicht von EU261, UK261, dem kanadischen APPR oder dem türkischen SHY abgedeckt.
              US-Inlandsflüge und Routen außerhalb dieser Regelungen werden derzeit nicht unterstützt.
            </p>
            <button className="btn-cont" onClick={() => {
              setAnswers(INITIAL_ANSWERS);
              setDetails(INITIAL_DETAILS);
              setResult(null);
              setScreen('hook');
            }}>
              Einen anderen Flug prüfen
            </button>
          </div>
        </div>
      </>
    );
  }

  if (screen === 'q5') {
    return (
      <>{langToggle}
        <Q5Delay
          value={answers.delayLength}
          disruption={answers.disruption}
          onChange={handleQ5}
          onBack={() => setScreen('q_airline')}
        />
      </>
    );
  }

  if (screen === 'q6') {
    return (
      <>{langToggle}
        <Q6Reason
          value={answers.reason}
          onChange={handleQ6}
          onBack={() => setScreen(answers.disruption === 'delayed' ? 'q5' : 'q_airline')}
        />
      </>
    );
  }

  if (screen === 'q5_appr') {
    return (
      <>{langToggle}
        <Q5APPR
          value={answers.apprDelayTier}
          onChange={handleQ5APPR}
          onBack={() => setScreen('q_airline')}
        />
      </>
    );
  }

  if (screen === 'q_airline_size') {
    const isDelayedAPPR = answers.disruption === 'delayed';
    const step = isDelayedAPPR ? 6 : 5;
    const total = isDelayedAPPR ? 7 : 6;
    return (
      <>{langToggle}
        <QAirlineSize
          value={answers.airlineSize}
          onChange={handleQAirlineSize}
          onBack={() => setScreen(isDelayedAPPR ? 'q5_appr' : 'q_airline')}
          step={step}
          total={total}
        />
      </>
    );
  }

  if (screen === 'q_appr_reason') {
    const isDelayedAPPR = answers.disruption === 'delayed';
    const step = isDelayedAPPR ? 7 : 6;
    const total = isDelayedAPPR ? 7 : 6;
    return (
      <>{langToggle}
        <QAPPRReason
          value={answers.apprReason}
          onChange={handleQAPPRReason}
          onBack={() => setScreen('q_airline_size')}
          step={step}
          total={total}
        />
      </>
    );
  }

  if (screen === 'q5_shy') {
    return (
      <>{langToggle}
        <Q5SHYDelay
          value={answers.delayLength}
          onChange={handleQ5SHY}
          onBack={() => setScreen('q_airline')}
        />
      </>
    );
  }

  if (screen === 'q_shy_reason') {
    const isDelayed = answers.disruption === 'delayed';
    const step = isDelayed ? 6 : 5;
    const total = answers.disruption === 'cancelled' ? (isDelayed ? 7 : 6) : (isDelayed ? 6 : 5);
    return (
      <>{langToggle}
        <QSHYReason
          value={answers.shyReason}
          onChange={handleQSHYReason}
          onBack={() => setScreen(isDelayed ? 'q5_shy' : 'q_airline')}
          step={step}
          total={total}
        />
      </>
    );
  }

  if (screen === 'q_shy_notified') {
    return (
      <>{langToggle}
        <QSHYNotified
          value={answers.shyNotified14}
          onChange={handleQSHYNotified}
          onBack={() => setScreen('q_shy_reason')}
          step={6}
          total={6}
        />
      </>
    );
  }

  if (screen === 'results' && result) {
    return (
      <>{langToggle}
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
      </>
    );
  }

  if (screen === 'details') {
    return (
      <>{langToggle}
        <PersonalDetailsScreen
          details={details}
          onChange={updateDetails}
          onSubmit={handlePay}
          onBack={() => setScreen('results')}
          result={result}
        />
      </>
    );
  }

  return null;
}

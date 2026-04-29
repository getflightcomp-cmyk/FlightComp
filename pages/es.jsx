import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { assessClaim, assessClaimAPPR, assessClaimSHY, detectRegulation, tryResolveAirport } from '../lib/eu261';
import { trackEvent } from '../lib/analytics';
import { resolveAirline, getCarrierRegion, isLargeCanadianCarrier } from '../lib/carriers';

/* ══════════════════════════════════════════════════════
   Spanish localization — standalone page
   Canonical: https://www.getflightcomp.com/es
   Covers EU261 / UK261 / APPR / SHY (same logic, ES strings)
══════════════════════════════════════════════════════ */

function ProgressBar({ step, total, onBack }) {
  return (
    <div className="prog-wrap">
      <div className="prog-head">
        <button className="prog-back" onClick={onBack}>
          ← Atrás
        </button>
        <span className="prog-step">{step}/{total}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ── Q1: Tipo de incidencia ────────────────────────────
function Q1Disruption({ value, onChange }) {
  const opts = [
    { value: 'delayed',    icon: '⏱️', title: 'Retrasado',              sub: 'El vuelo salió o llegó tarde' },
    { value: 'cancelled',  icon: '✕',  title: 'Cancelado',               sub: 'El vuelo no se realizó' },
    { value: 'denied',     icon: '🚫', title: 'Embarque denegado',       sub: 'No te permitieron abordar' },
    { value: 'downgraded', icon: '⬇️', title: 'Degradación de clase',    sub: 'Te ubicaron en una clase inferior a la reservada' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={1} total={6} onBack={() => history.back()} />
      <div className="q-body">
        <div className="q-label">Pregunta 1 de 6</div>
        <h2 className="q-head">¿Qué pasó con tu vuelo?</h2>
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

// ── Q2: Número de vuelo ───────────────────────────────
function Q2FlightNumber({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={2} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 2 de 6</div>
        <h2 className="q-head">¿Cuál era el número de tu vuelo?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="ej. IB 123"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <p className="q-helper">
          Lo encontrarás en tu tarjeta de embarque o confirmación de reserva.{' '}
          <strong>Déjalo en blanco si no lo sabes.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Continuar →</button>
      </div>
    </div>
  );
}

// ── Q3: Fecha del vuelo ───────────────────────────────
function Q3Date({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={3} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 3 de 6</div>
        <h2 className="q-head">¿Cuándo fue el vuelo?</h2>
        <input
          className="inp inp-date"
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          autoFocus
        />
        <p className="q-helper">
          Reclamaciones EU261&nbsp;: <strong>plazo de 3&nbsp;años</strong> (6&nbsp;años UK261, 1&nbsp;año APPR).
          Los vuelos más antiguos también pueden verificarse.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!value}>Continuar →</button>
      </div>
    </div>
  );
}

// ── Q4: Ruta ──────────────────────────────────────────
function Q4Route({ from, to, onFromChange, onToChange, onNext, onBack }) {
  const fromResolved = from.trim().length > 2 ? tryResolveAirport(from) : true;
  const toResolved   = to.trim().length > 2   ? tryResolveAirport(to)   : true;
  const fromWarn = from.trim().length > 2 && !fromResolved;
  const toWarn   = to.trim().length > 2   && !toResolved;
  return (
    <div className="screen">
      <ProgressBar step={4} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 4 de 6</div>
        <h2 className="q-head">¿Cuál era tu ruta?</h2>
        <div className="route-row">
          <div className="route-wrap">
            <span className="route-lbl">Desde</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Código o ciudad (ej. MAD, Madrid)"
              value={from}
              onChange={e => onFromChange(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {fromWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                No reconocemos ese aeropuerto. Prueba el código de 3 letras (ej.&nbsp;MAD, LHR, CDG).
              </span>
            )}
          </div>
          <div className="route-arrow">↓</div>
          <div className="route-wrap">
            <span className="route-lbl">Hasta</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Código o ciudad (ej. LHR, Londres)"
              value={to}
              onChange={e => onToChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {toWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                No reconocemos ese aeropuerto. Prueba el código de 3 letras (ej.&nbsp;MAD, LHR, CDG).
              </span>
            )}
          </div>
        </div>
        <p className="q-helper">
          Cubre vuelos desde aeropuertos de la <strong>UE/EEE/R.U.</strong> (EU261/UK261) y vuelos
          hacia/desde <strong>aeropuertos canadienses</strong> (APPR) y vuelos en <strong>Turquía</strong> (SHY).
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!from.trim() || !to.trim()}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ── QAirline: Aerolínea ───────────────────────────────
function QAirline({ value, onChange, onNext, onBack }) {
  const resolved = value.trim().length > 1 ? resolveAirline(value) : true;
  const showWarn = value.trim().length > 2 && !resolved;
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 5 de 7</div>
        <h2 className="q-head">¿Qué aerolínea operó tu vuelo?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="ej. Iberia o IB"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {showWarn && (
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            No reconocemos esa aerolínea. Prueba el código IATA de 2 letras (ej.&nbsp;IB, VY, FR) o déjalo en blanco.
          </span>
        )}
        <p className="q-helper">
          Introduce el nombre o el código IATA (ej.&nbsp;IB, VY, FR).{' '}
          <strong>Déjalo en blanco si no lo sabes.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Continuar →</button>
      </div>
    </div>
  );
}

// ── Q5: Duración del retraso (EU261/UK261) ────────────
function Q5Delay({ value, onChange, disruption, onBack }) {
  const opts = [
    { value: 'under2', title: 'Menos de 2 horas' },
    { value: '2to3',   title: '2 – 3 horas' },
    { value: '3to4',   title: '3 – 4 horas' },
    { value: '4plus',  title: '4 horas o más' },
  ];
  if (disruption !== 'delayed') return null;
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 5 de 6</div>
        <h2 className="q-head">¿Cuánto duró el retraso en la llegada?</h2>
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
          La compensación EU261 requiere un <strong>retraso de 3 horas o más en el destino final</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Q6: Motivo (EU261/UK261) ──────────────────────────
function Q6Reason({ value, onChange, onBack }) {
  const opts = [
    { value: 'technical', icon: '🔧', title: 'Problema técnico / mecánico',   sub: 'Fallo del avión, problema de mantenimiento' },
    { value: 'crew',      icon: '👥', title: 'Falta de tripulación',           sub: 'Tripulación ausente, problemas de horario del personal' },
    { value: 'weather',   icon: '🌩️', title: 'Condiciones meteorológicas',     sub: 'Tormenta, niebla, hielo o restricciones del ATC' },
    { value: 'none',      icon: '❓', title: 'Sin razón indicada',             sub: 'La aerolínea no explicó' },
    { value: 'other',     icon: '📋', title: 'Otro',                           sub: 'Huelgas, congestión aeroportuaria, etc.' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={6} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 6 de 6</div>
        <h2 className="q-head">¿Qué razón dio la aerolínea?</h2>
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

// ── Q5 SHY: Duración del retraso ──────────────────────
function Q5SHYDelay({ value, onChange, onBack }) {
  const opts = [
    { value: 'under2', title: 'Menos de 2 horas' },
    { value: '2to3',   title: '2 – 3 horas' },
    { value: '3to4',   title: '3 – 4 horas' },
    { value: '4plus',  title: '5 horas o más' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 5 de 6</div>
        <h2 className="q-head">¿Cuánto duró el retraso en la llegada?</h2>
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
          Nota&nbsp;: según la normativa SHY (Turquía), <strong>los retrasos no dan derecho a compensación económica</strong> — solo se aplican derechos de atención (comidas, alojamiento).
        </p>
      </div>
    </div>
  );
}

// ── Q SHY Motivo ──────────────────────────────────────
function QSHYReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'airline',      icon: '🔧', title: 'Responsabilidad de la aerolínea', sub: 'Problema técnico, falta de tripulación, overbooking, problema operativo' },
    { value: 'forcemajeure', icon: '🌩️', title: 'Fuerza mayor',                    sub: 'Condiciones meteorológicas graves, inestabilidad política, desastre natural, huelga aeroportuaria, riesgo de seguridad' },
    { value: 'unknown',      icon: '❓', title: 'Sin razón indicada',               sub: 'La aerolínea no explicó' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta {step} de {total}</div>
        <h2 className="q-head">¿Cuál fue la causa de la incidencia?</h2>
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
          Los fallos técnicos y la falta de tripulación <strong>no son</strong> fuerza mayor según la normativa SHY — son responsabilidad de la aerolínea.
        </p>
      </div>
    </div>
  );
}

// ── Q SHY Aviso previo (cancelaciones) ───────────────
function QSHYNotified({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'yes', icon: '✓', title: 'Sí, con 14 días o más de antelación', sub: 'Me avisaron al menos 14 días antes de la salida' },
    { value: 'no',  icon: '✕', title: 'No — menos de 14 días',               sub: 'Me avisaron menos de 14 días antes, o en el aeropuerto' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta {step} de {total}</div>
        <h2 className="q-head">¿Te avisaron de la cancelación con antelación?</h2>
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
          La normativa SHY obliga a las aerolíneas a compensar las cancelaciones solo cuando el aviso se da con <strong>menos de 14 días</strong> de antelación.
        </p>
      </div>
    </div>
  );
}

// ── Q5 APPR: Nivel de retraso ─────────────────────────
function Q5APPR({ value, onChange, onBack }) {
  const opts = [
    { value: 'under3', title: 'Menos de 3 horas' },
    { value: '3to6',   title: '3 a 6 horas' },
    { value: '6to9',   title: '6 a 9 horas' },
    { value: '9plus',  title: '9 horas o más' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta 5 de 7</div>
        <h2 className="q-head">¿Cuánto duró el retraso en la llegada?</h2>
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
          La compensación APPR comienza con <strong>retrasos de 3 horas o más en el destino final</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Q Tamaño de la aerolínea (APPR) ──────────────────
function QAirlineSize({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'large',   icon: '✈️', title: 'Aerolínea grande',   sub: 'Air Canada, WestJet, Porter, Sunwing, Swoop, Flair, Air Transat' },
    { value: 'small',   icon: '🛩️', title: 'Aerolínea pequeña',  sub: 'Transportista regional o chárter no listado arriba' },
    { value: 'unknown', icon: '❓', title: 'No estoy seguro/a',   sub: 'Se aplicarán las tarifas de aerolíneas grandes' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta {step} de {total}</div>
        <h2 className="q-head">¿Qué tamaño tiene la aerolínea?</h2>
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
          Los importes de compensación APPR difieren según el tamaño de la aerolínea.
        </p>
      </div>
    </div>
  );
}

// ── Q Motivo APPR ─────────────────────────────────────
function QAPPRReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'controlled',   icon: '🔧', title: 'Bajo el control de la aerolínea',  sub: 'Problema técnico, falta de tripulación, planificación, overbooking' },
    { value: 'safety',       icon: '⚠️', title: 'Relacionado con la seguridad',      sub: 'Problema de seguridad que requiere inmovilizar el avión' },
    { value: 'uncontrolled', icon: '🌩️', title: 'Fuera del control de la aerolínea', sub: 'Condiciones meteorológicas, ATC, seguridad aeroportuaria, impacto de ave' },
    { value: 'unknown',      icon: '❓', title: 'Sin razón indicada',                sub: 'La aerolínea no explicó' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Pregunta {step} de {total}</div>
        <h2 className="q-head">¿Cuál fue la causa de la incidencia?</h2>
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

// ── Pantalla de resultados ────────────────────────────
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

const CARE_I18N_ES = {
  care_meals_title:       'Comidas y refrigerios',
  care_meals_eu_prop:     'Proporcionales a su tiempo de espera. Solicite vales de comida en el mostrador de la aerolínea ahora mismo.',
  care_meals_appr_3h:     'Para retrasos de 3 horas o más, la aerolínea debe proporcionar vales de comida y bebida.',
  care_meals_shy_2h:      'Para perturbaciones de 2 horas o más, la aerolínea debe proporcionar comida y bebida sin cargo.',
  care_comm_title:        'Comunicación gratuita',
  care_comm_eu:           'Llamadas telefónicas, correos electrónicos o faxes para informar a familiares o colegas.',
  care_comm_appr:         'La aerolínea debe proporcionar medios de comunicación (teléfono/internet) sin costo.',
  care_comm_shy:          'La aerolínea debe permitir llamadas telefónicas o correos electrónicos sin cargo para informar a familiares o colegas.',
  care_hotel_title:       'Alojamiento en hotel',
  care_hotel_eu:          'Si se requiere una noche de hotel, la aerolínea debe organizarla y pagarla.',
  care_hotel_appr:        'Si se requiere una noche de hotel, la aerolínea debe organizarla y pagarla.',
  care_hotel_shy:         'Si se requiere una noche de hotel, la aerolínea debe organizarla y pagarla.',
  care_transport_title:   'Transporte aeropuerto–hotel',
  care_transport_detail:  'Traslados de ida y vuelta entre el hotel y el aeropuerto sin cargo.',
  care_rebook_title:      'Cambio de vuelo o reembolso',
  care_rebook_eu:         'Elija entre un reembolso completo de su billete o un cambio al siguiente vuelo disponible sin costo adicional.',
  care_rebook_appr:       'Puede elegir entre un reembolso completo o un cambio al siguiente vuelo disponible sin costo adicional.',
  care_rebook_shy:        'Puede elegir entre un reembolso completo de su billete o un cambio al siguiente vuelo disponible sin costo adicional.',
};

const VERDICT_NOTES_I18N_ES = {
  verdict_note_appr_safety:      'Las perturbaciones por razones de seguridad están exentas de la indemnización en efectivo del APPR, pero las aerolíneas aún deben proporcionar atención (comidas, hotel) y cambio de vuelo.',
  verdict_note_shy_delay:        'Según el SHY, las aerolíneas deben proporcionar comidas, refrigerios y alojamiento para retrasos de más de 2 horas. Sin embargo, no se prevé compensación económica por retrasos — solo por cancelaciones y denegaciones de embarque.',
  verdict_note_shy_delay_eu261:  'Según el SHY, las aerolíneas deben proporcionar comidas, refrigerios y alojamiento para retrasos de más de 2 horas. No se prevé compensación económica por retrasos. Su vuelo también podría estar cubierto por EU261, que sí contempla indemnización por retrasos. Seleccionamos SHY porque salió de Turquía, pero considere reclamar bajo EU261 si su aerolínea está registrada en la UE.',
  verdict_note_shy_forcemajeure: 'Los eventos de fuerza mayor (mal tiempo severo, inestabilidad política, desastres naturales, riesgos de seguridad, huelgas aeroportuarias) eximen a las aerolíneas de la compensación económica SHY. Los derechos de atención (comidas, alojamiento, cambio de vuelo) siguen siendo aplicables.',
  verdict_note_eu_extraordinary:  'Las circunstancias extraordinarias (tiempo, huelgas de control aéreo, incidentes de seguridad) eximen a las aerolíneas de pagar indemnización en efectivo. Sin embargo, sus derechos de atención — comidas, hotel, cambio de vuelo — no se ven afectados.',
  shy_deadline:        'Tiene 1 año desde la fecha de la perturbación para presentar una reclamación.',
  shy_escalation_dgca: 'Si la aerolínea no responde o no está de acuerdo con su respuesta, presente una queja ante la Dirección General de Aviación Civil de Turquía (DGCA / SHGM): https://web.shgm.gov.tr',
  payable_in_try:      'pagadero en Liras Turcas',
};

const VERDICT_META_ES = {
  likely:   { badge: 'ES PROBABLE QUE TENGAS DERECHO A COMPENSACIÓN',         dot: '🟢' },
  possibly: { badge: 'PODRÍAS TENER DERECHO A COMPENSACIÓN',                   dot: '🟡' },
  unlikely: { badge: 'ES POCO PROBABLE QUE TENGAS DERECHO A COMPENSACIÓN',    dot: '🔴' },
};

const DISRUPTION_LABELS_ES = {
  cancelled:  'Cancelación',
  delayed:    'Retraso',
  denied:     'Embarque denegado',
  downgraded: 'Degradación',
};

function ResultsScreen({ result, answers, onGetLetter, onReset, flowStartedRef }) {
  const [captureEmail, setCaptureEmail]   = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle');

  const { verdict, regulation, compensation, verdictNote, careRights, distanceKm, shyMeta } = result;
  const meta = VERDICT_META_ES[verdict] ?? VERDICT_META_ES.likely;
  const amountDisplay = compensation?.amount
    ? `${compensation.amount}${compensation.payableInTRY ? ` (${VERDICT_NOTES_I18N_ES.payable_in_try})` : ''}`
    : (verdict !== 'unlikely' ? '€250–€600' : null);
  const isSHYDelay = regulation === 'SHY' && answers.disruption === 'delayed';
  const showPrimaryCTA = verdict === 'likely' || verdict === 'possibly' || isSHYDelay;
  const showSecondaryCTA = (verdict === 'likely' || verdict === 'possibly') && !isSHYDelay;

  // GA4: fire once when results screen mounts — only for flows started this session,
  // not for sessions restored from sessionStorage on page load.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[GA4 debug] ResultsScreen mounted — flowStartedRef?.current:', flowStartedRef?.current);
    if (flowStartedRef?.current) {
      trackEvent('eligibility_check_completed');
      trackEvent('verdict_shown', { eligible: verdict !== 'unlikely' });
    } else {
      // eslint-disable-next-line no-console
      console.log('[GA4 debug] Skipping completion events — restored session (no active flow)');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    ? 'APPR — Reglamento de Protección de Pasajeros Aéreos (SOR/2019-150)'
    : regulation === 'SHY'
    ? 'SHY — Reglamento turco de derechos de pasajeros'
    : 'Reglamento UE 261/2004';

  return (
    <div className="res">
      <div className={`vbanner ${verdict}`}>
        <div className="veyebrow">{meta.dot} Tu resultado</div>
        <div className="vbadge">{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="vamount">{amountDisplay}</div>
            <div className="vreg">en virtud del {regLabel}</div>
          </>
        ) : (
          <div className="vreg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Sin compensación económica — pueden aplicarse derechos de atención
          </div>
        )}
        {verdictNote && <p className="vnote">{VERDICT_NOTES_I18N_ES[verdictNote] ?? verdictNote}</p>}
        {shyMeta && (
          <div className="vnote" style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            <strong>Fecha límite:</strong> {VERDICT_NOTES_I18N_ES[shyMeta.deadlineKey] ?? shyMeta.deadlineKey}<br />
            <strong>Escalada:</strong> {VERDICT_NOTES_I18N_ES[shyMeta.escalationKey] ?? shyMeta.escalationKey}
          </div>
        )}
      </div>

      <div className="res-body">

        {/* ── Referencia reglamentaria ── */}
        {verdict !== 'unlikely' && regulation && (
          <div className="reg-citation">
            {regulation === 'EU261' && (
              <>En virtud del <strong>Reglamento UE 261/2004, art.&nbsp;7(1)</strong>, podrías tener derecho a una compensación de <strong>{amountDisplay}</strong>. El art.&nbsp;5(1)(c) obliga a las aerolíneas a pagar una indemnización por cancelaciones cuando los pasajeros no fueron informados al menos 14&nbsp;días antes.</>
            )}
            {regulation === 'UK261' && (
              <>En virtud del <strong>Reglamento UK261 (derecho de la UE retenido), art.&nbsp;7(1)</strong>, podrías tener derecho a una compensación de <strong>{amountDisplay}</strong>. La Autoridad de Aviación Civil del Reino Unido (CAA) aplica estos derechos para vuelos que salen de aeropuertos del R.U.</>
            )}
            {regulation === 'APPR' && (
              <>En virtud del <strong>Reglamento de Protección de Pasajeros Aéreos (APPR, SOR/2019-150), art.&nbsp;19(1)</strong>, podrías tener derecho a <strong>{amountDisplay}</strong>. La Agencia de Transporte de Canadá supervisa el cumplimiento y puede recibir quejas.</>
            )}
            {regulation === 'SHY' && (
              <>En virtud del <strong>Reglamento SHY de Turquía sobre derechos de pasajeros</strong>, podrías tener derecho a <strong>{amountDisplay}</strong> para vuelos internacionales. La Dirección General de Aviación Civil turca (DGCA) aplica estos derechos.</>
            )}
          </div>
        )}

        {/* ── CTA PRINCIPAL ── */}
        {showPrimaryCTA && (() => {
          const disruptionMap = {
            cancelled:  'Cancelación',
            delayed:    'Retraso de más de 3 horas',
            denied:     'Embarque denegado',
            downgraded: 'Degradación',
          };
          const params = new URLSearchParams();
          if (answers.flightNumber) params.set('flight',       answers.flightNumber);
          if (answers.flightDate)   params.set('date',         answers.flightDate);
          if (answers.from)         params.set('from',         answers.from);
          if (answers.to)           params.set('to',           answers.to);
          if (answers.disruption)   params.set('disruption',   disruptionMap[answers.disruption] || answers.disruption);
          if (regulation)           params.set('regulation',   regulation);
          if (compensation?.amount) params.set('compensation', compensation.amount);
          params.set('lang', 'es');
          const authorizeUrl = `/authorize?${params.toString()}`;

          let airlineName = 'la aerolínea';
          try {
            const carrier = resolveAirline(answers.flightNumber);
            if (carrier?.name) airlineName = carrier.name;
          } catch { /* keep default */ }

          return (
            <div className="cta-handle">
              <div className="cta-handle-top">
                <span className="cta-handle-title">Déjanos gestionar tu reclamación</span>
              </div>
              <div className="cta-howit">
                <div className="cta-step"><span className="cta-step-n">1</span><span>Nos autorizas a actuar en tu nombre.</span></div>
                <div className="cta-step"><span className="cta-step-n">2</span><span>Presentamos tu reclamación directamente a {airlineName}.</span></div>
                <div className="cta-step"><span className="cta-step-n">3</span><span>Gestionamos todos los seguimientos y escalaciones.</span></div>
                <div className="cta-step"><span className="cta-step-n">4</span><span>Solo pagas si tenemos éxito — 25&nbsp;% de honorarios. Sin resultado, sin honorarios.</span></div>
              </div>
              <a className="btn-authorize" href={authorizeUrl}>
                Iniciar autorización →
              </a>
              <div className="notify-fallback">
                <p className="notify-fallback-label">¿No estás listo/a? Deja tu correo y te haremos un seguimiento.</p>
                {captureStatus === 'done' ? (
                  <div className="notify-success">✓ Recibido — te contactaremos pronto.</div>
                ) : captureStatus === 'error' ? (
                  <div className="notify-error">Algo salió mal — por favor inténtalo de nuevo.</div>
                ) : (
                  <form className="notify-row" onSubmit={handleCapture}>
                    <input
                      className="notify-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Tu dirección de correo electrónico"
                      value={captureEmail}
                      onChange={e => setCaptureEmail(e.target.value)}
                      required
                    />
                    <button className="btn-notify" type="submit" disabled={!captureEmail.trim() || captureStatus === 'submitting'}>
                      Notificarme
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── CTA SECUNDARIO : Kit de compensación ── */}
        {showSecondaryCTA && (
          <div className="cta-diy">
            <div className="cta-diy-head">
              <span className="cta-diy-title">Obtén tu kit de compensación</span>
              <span className="cta-diy-price">$14.99</span>
            </div>
            <p className="cta-diy-desc">
              Un kit completo de compensación {regulation}: carta de reclamación personalizada, guía de envío a la aerolínea, plantillas de seguimiento y escalación. Descarga en PDF y envía tú mismo/a.
            </p>
            <button className="btn-diy" onClick={onGetLetter}>
              Obtener mi kit de compensación — $14.99
            </button>
          </div>
        )}

        <Expander icon="🛡️" label="Lo que la aerolínea debe proporcionarte ahora">
          {careRights.length > 0 ? (
            <div className="care-list">
              {careRights.map((r, i) => (
                <div key={i} className="care-item">
                  <span className="care-em">{r.emoji}</span>
                  <div className="care-txt">
                    <strong>{CARE_I18N_ES[r.titleKey] ?? r.titleKey}</strong><br />{CARE_I18N_ES[r.detailKey] ?? r.detailKey}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, paddingTop: 14, lineHeight: 1.6 }}>
              No se aplican obligaciones de atención inmediata para este nivel de incidencia.
            </p>
          )}
          <div className="care-clarifier">
            Estos derechos inmediatos son independientes de tu compensación legal. La aerolínea te debe ambos.
          </div>
        </Expander>

        <div className="summary">
          {[
            ['Incidencia',  DISRUPTION_LABELS_ES[answers.disruption] || '—'],
            ['Vuelo',       answers.flightNumber || '—'],
            ['Ruta',        `${answers.from} → ${answers.to}`],
            ['Distancia',   distanceKm ? `~${distanceKm.toLocaleString()} km` : 'Desconocida'],
            ['Reglamento',  regulation],
            ['Fecha',       answers.flightDate || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="sum-label">{label}</div>
              <div className="sum-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="res-disclaimer">
          Aviso legal: FlightComp no es un bufete de abogados y no ofrece asesoramiento jurídico. Proporcionamos información sobre tus derechos en virtud del EU261/UK261/APPR/SHY y herramientas para ayudarte a gestionar tu reclamación. Para asesoramiento legal, consulta a un abogado cualificado.
        </div>

        <div className="reset-link">
          <button onClick={onReset}>← Verificar otro vuelo</button>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de datos personales ──────────────────────
function PersonalDetailsScreen({ details, onChange, onSubmit, onBack }) {
  const [loading, setLoading] = useState(false);
  const canSubmit = details.name.trim() && details.email.trim() && details.address.trim();

  async function handleSubmit() {
    // eslint-disable-next-line no-console
    console.log('[GA4 debug] kit purchase button clicked');
    setLoading(true);
    await onSubmit();
    setLoading(false);
  }

  return (
    <div className="details-screen">
      <div style={{ paddingTop: 20 }}>
        <button className="prog-back" onClick={onBack}>← Volver a los resultados</button>
      </div>
      <div className="details-body">
        <div>
          <div className="q-label">Casi listo</div>
          <h2 className="q-head" style={{ fontSize: 22 }}>Tus datos para la carta</h2>
        </div>

        <div className="field-group">
          <label className="field-label">Nombre completo *</label>
          <input
            className="field-input"
            type="text"
            placeholder="ej. Ana García"
            value={details.name}
            onChange={e => onChange({ name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label className="field-label">Correo electrónico *</label>
          <input
            className="field-input"
            type="email"
            placeholder="ana@ejemplo.com"
            value={details.email}
            onChange={e => onChange({ email: e.target.value })}
          />
          <span className="field-hint">Tu recibo y cualquier seguimiento se enviarán aquí.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Dirección de casa *</label>
          <textarea
            className="field-textarea"
            placeholder={"Calle Mayor, 1\nMadrid\n28001"}
            value={details.address}
            onChange={e => onChange({ address: e.target.value })}
            rows={3}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Número de reserva</label>
          <input
            className="field-input inp-mono"
            type="text"
            placeholder="ej. ABC123"
            value={details.bookingRef}
            onChange={e => onChange({ bookingRef: e.target.value.toUpperCase() })}
            style={{ fontSize: 16 }}
          />
          <span className="field-hint">Opcional — refuerza tu reclamación.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Datos bancarios / de pago</label>
          <textarea
            className="field-textarea"
            placeholder={"IBAN: ES00 0000 0000 0000 0000 0000\no PayPal: ana@ejemplo.com\n(Opcional — para que la aerolínea realice el reembolso)"}
            value={details.bankDetails}
            onChange={e => onChange({ bankDetails: e.target.value })}
            rows={3}
          />
          <span className="field-hint">Opcional. Solo se usa dentro de tu carta.</span>
        </div>

        <div className="payment-card">
          <span className="payment-card-ico">🔒</span>
          <div className="payment-card-txt">
            <div className="payment-card-title">Pago seguro a través de Stripe</div>
            <div className="payment-card-sub">
              Tu carta se genera inmediatamente después del pago.
              Los datos de tu tarjeta son gestionados por Stripe — nosotros nunca los vemos.
            </div>
          </div>
          <span className="payment-price">$14.99</span>
        </div>

        <button className="btn-pay" onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Redirigiendo…' : 'Pagar $14.99 y obtener mi carta →'}
        </button>
        <div className="secure-note">🔒 Protegido por Stripe · Cifrado SSL</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Selector de idioma
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
   Página principal — máquina de estados
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
  language: 'es',
};

const INITIAL_DETAILS = {
  name: '',
  email: '',
  address: '',
  bookingRef: '',
  bankDetails: '',
};

export default function SpanishHome() {
  const restored = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('fc_claim_es');
      if (!raw) return null;
      const pending = sessionStorage.getItem('fc_restore_pending');
      if (!pending) {
        // eslint-disable-next-line no-console
        console.log('[GA4 debug] fc_claim_es present but no restore flag — starting fresh (stale session ignored)');
        return null;
      }
      sessionStorage.removeItem('fc_restore_pending');
      const p = JSON.parse(raw);
      // eslint-disable-next-line no-console
      console.warn('[GA4 debug] ⚠️ Restoring session from Stripe cancel — click "Start Over" for a new flow.');
      return p.answers && p.result ? p : null;
    } catch { return null; }
  })();

  const [screen, setScreen]   = useState(restored ? 'results' : 'hook');
  const [answers, setAnswers] = useState(restored?.answers || INITIAL_ANSWERS);
  const [result, setResult]   = useState(restored?.result || null);
  const [details, setDetails] = useState(restored?.details || INITIAL_DETAILS);

  const checkInProgressRef = useRef(false);

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
    // Fire kit_purchase_started immediately — before any async work so it fires
    // even if the Stripe checkout creation fails later.
    trackEvent('kit_purchase_started');

    const payload = { answers, result, details };
    sessionStorage.setItem('fc_claim_es', JSON.stringify(payload));
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
      language:     'es',
    };

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({
        customerEmail: details.email,
        successUrl: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${base}/es`,
        claimMeta,
        language: 'es',
      }),
    });

    if (!res.ok) { alert('La configuración del pago ha fallado. Por favor, inténtalo de nuevo.'); return; }
    const { url } = await res.json();
    sessionStorage.setItem('fc_restore_pending', '1');
    window.location.href = url;
  }

  // ── Selector de idioma ──────────────────────────────
  const langToggle = <LangToggle active="ES" />;

  // ── Render ──────────────────────────────────────────

  if (screen === 'hook') {
    return (
      <>
        <Head>
          <title>Compensación por Vuelo Cancelado o Retrasado | FlightComp — EU261</title>
          <meta name="description" content="¿Tu vuelo fue cancelado o retrasado? Comprueba en 60 segundos si tienes derecho a una compensación de hasta €600. EU261, UK261, Canadá APPR y Turquía SHY." />
          <meta name="keywords" content="compensación vuelo cancelado, EU261 compensación, vuelo retrasado derechos, reclamación aerolínea, derechos pasajeros aéreos" />
          <meta property="og:title" content="Tu vuelo fue cancelado. Descubre lo que te deben." />
          <meta property="og:description" content="Verificación gratuita EU261/UK261. Obtén tu resultado en 60 segundos." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.getflightcomp.com/es" />
          <link rel="canonical" href="https://www.getflightcomp.com/es" />
          <link rel="alternate" hrefLang="en" href="https://www.getflightcomp.com/" />
          <link rel="alternate" hrefLang="tr" href="https://www.getflightcomp.com/tr" />
          <link rel="alternate" hrefLang="fr" href="https://www.getflightcomp.com/fr" />
          <link rel="alternate" hrefLang="de" href="https://www.getflightcomp.com/de" />
          <link rel="alternate" hrefLang="es" href="https://www.getflightcomp.com/es" />
          <link rel="alternate" hrefLang="x-default" href="https://www.getflightcomp.com/" />
        </Head>

        {langToggle}

        <div className="lp">

          {/* ── HERO ── */}
          <section className="lp-hero">
            <div className="lp-hero-inner">
              <h1 className="lp-h1">
                ¿Vuelo retrasado o cancelado?<br />
                Comprueba en menos de 60 segundos si tienes derecho a compensación.
              </h1>
              <div className="lp-badge" style={{ marginTop: 0, marginBottom: 20 }}>✈️ Cubre vuelos en Europa, Reino Unido, Canadá y Turquía</div>
              <p className="lp-sub">
                Las aerolíneas deben compensaciones con más frecuencia de lo que crees. La mayoría de los pasajeros nunca lo reclama.
              </p>
              <button className="btn-hook lp-cta" onClick={() => { console.log('[GA4 debug] CTA clicked — checkInProgressRef.current:', checkInProgressRef.current); if (!checkInProgressRef.current) { checkInProgressRef.current = true; trackEvent('eligibility_check_started'); } setScreen('q1'); }}>
                Verificar mi vuelo →
              </button>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                Responde unas preguntas rápidas → obtén un resultado inmediato
              </p>
              <div className="lp-hero-trust">
                <span>~30 segundos</span>
                <span className="lp-dot">·</span>
                <span>Sin registro</span>
                <span className="lp-dot">·</span>
                <span>Sin tarjeta de crédito</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                Cubre vuelos en la UE, Reino Unido, Canadá y Turquía.
                Los vuelos domésticos de EE.UU. no están cubiertos.
              </p>
            </div>
          </section>

          {/* ── CÓMO FUNCIONA ── */}
          <section className="lp-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Cómo funciona</h2>
              <div className="lp-steps">
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">1</span>
                    <span className="lp-step-ico">📋</span>
                  </div>
                  <div className="lp-step-title">Responde 6 preguntas rápidas</div>
                  <div className="lp-step-body">Número de vuelo, ruta, tipo de incidencia, duración del retraso y la razón que dio la aerolínea.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">2</span>
                    <span className="lp-step-ico">✅</span>
                  </div>
                  <div className="lp-step-title">Obtén tu veredicto de elegibilidad</div>
                  <div className="lp-step-body">Comprobamos tus derechos según EU261, UK261, APPR o SHY, y te decimos si eres elegible — y cuánto te corresponde.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">3</span>
                    <span className="lp-step-ico">💰</span>
                  </div>
                  <div className="lp-step-title">Nos ocupamos de todo</div>
                  <div className="lp-step-body">Autorízanos a presentar tu reclamación y gestionar el proceso — 25&nbsp;% de honorarios, sin resultado sin honorarios. O consigue un kit de compensación ($14.99) con tu carta personalizada.</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── DERECHOS REGLAMENTARIOS ── */}
          <section className="lp-section lp-trust-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Basado en el Reglamento UE 261/2004</h2>
              <p className="lp-body">
                La ley de la UE obliga a las aerolíneas a compensar a los pasajeros con hasta €600 por cancelaciones, grandes retrasos y denegación de embarque en vuelos elegibles. No necesitas un abogado — es tu derecho.
              </p>
              <div className="lp-comp-grid">
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€250</span>
                  <span className="lp-comp-lbl">Vuelos de menos de 1.500&nbsp;km</span>
                </div>
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€400</span>
                  <span className="lp-comp-lbl">Vuelos de 1.500 a 3.500&nbsp;km</span>
                </div>
                <div className="lp-comp-card lp-comp-card-hi">
                  <span className="lp-comp-amt">€600</span>
                  <span className="lp-comp-lbl">Vuelos de más de 3.500&nbsp;km</span>
                </div>
              </div>
              <div className="lp-uk-note">También cubre vuelos del R.U. (UK261 — £220/£350/£520), vuelos canadienses (APPR — CA$400/CA$700/CA$1.000) y vuelos turcos (SHY — €100 doméstico&nbsp;/&nbsp;€250–€600 internacional para cancelaciones &amp; denegación de embarque; los retrasos solo dan derecho a atención).</div>
            </div>
          </section>

          {/* ── CTA FINAL ── */}
          <section className="lp-final-cta">
            <div className="lp-section-inner lp-final-inner">
              <h2 className="lp-final-h">Comprueba si tu vuelo es elegible</h2>
              <button className="btn-hook lp-cta" onClick={() => { console.log('[GA4 debug] CTA clicked — checkInProgressRef.current:', checkInProgressRef.current); if (!checkInProgressRef.current) { checkInProgressRef.current = true; trackEvent('eligibility_check_started'); } setScreen('q1'); }}>
                Verificar mi vuelo →
              </button>
              <div className="lp-final-sub">Gratis · 60 segundos · Cubre vuelos de la UE, R.U., Canadá y Turquía</div>
            </div>
          </section>

          {/* ── PIE DE PÁGINA ── */}
          <footer className="lp-footer">
            <div className="lp-footer-inner">
              <div className="lp-footer-brand">FlightComp — Herramienta de compensación EU261/UK261</div>
              <div className="lp-footer-links">
                <a href="/about">Sobre nosotros</a>
                <a href="/how-it-works">Cómo funciona</a>
                <a href="/blog">Blog</a>
                <a href="/privacy">Política de privacidad</a>
                <a href="/terms">Términos de uso</a>
                <a href="mailto:support@getflightcomp.com">Contacto</a>
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
            <h2 className="q-head" style={{ color: 'var(--text)' }}>No cubierto por EU261, UK261, APPR ni SHY</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Según los datos que has introducido, este vuelo en concreto no está cubierto por las normativas de
              compensación a pasajeros que gestionamos. EU261 y UK261 solo cubren vuelos que salen de un aeropuerto
              de la UE/UK (cualquier aerolínea), o que llegan a la UE/UK en una aerolínea europea. Si tienes un
              vuelo de vuelta que sale de un aeropuerto de la UE o el Reino Unido, ese tramo podría estar cubierto
              — puedes realizar otra consulta para comprobarlo.
            </p>
            <button className="btn-cont" onClick={() => {
              checkInProgressRef.current = false;
              setAnswers(INITIAL_ANSWERS);
              setDetails(INITIAL_DETAILS);
              setResult(null);
              setScreen('hook');
            }}>
              Verificar otro vuelo
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
          flowStartedRef={checkInProgressRef}
          onReset={() => {
            checkInProgressRef.current = false;
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

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { assessClaim, assessClaimAPPR, assessClaimSHY, detectRegulation, tryResolveAirport } from '../lib/eu261';
import { trackEvent } from '../lib/analytics';
import { resolveAirline, getCarrierRegion, isLargeCanadianCarrier } from '../lib/carriers';

/* ══════════════════════════════════════════════════════
   French (Canadian) localization — standalone page
   Canonical: https://www.getflightcomp.com/fr
   Covers APPR / EU261 / UK261 / SHY (same logic, FR-CA strings)
══════════════════════════════════════════════════════ */

function ProgressBar({ step, total, onBack }) {
  return (
    <div className="prog-wrap">
      <div className="prog-head">
        <button className="prog-back" onClick={onBack}>
          ← Retour
        </button>
        <span className="prog-step">{step}/{total}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ── Q1: Type d'incident ───────────────────────────────
function Q1Disruption({ value, onChange }) {
  const opts = [
    { value: 'delayed',    icon: '⏱️', title: 'Retardé',              sub: 'Le vol a décollé ou atterri en retard' },
    { value: 'cancelled',  icon: '✕',  title: 'Annulé',               sub: 'Le vol n\'a pas eu lieu' },
    { value: 'denied',     icon: '🚫', title: 'Embarquement refusé',  sub: 'On vous a empêché de monter à bord' },
    { value: 'downgraded', icon: '⬇️', title: 'Déclassement',         sub: 'Placé dans une classe inférieure à celle réservée' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={1} total={6} onBack={() => history.back()} />
      <div className="q-body">
        <div className="q-label">Question 1 sur 6</div>
        <h2 className="q-head">Qu&apos;est-il arrivé à votre vol?</h2>
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

// ── Q2: Numéro de vol ─────────────────────────────────
function Q2FlightNumber({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={2} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 2 sur 6</div>
        <h2 className="q-head">Quel était le numéro de votre vol?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="p. ex. AC 123"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <p className="q-helper">
          Vous le trouverez sur votre carte d&apos;embarquement ou votre confirmation de réservation.{' '}
          <strong>Laissez vide si inconnu.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Continuer →</button>
      </div>
    </div>
  );
}

// ── Q3: Date du vol ───────────────────────────────────
function Q3Date({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={3} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 3 sur 6</div>
        <h2 className="q-head">Quand le vol a-t-il eu lieu?</h2>
        <input
          className="inp inp-date"
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          autoFocus
        />
        <p className="q-helper">
          Réclamations EU261&nbsp;: <strong>délai de 3&nbsp;ans</strong> (6&nbsp;ans UK261, 1&nbsp;an RPPA).
          Les vols plus anciens peuvent tout de même être vérifiés.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!value}>Continuer →</button>
      </div>
    </div>
  );
}

// ── Q4: Trajet ────────────────────────────────────────
function Q4Route({ from, to, onFromChange, onToChange, onNext, onBack }) {
  const fromResolved = from.trim().length > 2 ? tryResolveAirport(from) : true;
  const toResolved   = to.trim().length > 2   ? tryResolveAirport(to)   : true;
  const fromWarn = from.trim().length > 2 && !fromResolved;
  const toWarn   = to.trim().length > 2   && !toResolved;
  return (
    <div className="screen">
      <ProgressBar step={4} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 4 sur 6</div>
        <h2 className="q-head">Quel était votre trajet?</h2>
        <div className="route-row">
          <div className="route-wrap">
            <span className="route-lbl">Départ</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Code ou ville (p. ex. YUL, Montréal)"
              value={from}
              onChange={e => onFromChange(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {fromWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                Aéroport non reconnu. Essayez le code à 3 lettres (p.&nbsp;ex. YUL, YYZ, CDG).
              </span>
            )}
          </div>
          <div className="route-arrow">↓</div>
          <div className="route-wrap">
            <span className="route-lbl">Arrivée</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Code ou ville (p. ex. LHR, Londres)"
              value={to}
              onChange={e => onToChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {toWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                Aéroport non reconnu. Essayez le code à 3 lettres (p.&nbsp;ex. YUL, YYZ, CDG).
              </span>
            )}
          </div>
        </div>
        <p className="q-helper">
          Couvre les vols au départ d&apos;<strong>aéroports canadiens</strong> (RPPA), les aéroports
          de l&apos;<strong>UE/EEE/R.-U.</strong> (EU261/UK261) et les vols en <strong>Turquie</strong> (SHY).
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!from.trim() || !to.trim()}>
          Continuer →
        </button>
      </div>
    </div>
  );
}

// ── QAirline: Compagnie aérienne ─────────────────────
function QAirline({ value, onChange, onNext, onBack }) {
  const resolved = value.trim().length > 1 ? resolveAirline(value) : true;
  const showWarn = value.trim().length > 2 && !resolved;
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 sur 7</div>
        <h2 className="q-head">Quelle compagnie aérienne exploitait votre vol?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="p. ex. Air Canada ou AC"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {showWarn && (
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            Compagnie non reconnue. Essayez le code IATA à 2 lettres (p.&nbsp;ex. AC, WS, PD) ou laissez vide.
          </span>
        )}
        <p className="q-helper">
          Entrez le nom ou le code IATA (p.&nbsp;ex. AC, WS, PD).{' '}
          <strong>Laissez vide si inconnu.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Continuer →</button>
      </div>
    </div>
  );
}

// ── Q5: Durée du retard (EU261/UK261) ─────────────────
function Q5Delay({ value, onChange, disruption, onBack }) {
  const opts = [
    { value: 'under2', title: 'Moins de 2 heures' },
    { value: '2to3',   title: '2 à 3 heures' },
    { value: '3to4',   title: '3 à 4 heures' },
    { value: '4plus',  title: '4 heures et plus' },
  ];
  if (disruption !== 'delayed') return null;
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 sur 6</div>
        <h2 className="q-head">Quelle a été la durée du retard à l&apos;arrivée?</h2>
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
          L&apos;indemnisation EU261 requiert un <strong>retard de 3 heures ou plus à la destination finale</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Q6: Motif (EU261/UK261) ───────────────────────────
function Q6Reason({ value, onChange, onBack }) {
  const opts = [
    { value: 'technical', icon: '🔧', title: 'Problème technique / mécanique', sub: 'Panne d\'appareil, problème de maintenance' },
    { value: 'crew',      icon: '👥', title: 'Manque de personnel navigant',   sub: 'Équipage absent, problème d\'horaire du personnel' },
    { value: 'weather',   icon: '🌩️', title: 'Conditions météorologiques',     sub: 'Tempête, brouillard, verglas ou restrictions ATC' },
    { value: 'none',      icon: '❓', title: 'Aucune raison donnée',            sub: 'La compagnie n\'a pas expliqué' },
    { value: 'other',     icon: '📋', title: 'Autre',                           sub: 'Grève, congestion aéroportuaire, etc.' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={6} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 6 sur 6</div>
        <h2 className="q-head">Quelle raison la compagnie aérienne a-t-elle donnée?</h2>
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

// ── Q5 SHY: Durée du retard ───────────────────────────
function Q5SHYDelay({ value, onChange, onBack }) {
  const opts = [
    { value: 'under2', title: 'Moins de 2 heures' },
    { value: '2to3',   title: '2 à 3 heures' },
    { value: '3to4',   title: '3 à 4 heures' },
    { value: '4plus',  title: '5 heures et plus' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 sur 6</div>
        <h2 className="q-head">Quelle a été la durée du retard à l&apos;arrivée?</h2>
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
          Note&nbsp;: en vertu de la réglementation SHY (Turquie), <strong>les retards ne donnent pas droit à une indemnisation financière</strong> — seuls les droits aux soins s&apos;appliquent (repas, hébergement).
        </p>
      </div>
    </div>
  );
}

// ── Q SHY Motif ───────────────────────────────────────
function QSHYReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'airline',      icon: '🔧', title: 'Responsabilité de la compagnie', sub: 'Problème technique, manque d\'équipage, surbooking, problème opérationnel' },
    { value: 'forcemajeure', icon: '🌩️', title: 'Force majeure',                  sub: 'Conditions météo sévères, instabilité politique, catastrophe naturelle, grève aéroportuaire, risque sécuritaire' },
    { value: 'unknown',      icon: '❓', title: 'Aucune raison donnée',            sub: 'La compagnie n\'a pas expliqué' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} sur {total}</div>
        <h2 className="q-head">Quelle était la cause de l&apos;incident?</h2>
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
          Les pannes techniques et le manque d&apos;équipage <strong>ne constituent pas</strong> un cas de force majeure en vertu de la réglementation SHY — ils relèvent de la responsabilité de la compagnie.
        </p>
      </div>
    </div>
  );
}

// ── Q SHY Préavis (annulations) ───────────────────────
function QSHYNotified({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'yes', icon: '✓', title: 'Oui, 14 jours ou plus à l\'avance', sub: 'J\'ai été informé au moins 14 jours avant le départ' },
    { value: 'no',  icon: '✕', title: 'Non — moins de 14 jours',           sub: 'Informé moins de 14 jours avant, ou à l\'aéroport' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} sur {total}</div>
        <h2 className="q-head">Avez-vous été informé de l&apos;annulation à l&apos;avance?</h2>
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
          La réglementation SHY n&apos;oblige les compagnies à indemniser les annulations que si le préavis a été donné <strong>moins de 14 jours</strong> avant le départ.
        </p>
      </div>
    </div>
  );
}

// ── Q5 APPR: Niveau de retard ─────────────────────────
function Q5APPR({ value, onChange, onBack }) {
  const opts = [
    { value: 'under3', title: 'Moins de 3 heures' },
    { value: '3to6',   title: '3 à 6 heures' },
    { value: '6to9',   title: '6 à 9 heures' },
    { value: '9plus',  title: '9 heures et plus' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question 5 sur 7</div>
        <h2 className="q-head">Quelle a été la durée du retard à l&apos;arrivée?</h2>
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
          L&apos;indemnisation RPPA commence à partir de <strong>3 heures de retard à la destination finale</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Q Taille de la compagnie (APPR) ──────────────────
function QAirlineSize({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'large',   icon: '✈️', title: 'Grande compagnie aérienne', sub: 'Air Canada, WestJet, Porter, Sunwing, Swoop, Flair, Air Transat' },
    { value: 'small',   icon: '🛩️', title: 'Petite compagnie aérienne', sub: 'Transporteur régional ou nolisé non listé ci-dessus' },
    { value: 'unknown', icon: '❓', title: 'Je ne sais pas',             sub: 'Les tarifs des grandes compagnies seront appliqués' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} sur {total}</div>
        <h2 className="q-head">Quelle est la taille de la compagnie aérienne?</h2>
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
          Les montants d&apos;indemnisation RPPA diffèrent selon la taille de la compagnie.
        </p>
      </div>
    </div>
  );
}

// ── Q Motif APPR ──────────────────────────────────────
function QAPPRReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'controlled',   icon: '🔧', title: 'Sous le contrôle de la compagnie', sub: 'Problème technique, manque d\'équipage, planification, surbooking' },
    { value: 'safety',       icon: '⚠️', title: 'Lié à la sécurité',                sub: 'Problème de sécurité exigeant l\'immobilisation de l\'appareil' },
    { value: 'uncontrolled', icon: '🌩️', title: 'Hors du contrôle de la compagnie', sub: 'Conditions météo sévères, ATC, sécurité aéroportuaire, impact aviaire' },
    { value: 'unknown',      icon: '❓', title: 'Aucune raison donnée',              sub: 'La compagnie n\'a pas expliqué' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Question {step} sur {total}</div>
        <h2 className="q-head">Quelle était la cause de l&apos;incident?</h2>
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

// ── Écran des résultats ───────────────────────────────
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

const CARE_I18N_FR = {
  care_meals_title:       'Repas et rafraîchissements',
  care_meals_eu_prop:     'Proportionnels à votre temps d\'attente. Demandez des bons de restauration au comptoir de la compagnie aérienne dès maintenant.',
  care_meals_appr_3h:     'Pour les retards de 3 heures ou plus, la compagnie doit fournir des bons de restauration.',
  care_meals_shy_2h:      'Pour les perturbations de 2 heures ou plus, la compagnie doit fournir repas et boissons gratuitement.',
  care_comm_title:        'Communication gratuite',
  care_comm_eu:           'Appels téléphoniques, courriels ou télécopies pour informer vos proches ou collègues.',
  care_comm_appr:         'La compagnie doit fournir un moyen de communication (téléphone/internet) sans frais.',
  care_comm_shy:          'La compagnie doit permettre des appels téléphoniques ou des courriels sans frais pour informer la famille ou les collègues.',
  care_hotel_title:       'Hébergement à l\'hôtel',
  care_hotel_eu:          'Si une nuit d\'hôtel est nécessaire, la compagnie doit l\'organiser et la payer.',
  care_hotel_appr:        'Si une nuit d\'hôtel est nécessaire, la compagnie doit l\'organiser et la payer.',
  care_hotel_shy:         'Si une nuit d\'hôtel est nécessaire, la compagnie doit l\'organiser et la payer.',
  care_transport_title:   'Transfert aéroport–hôtel',
  care_transport_detail:  'Transferts aller-retour entre l\'hôtel et l\'aéroport sans frais.',
  care_rebook_title:      'Remboursement ou réservation alternative',
  care_rebook_eu:         'Choisissez un remboursement intégral de votre billet ou une réservation sur le prochain vol disponible sans frais supplémentaires.',
  care_rebook_appr:       'Vous pouvez choisir un remboursement intégral ou une réservation sur le prochain vol disponible sans frais supplémentaires.',
  care_rebook_shy:        'Vous pouvez choisir un remboursement intégral de votre billet ou une réservation sur le prochain vol disponible sans frais supplémentaires.',
};

const VERDICT_NOTES_I18N_FR = {
  verdict_note_appr_safety:      'Les perturbations liées à la sécurité sont exemptées de l\'indemnisation en espèces du RPPA, mais les compagnies doivent toujours assurer la prise en charge (repas, hôtel) et le réacheminement.',
  verdict_note_shy_delay:        'En vertu du SHY, les compagnies doivent fournir repas, rafraîchissements et hébergement pour les retards de plus de 2 heures. Cependant, aucune indemnisation financière n\'est prévue pour les retards — seulement pour les annulations et les refus d\'embarquement.',
  verdict_note_shy_delay_eu261:  'En vertu du SHY, les compagnies doivent fournir repas, rafraîchissements et hébergement pour les retards de plus de 2 heures. Aucune indemnisation financière n\'est prévue pour les retards. Votre vol pourrait également être couvert par EU261, qui prévoit une indemnisation pour les retards. Nous avons sélectionné SHY car vous avez décollé de Turquie, mais envisagez de déposer une demande sous EU261 si votre compagnie est enregistrée dans l\'UE.',
  verdict_note_shy_forcemajeure: 'Les événements de force majeure (météo sévère, instabilité politique, catastrophes naturelles, risques de sécurité, grèves aéroportuaires) exemptent les compagnies de l\'indemnisation financière SHY. Les droits de prise en charge (repas, hébergement, réacheminement) restent applicables.',
  verdict_note_eu_extraordinary:  'Les circonstances extraordinaires (météo, grèves ATC, incidents de sécurité) exemptent les compagnies du paiement d\'une indemnisation en espèces. Vos droits de prise en charge — repas, hôtel, réacheminement — ne sont pas affectés.',
  shy_deadline:        'Vous avez 1 an à compter de la date de la perturbation pour déposer une réclamation.',
  shy_escalation_dgca: 'Si la compagnie aérienne ne répond pas ou si vous n\'êtes pas d\'accord avec sa réponse, déposez une plainte auprès de la Direction générale de l\'aviation civile turque (DGCA / SHGM) : https://web.shgm.gov.tr',
  payable_in_try:      'payable en Lires turques',
};

const VERDICT_META_FR = {
  likely:   { badge: 'VOUS AVEZ PROBABLEMENT DROIT À UNE INDEMNISATION',     dot: '🟢' },
  possibly: { badge: 'VOUS POURRIEZ AVOIR DROIT À UNE INDEMNISATION',         dot: '🟡' },
  unlikely: { badge: 'VOUS N\'AVEZ PROBABLEMENT PAS DROIT À UNE INDEMNISATION', dot: '🔴' },
};

const DISRUPTION_LABELS_FR = {
  cancelled:  'Annulation',
  delayed:    'Retard',
  denied:     'Embarquement refusé',
  downgraded: 'Déclassement',
};

function ResultsScreen({ result, answers, onGetLetter, onReset, flowStartedRef }) {
  const [captureEmail, setCaptureEmail]   = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle');

  const { verdict, regulation, compensation, verdictNote, careRights, distanceKm, shyMeta } = result;
  const meta = VERDICT_META_FR[verdict] ?? VERDICT_META_FR.likely;
  const amountDisplay = compensation?.amount
    ? `${compensation.amount}${compensation.payableInTRY ? ` (${VERDICT_NOTES_I18N_FR.payable_in_try})` : ''}`
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
    ? 'RPPA — Règlement sur la protection des passagers aériens (SOR/2019-150)'
    : regulation === 'SHY'
    ? 'SHY — Réglementation turque sur les droits des passagers'
    : 'Règlement UE 261/2004';

  return (
    <div className="res">
      <div className={`vbanner ${verdict}`}>
        <div className="veyebrow">{meta.dot} Votre résultat</div>
        <div className="vbadge">{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="vamount">{amountDisplay}</div>
            <div className="vreg">en vertu du {regLabel}</div>
          </>
        ) : (
          <div className="vreg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Pas d&apos;indemnisation financière — des droits aux soins peuvent s&apos;appliquer
          </div>
        )}
        {verdictNote && <p className="vnote">{VERDICT_NOTES_I18N_FR[verdictNote] ?? verdictNote}</p>}
        {shyMeta && (
          <div className="vnote" style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            <strong>Date limite&nbsp;:</strong> {VERDICT_NOTES_I18N_FR[shyMeta.deadlineKey] ?? shyMeta.deadlineKey}<br />
            <strong>Escalade&nbsp;:</strong> {VERDICT_NOTES_I18N_FR[shyMeta.escalationKey] ?? shyMeta.escalationKey}
          </div>
        )}
      </div>

      <div className="res-body">

        {/* ── Référence réglementaire ── */}
        {verdict !== 'unlikely' && regulation && (
          <div className="reg-citation">
            {regulation === 'EU261' && (
              <>En vertu du <strong>Règlement UE 261/2004, article&nbsp;7(1)</strong>, vous pourriez avoir droit à une indemnisation de <strong>{amountDisplay}</strong>. L&apos;article&nbsp;5(1)(c) oblige les compagnies à verser une indemnité pour les annulations lorsque les passagers n&apos;ont pas été informés au moins 14&nbsp;jours à l&apos;avance.</>
            )}
            {regulation === 'UK261' && (
              <>En vertu du <strong>Règlement UK261 (droit de l&apos;UE conservé), article&nbsp;7(1)</strong>, vous pourriez avoir droit à une indemnisation de <strong>{amountDisplay}</strong>. La Civil Aviation Authority (CAA) du Royaume-Uni applique ces droits pour les vols au départ du R.-U.</>
            )}
            {regulation === 'APPR' && (
              <>En vertu du <strong>Règlement sur la protection des passagers aériens (RPPA, DORS/2019-150), article&nbsp;19(1)</strong>, vous pourriez avoir droit à <strong>{amountDisplay}</strong>. L&apos;Office des transports du Canada (OTC) supervise la conformité et peut recevoir des plaintes si la compagnie refuse de payer.</>
            )}
            {regulation === 'SHY' && (
              <>En vertu du <strong>Règlement SHY de la Turquie sur les droits des passagers</strong>, vous pourriez avoir droit à <strong>{amountDisplay}</strong> pour les vols internationaux. La Direction générale de l&apos;aviation civile turque (DGCA) applique ces droits.</>
            )}
          </div>
        )}

        {/* ── CTA PRINCIPAL ── */}
        {showPrimaryCTA && (() => {
          const disruptionMap = {
            cancelled:  'Annulation',
            delayed:    'Retard de plus de 3 heures',
            denied:     'Embarquement refusé',
            downgraded: 'Déclassement',
          };
          const params = new URLSearchParams();
          if (answers.flightNumber) params.set('flight',       answers.flightNumber);
          if (answers.flightDate)   params.set('date',         answers.flightDate);
          if (answers.from)         params.set('from',         answers.from);
          if (answers.to)           params.set('to',           answers.to);
          if (answers.disruption)   params.set('disruption',   disruptionMap[answers.disruption] || answers.disruption);
          if (regulation)           params.set('regulation',   regulation);
          if (compensation?.amount) params.set('compensation', compensation.amount);
          params.set('lang', 'fr');
          const authorizeUrl = `/authorize?${params.toString()}`;

          let airlineName = 'la compagnie aérienne';
          try {
            const carrier = resolveAirline(answers.flightNumber);
            if (carrier?.name) airlineName = carrier.name;
          } catch { /* keep default */ }

          return (
            <div className="cta-handle">
              <div className="cta-handle-top">
                <span className="cta-handle-title">Laissez-nous gérer votre réclamation</span>
              </div>
              <div className="cta-howit">
                <div className="cta-step"><span className="cta-step-n">1</span><span>Vous nous autorisez à agir en votre nom.</span></div>
                <div className="cta-step"><span className="cta-step-n">2</span><span>Nous soumettons votre réclamation directement à {airlineName}.</span></div>
                <div className="cta-step"><span className="cta-step-n">3</span><span>Nous gérons tous les suivis et les démarches d&apos;escalade.</span></div>
                <div className="cta-step"><span className="cta-step-n">4</span><span>Vous ne payez que si nous réussissons — 25&nbsp;% de frais. Aucun résultat, aucuns frais.</span></div>
              </div>
              <a className="btn-authorize" href={authorizeUrl}>
                Commencer l&apos;autorisation →
              </a>
              <div className="notify-fallback">
                <p className="notify-fallback-label">Pas encore prêt? Laissez votre courriel et nous ferons un suivi.</p>
                {captureStatus === 'done' ? (
                  <div className="notify-success">✓ Reçu — nous vous contacterons bientôt.</div>
                ) : captureStatus === 'error' ? (
                  <div className="notify-error">Une erreur s&apos;est produite — veuillez réessayer.</div>
                ) : (
                  <form className="notify-row" onSubmit={handleCapture}>
                    <input
                      className="notify-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Votre adresse courriel"
                      value={captureEmail}
                      onChange={e => setCaptureEmail(e.target.value)}
                      required
                    />
                    <button className="btn-notify" type="submit" disabled={!captureEmail.trim() || captureStatus === 'submitting'}>
                      Me notifier
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── CTA SECONDAIRE : Trousse d'indemnisation ── */}
        {showSecondaryCTA && (
          <div className="cta-diy">
            <div className="cta-diy-head">
              <span className="cta-diy-title">Obtenez votre trousse d&apos;indemnisation</span>
              <span className="cta-diy-price">14,99&nbsp;$</span>
            </div>
            <p className="cta-diy-desc">
              Une trousse {regulation} complète&nbsp;: lettre de réclamation personnalisée, guide de soumission à la compagnie aérienne, modèles de suivi et d&apos;escalade. Téléchargez en PDF et envoyez vous-même.
            </p>
            <button className="btn-diy" onClick={() => {
              // eslint-disable-next-line no-console
              console.log('[GA4 debug] verdict-page paid kit button clicked');
              trackEvent('kit_purchase_started');
              onGetLetter();
            }}>
              Obtenir ma trousse d&apos;indemnisation — 14,99&nbsp;$
            </button>
          </div>
        )}

        <Expander icon="🛡️" label="Ce que la compagnie aérienne doit vous fournir maintenant">
          {careRights.length > 0 ? (
            <div className="care-list">
              {careRights.map((r, i) => (
                <div key={i} className="care-item">
                  <span className="care-em">{r.emoji}</span>
                  <div className="care-txt">
                    <strong>{CARE_I18N_FR[r.titleKey] ?? r.titleKey}</strong><br />{CARE_I18N_FR[r.detailKey] ?? r.detailKey}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, paddingTop: 14, lineHeight: 1.6 }}>
              Aucune obligation de soins immédiats ne s&apos;applique pour ce niveau d&apos;incident.
            </p>
          )}
          <div className="care-clarifier">
            Ces droits immédiats sont distincts de votre indemnisation légale. La compagnie vous doit les deux.
          </div>
        </Expander>

        <div className="summary">
          {[
            ['Incident',  DISRUPTION_LABELS_FR[answers.disruption] || '—'],
            ['Vol',       answers.flightNumber || '—'],
            ['Trajet',    `${answers.from} → ${answers.to}`],
            ['Distance',  distanceKm ? `~${distanceKm.toLocaleString()} km` : 'Inconnue'],
            ['Règlement', regulation],
            ['Date',      answers.flightDate || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="sum-label">{label}</div>
              <div className="sum-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="res-disclaimer">
          Avertissement&nbsp;: FlightComp n&apos;est pas un cabinet juridique et ne fournit pas de conseils juridiques. Nous fournissons des informations sur vos droits en vertu du EU261/UK261/RPPA/SHY et des outils pour vous aider à soumettre votre réclamation. Pour des conseils juridiques, consultez un avocat qualifié.
        </div>

        <div className="reset-link">
          <button onClick={onReset}>← Vérifier un autre vol</button>
        </div>
      </div>
    </div>
  );
}

// ── Écran des coordonnées ─────────────────────────────
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
        <button className="prog-back" onClick={onBack}>← Retour aux résultats</button>
      </div>
      <div className="details-body">
        <div>
          <div className="q-label">Presque terminé</div>
          <h2 className="q-head" style={{ fontSize: 22 }}>Vos coordonnées pour la lettre</h2>
        </div>

        <div className="field-group">
          <label className="field-label">Nom complet *</label>
          <input
            className="field-input"
            type="text"
            placeholder="p. ex. Marie Tremblay"
            value={details.name}
            onChange={e => onChange({ name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label className="field-label">Adresse courriel *</label>
          <input
            className="field-input"
            type="email"
            placeholder="marie@exemple.com"
            value={details.email}
            onChange={e => onChange({ email: e.target.value })}
          />
          <span className="field-hint">Votre reçu et les suivis vous seront envoyés ici.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Adresse domicile *</label>
          <textarea
            className="field-textarea"
            placeholder={"123, rue Principale\nMontréal (Québec)\nH2X 1A1"}
            value={details.address}
            onChange={e => onChange({ address: e.target.value })}
            rows={3}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Numéro de réservation</label>
          <input
            className="field-input inp-mono"
            type="text"
            placeholder="p. ex. ABC123"
            value={details.bookingRef}
            onChange={e => onChange({ bookingRef: e.target.value.toUpperCase() })}
            style={{ fontSize: 16 }}
          />
          <span className="field-hint">Facultatif — renforce votre réclamation.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Coordonnées bancaires / de paiement</label>
          <textarea
            className="field-textarea"
            placeholder={"IBAN : FR00 0000 0000 0000 0000 0000 000\nou PayPal : marie@exemple.com\n(Facultatif — pour le remboursement de la compagnie aérienne)"}
            value={details.bankDetails}
            onChange={e => onChange({ bankDetails: e.target.value })}
            rows={3}
          />
          <span className="field-hint">Facultatif. Utilisé uniquement dans votre lettre.</span>
        </div>

        <div className="payment-card">
          <span className="payment-card-ico">🔒</span>
          <div className="payment-card-txt">
            <div className="payment-card-title">Paiement sécurisé via Stripe</div>
            <div className="payment-card-sub">
              Votre lettre est générée immédiatement après le paiement.
              Les données de carte sont traitées par Stripe — nous ne les voyons jamais.
            </div>
          </div>
          <span className="payment-price">14,99&nbsp;$</span>
        </div>

        <button className="btn-pay" onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Redirection…' : 'Payer 14,99 $ et obtenir ma lettre →'}
        </button>
        <div className="secure-note">🔒 Sécurisé par Stripe · Chiffrement SSL</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page principale — machine à états
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
  language: 'fr',
};

const INITIAL_DETAILS = {
  name: '',
  email: '',
  address: '',
  bookingRef: '',
  bankDetails: '',
};

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

export default function FrenchHome() {
  const restored = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('fc_claim_fr');
      if (!raw) return null;
      const pending = sessionStorage.getItem('fc_restore_pending');
      if (!pending) {
        // eslint-disable-next-line no-console
        console.log('[GA4 debug] fc_claim_fr present but no restore flag — starting fresh (stale session ignored)');
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
    // kit_purchase_started is fired on the btn-diy click in ResultsScreen (not here).

    const payload = { answers, result, details };
    sessionStorage.setItem('fc_claim_fr', JSON.stringify(payload));
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
      language:     'fr',
    };

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: details.email,
        successUrl: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${base}/fr`,
        claimMeta,
        language: 'fr',
      }),
    });

    if (!res.ok) { alert('La configuration du paiement a échoué. Veuillez réessayer.'); return; }
    const { url } = await res.json();
    sessionStorage.setItem('fc_restore_pending', '1');
    window.location.href = url;
  }

  const langToggle = <LangToggle active="FR" />;

  // ── Render ─────────────────────────────────────────

  if (screen === 'hook') {
    return (
      <>
        <Head>
          <title>Compensation Vol Annulé ou Retardé | FlightComp — RPPA &amp; EU261</title>
          <meta name="description" content="Votre vol a été annulé ou retardé? Vérifiez en 60 secondes si vous avez droit à une indemnisation. Couverture RPPA (Canada), EU261, UK261 et SHY." />
          <meta name="keywords" content="compensation vol annulé Canada, droits passagers aériens RPPA, indemnisation retard vol, vol annulé remboursement, réclamation compagnie aérienne Canada, EU261 Canada, RPPA indemnisation" />
          <meta property="og:title" content="Votre vol a été annulé? Découvrez ce que vous êtes en droit de recevoir." />
          <meta property="og:description" content="Vérification gratuite RPPA / EU261. Obtenez votre résultat en 60 secondes." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.getflightcomp.com/fr" />
          <link rel="canonical" href="https://www.getflightcomp.com/fr" />
          <link rel="alternate" hrefLang="fr" href="https://www.getflightcomp.com/fr" />
          <link rel="alternate" hrefLang="en" href="https://www.getflightcomp.com" />
          <link rel="alternate" hrefLang="tr" href="https://www.getflightcomp.com/tr" />
          <link rel="alternate" hrefLang="de" href="https://www.getflightcomp.com/de" />
          <link rel="alternate" hrefLang="es" href="https://www.getflightcomp.com/es" />
          <link rel="alternate" hrefLang="x-default" href="https://www.getflightcomp.com" />
        </Head>

        {langToggle}

        <div className="lp">

          {/* ── HERO ── */}
          <section className="lp-hero">
            <div className="lp-hero-inner">
              <h1 className="lp-h1">
                Vol retardé ou annulé&nbsp;?<br />
                Vérifiez en moins de 60 secondes si vous avez droit à une indemnisation.
              </h1>
              <div className="lp-badge" style={{ marginTop: 0, marginBottom: 20 }}>✈️ Couvre les vols en Europe, au Royaume-Uni, au Canada et en Turquie</div>
              <p className="lp-sub">
                Les compagnies aériennes doivent des indemnisations plus souvent qu&apos;on ne le croit. La plupart des passagers ne réclament jamais rien.
              </p>
              <button className="btn-hook lp-cta" onClick={() => { console.log('[GA4 debug] CTA clicked — checkInProgressRef.current:', checkInProgressRef.current); if (!checkInProgressRef.current) { checkInProgressRef.current = true; trackEvent('eligibility_check_started'); } setScreen('q1'); }}>
                Vérifier mon vol →
              </button>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                Répondez à quelques questions rapides → obtenez un résultat instantané
              </p>
              <div className="lp-hero-trust">
                <span>~30 secondes</span>
                <span className="lp-dot">·</span>
                <span>Sans inscription</span>
                <span className="lp-dot">·</span>
                <span>Sans carte bancaire</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                Couvre les vols au Canada, dans l&apos;UE, au R.-U. et en Turquie.
                Les vols intérieurs américains ne sont pas couverts.
              </p>
            </div>
          </section>

          {/* ── COMMENT ÇA MARCHE ── */}
          <section className="lp-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Comment ça marche</h2>
              <div className="lp-steps">
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">1</span>
                    <span className="lp-step-ico">📋</span>
                  </div>
                  <div className="lp-step-title">Répondez à 6 questions rapides</div>
                  <div className="lp-step-body">Numéro de vol, trajet, type d&apos;incident, durée du retard et raison fournie par la compagnie.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">2</span>
                    <span className="lp-step-ico">✅</span>
                  </div>
                  <div className="lp-step-title">Obtenez votre verdict d&apos;admissibilité</div>
                  <div className="lp-step-body">Nous vérifions vos droits selon le RPPA, EU261, UK261 ou SHY, et vous indiquons si vous êtes admissible — et le montant auquel vous avez droit.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">3</span>
                    <span className="lp-step-ico">💰</span>
                  </div>
                  <div className="lp-step-title">On s&apos;occupe de tout</div>
                  <div className="lp-step-body">Autorisez-nous à soumettre votre réclamation — frais de 25&nbsp;%, aucun résultat aucuns frais. Ou obtenez une trousse d&apos;indemnisation (14,99&nbsp;$) avec votre lettre personnalisée.</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── DROITS RÉGLEMENTAIRES ── */}
          <section className="lp-section lp-trust-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Fondé sur le RPPA et le Règlement UE 261/2004</h2>
              <p className="lp-body">
                Le Règlement sur la protection des passagers aériens (RPPA) et le Règlement UE 261/2004 obligent les compagnies à indemniser les passagers pour les annulations, les longs retards et les refus d&apos;embarquement sur les vols admissibles. Vous n&apos;avez pas besoin d&apos;un avocat — c&apos;est votre droit.
              </p>
              <div className="lp-comp-grid">
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">400&nbsp;$CA</span>
                  <span className="lp-comp-lbl">Retard de 3 à 6 heures (grande cie)</span>
                </div>
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">700&nbsp;$CA</span>
                  <span className="lp-comp-lbl">Retard de 6 à 9 heures (grande cie)</span>
                </div>
                <div className="lp-comp-card lp-comp-card-hi">
                  <span className="lp-comp-amt">1&nbsp;000&nbsp;$CA</span>
                  <span className="lp-comp-lbl">Retard de 9 h et plus (grande cie)</span>
                </div>
              </div>
              <div className="lp-uk-note">Couvre également les vols de l&apos;UE (EU261 — €250/€400/€600), les vols du R.-U. (UK261 — £220/£350/£520) et les vols en Turquie (SHY — annulations et refus d&apos;embarquement; les retards donnent droit uniquement aux soins).</div>
            </div>
          </section>

          {/* ── CTA FINAL ── */}
          <section className="lp-final-cta">
            <div className="lp-section-inner lp-final-inner">
              <h2 className="lp-final-h">Vérifiez si votre vol est admissible</h2>
              <button className="btn-hook lp-cta" onClick={() => { console.log('[GA4 debug] CTA clicked — checkInProgressRef.current:', checkInProgressRef.current); if (!checkInProgressRef.current) { checkInProgressRef.current = true; trackEvent('eligibility_check_started'); } setScreen('q1'); }}>
                Vérifier mon vol →
              </button>
              <div className="lp-final-sub">Gratuit · 60 secondes · Couvre les vols canadiens, de l&apos;UE, du R.-U. et de la Turquie</div>
            </div>
          </section>

          {/* ── PIED DE PAGE ── */}
          <footer className="lp-footer">
            <div className="lp-footer-inner">
              <div className="lp-footer-brand">FlightComp — Outil d&apos;indemnisation RPPA / EU261 / UK261</div>
              <div className="lp-footer-links">
                <a href="/about">À propos</a>
                <a href="/how-it-works">Comment ça marche</a>
                <a href="/blog">Blogue</a>
                <a href="/privacy">Politique de confidentialité</a>
                <a href="/terms">Conditions d&apos;utilisation</a>
                <a href="mailto:support@getflightcomp.com">Contact</a>
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
            <h2 className="q-head" style={{ color: 'var(--text)' }}>Non couvert par EU261, UK261, RPPA ou SHY</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              D&apos;après les informations que vous avez saisies, ce vol spécifique n&apos;est pas couvert par les
              réglementations d&apos;indemnisation des passagers que nous traitons. EU261 et UK261 ne couvrent que les
              vols au départ d&apos;un aéroport UE/UK (toute compagnie), ou à l&apos;arrivée en UE/UK sur une compagnie
              européenne. Si vous avez un vol retour au départ d&apos;un aéroport UE ou UK, ce trajet est peut-être
              couvert — vous pouvez effectuer une nouvelle vérification pour celui-ci.
            </p>
            <button className="btn-cont" onClick={() => {
              checkInProgressRef.current = false;
              setAnswers(INITIAL_ANSWERS);
              setDetails(INITIAL_DETAILS);
              setResult(null);
              setScreen('hook');
            }}>
              Vérifier un autre vol
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

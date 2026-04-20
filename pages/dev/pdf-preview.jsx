import { useState } from 'react';
import { useRouter } from 'next/router';

// Sample data for PDF preview — edit freely to test different scenarios
const SAMPLE_DATA = {
  answers: {
    flightNumber: 'EZY8001',
    flightDate: '2026-03-20',
    from: 'LGW',
    to: 'EDI',
    disruption: 'delayed',
    airlineCode: 'EZY',
  },
  result: {
    verdict: 'likely',
    verdictNote: '',
    regulation: 'UK261',
    compensation: { amount: '£220', numeric: 220 },
    distanceKm: 530,
    depInfo: { region: 'UK', country: 'GB' },
    careRights: [],
    isCovered: true,
  },
  details: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    address: '45 High Street, Manchester, UK',
  },
};

const PRESETS = {
  EU261: {
    label: 'EU261 — CDG → LHR, cancelled (Air France)',
    data: {
      answers: { flightNumber: 'AF1234', flightDate: '2026-03-15', from: 'CDG', to: 'LHR', disruption: 'cancelled', airlineCode: 'AF' },
      result: { verdict: 'likely', verdictNote: '', regulation: 'EU261', compensation: { amount: '€600', numeric: 600 }, distanceKm: 345, depInfo: { region: 'EU', country: 'France' }, careRights: [], isCovered: true },
      details: { name: 'Jane Smith', email: 'jane.smith@example.com', address: '123 Test Street, London, UK' },
    },
  },
  UK261: {
    label: 'UK261 — LGW → EDI, 4h delay (easyJet)',
    data: {
      answers: { flightNumber: 'EZY8001', flightDate: '2026-03-20', from: 'LGW', to: 'EDI', disruption: 'delayed', airlineCode: 'EZY' },
      result: { verdict: 'likely', verdictNote: '', regulation: 'UK261', compensation: { amount: '£220', numeric: 220 }, distanceKm: 530, depInfo: { region: 'UK', country: 'GB' }, careRights: [], isCovered: true },
      details: { name: 'John Doe', email: 'john.doe@example.com', address: '45 High Street, Manchester, UK' },
    },
  },
  APPR: {
    label: 'Canada APPR — YYZ → YVR, denied boarding',
    data: {
      answers: { flightNumber: 'AC115', flightDate: '2026-04-01', from: 'YYZ', to: 'YVR', disruption: 'denied_boarding', airlineCode: 'AC' },
      result: { verdict: 'likely', verdictNote: '', regulation: 'APPR', compensation: { amount: 'CA$900', numeric: 900 }, distanceKm: 3350, depInfo: { region: 'CA', country: 'CA' }, careRights: [], isCovered: true },
      details: { name: 'Marie Tremblay', email: 'marie.tremblay@example.ca', address: '789 Maple Avenue, Toronto, ON, Canada' },
    },
  },
  SHY: {
    label: 'Turkey SHY — IST → LHR, cancelled',
    data: {
      answers: { flightNumber: 'TK1987', flightDate: '2026-05-10', from: 'IST', to: 'LHR', disruption: 'cancelled', airlineCode: 'TK' },
      result: { verdict: 'likely', verdictNote: '', regulation: 'SHY', compensation: { amount: '€600', numeric: 600 }, distanceKm: 2520, depInfo: { region: 'TR', country: 'TR' }, careRights: [], isCovered: true },
      details: { name: 'Ayşe Kaya', email: 'ayse.kaya@example.com', address: 'Bağcılar Mahallesi, Istanbul, Türkiye' },
    },
  },
};

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'tr', label: '🇹🇷 Türkçe' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'es', label: '🇪🇸 Español' },
];

export default function PdfPreview() {
  const router = useRouter();
  const [preset, setPreset] = useState('EU261');
  const [language, setLanguage] = useState('en');
  const [launched, setLaunched] = useState(false);

  function launchPreview() {
    const presetData = PRESETS[preset]?.data || PRESETS.EU261.data;
    const data = {
      ...presetData,
      answers: { ...presetData.answers, language },
    };
    sessionStorage.setItem('fc_claim', JSON.stringify(data));
    setLaunched(true);
    router.push('/success');
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 8 }}>
            Developer Tool
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>
            PDF Flight Compensation Kit Preview
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Loads mock claim data into sessionStorage and redirects to /success so you can test
            the full PDF generation flow without making a payment.
          </p>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Language
          </label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, marginBottom: 20 }}
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Scenario
          </label>
          <select
            value={preset}
            onChange={e => setPreset(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }}
          >
            {Object.entries(PRESETS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div style={{ marginTop: 16, background: '#0f172a', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mock data
            </div>
            <div style={{ fontSize: 11, color: '#60a5fa', marginBottom: 6, fontFamily: 'ui-monospace, monospace' }}>
              language: &quot;{language}&quot;
            </div>
            <pre style={{ fontSize: 12, color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
              {JSON.stringify(PRESETS[preset]?.data || {}, null, 2)}
            </pre>
          </div>
        </div>

        <button
          onClick={launchPreview}
          disabled={launched}
          style={{
            width: '100%', padding: '14px 24px',
            background: launched ? '#1e293b' : '#3b82f6',
            color: launched ? '#64748b' : '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 600, cursor: launched ? 'not-allowed' : 'pointer',
          }}
        >
          {launched ? 'Redirecting to /success…' : 'Launch PDF Preview →'}
        </button>

        <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          On /success, skip the timing form (or fill it in) then click &quot;Download Flight Compensation Kit (PDF)&quot;.
          <br />The AI letter generation will fire a real API call to /api/generate-letter.
        </p>

        <div style={{ marginTop: 32, borderTop: '1px solid #1e293b', paddingTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Other dev routes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['/admin/claims?key=flightcomp-admin-2026', 'Admin claims dashboard'],
              ['/authorize', 'Authorization form (no payment)'],
              ['/terms', 'Terms of Service'],
              ['/how-it-works', 'How It Works page'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none', padding: '6px 0' }}
              >
                {href} <span style={{ color: '#64748b' }}>— {label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

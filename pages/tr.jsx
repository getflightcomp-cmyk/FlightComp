import { useState } from 'react';
import Head from 'next/head';
import { assessClaim, assessClaimAPPR, assessClaimSHY, detectRegulation, tryResolveAirport } from '../lib/eu261';
import { resolveAirline, getCarrierRegion, isLargeCanadianCarrier } from '../lib/carriers';

/* ══════════════════════════════════════════════════════
   Turkish localization — standalone page
   Canonical: https://www.getflightcomp.com/tr
   Covers EU261 / UK261 / APPR / SHY (same logic, TR strings)
══════════════════════════════════════════════════════ */

function ProgressBar({ step, total, onBack }) {
  return (
    <div className="prog-wrap">
      <div className="prog-head">
        <button className="prog-back" onClick={onBack}>
          ← Geri
        </button>
        <span className="prog-step">{step}/{total}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ── S1: Aksama türü ───────────────────────────────────
function Q1Disruption({ value, onChange }) {
  const opts = [
    { value: 'delayed',    icon: '⏱️', title: 'Gecikmeli',        sub: 'Uçuş geç kalktı veya geç indi' },
    { value: 'cancelled',  icon: '✕',  title: 'İptal edildi',     sub: 'Uçuş gerçekleşmedi' },
    { value: 'denied',     icon: '🚫', title: 'Biniş reddedildi', sub: 'Uçağa almanlar engellendi' },
    { value: 'downgraded', icon: '⬇️', title: 'Sınıf düşürüldü', sub: 'Rezervasyondan daha düşük sınıfta yer verildi' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={1} total={6} onBack={() => history.back()} />
      <div className="q-body">
        <div className="q-label">Soru 1/6</div>
        <h2 className="q-head">Uçuşunuzda ne yaşandı?</h2>
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

// ── S2: Sefer numarası ────────────────────────────────
function Q2FlightNumber({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={2} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 2/6</div>
        <h2 className="q-head">Sefer numaranız neydi?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="örn. TK 123"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <p className="q-helper">
          Biniş kartınızda veya rezervasyon onayında bulunur.{' '}
          <strong>Bilmiyorsanız boş bırakabilirsiniz.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Devam →</button>
      </div>
    </div>
  );
}

// ── S3: Uçuş tarihi ───────────────────────────────────
function Q3Date({ value, onChange, onNext, onBack }) {
  return (
    <div className="screen">
      <ProgressBar step={3} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 3/6</div>
        <h2 className="q-head">Uçuş ne zaman gerçekleşti?</h2>
        <input
          className="inp inp-date"
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          autoFocus
        />
        <p className="q-helper">
          EU261 talepleri için <strong>3 yıllık süre sınırı</strong> (UK261 için 6 yıl, APPR için 1 yıl).
          Eski uçuşlar için de başvuru yapılabilir.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!value}>Devam →</button>
      </div>
    </div>
  );
}

// ── S4: Rota ──────────────────────────────────────────
function Q4Route({ from, to, onFromChange, onToChange, onNext, onBack }) {
  const fromResolved = from.trim().length > 2 ? tryResolveAirport(from) : true;
  const toResolved   = to.trim().length > 2   ? tryResolveAirport(to)   : true;
  const fromWarn = from.trim().length > 2 && !fromResolved;
  const toWarn   = to.trim().length > 2   && !toResolved;
  return (
    <div className="screen">
      <ProgressBar step={4} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 4/6</div>
        <h2 className="q-head">Rotanız neydi?</h2>
        <div className="route-row">
          <div className="route-wrap">
            <span className="route-lbl">Nereden</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Havalimanı kodu veya şehir (örn. IST, İstanbul)"
              value={from}
              onChange={e => onFromChange(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {fromWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                Bu havalimanını tanıyamadık. 3 harfli IATA kodunu deneyin (örn. IST, LHR, CDG).
              </span>
            )}
          </div>
          <div className="route-arrow">↓</div>
          <div className="route-wrap">
            <span className="route-lbl">Nereye</span>
            <input
              className="route-inp"
              type="text"
              placeholder="Havalimanı kodu veya şehir (örn. LHR, Londra)"
              value={to}
              onChange={e => onToChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {toWarn && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                Bu havalimanını tanıyamadık. 3 harfli IATA kodunu deneyin (örn. IST, LHR, CDG).
              </span>
            )}
          </div>
        </div>
        <p className="q-helper">
          <strong>AB/AEA/İngiltere havalimanlarından</strong> kalkan uçuşlar (EU261/UK261) ve
          <strong> Kanada havalimanlarına/dan uçuşlar</strong> (APPR) ve Türkiye&apos;deki uçuşlar (SHY) kapsanır.
        </p>
        <button className="btn-cont" onClick={onNext} disabled={!from.trim() || !to.trim()}>
          Devam →
        </button>
      </div>
    </div>
  );
}

// ── SAirline: Havayolu adı ────────────────────────────
function QAirline({ value, onChange, onNext, onBack }) {
  const resolved = value.trim().length > 1 ? resolveAirline(value) : true;
  const showWarn = value.trim().length > 2 && !resolved;
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 5/7</div>
        <h2 className="q-head">Uçuşu hangi havayolu işletti?</h2>
        <input
          className="inp inp-mono"
          type="text"
          placeholder="örn. Türk Hava Yolları veya TK"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {showWarn && (
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            Bu havayolunu tanıyamadık. 2 harfli IATA kodunu deneyin (örn. TK, PC, XQ) veya boş bırakın.
          </span>
        )}
        <p className="q-helper">
          Havayolu adını veya IATA kodunu girin (örn. TK, PC, XQ).{' '}
          <strong>Bilmiyorsanız boş bırakabilirsiniz.</strong>
        </p>
        <button className="btn-cont" onClick={onNext}>Devam →</button>
      </div>
    </div>
  );
}

// ── S5: Gecikme süresi (EU261/UK261) ─────────────────
function Q5Delay({ value, onChange, disruption, onBack }) {
  const opts = [
    { value: 'under2', title: '2 saatten az' },
    { value: '2to3',   title: '2 – 3 saat' },
    { value: '3to4',   title: '3 – 4 saat' },
    { value: '4plus',  title: '4 saat ve üzeri' },
  ];
  if (disruption !== 'delayed') return null;
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 5/6</div>
        <h2 className="q-head">Varışta gecikme ne kadar sürdü?</h2>
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
          EU261 tazminatı için <strong>son varış noktasında 3 saati aşan gecikme</strong> gerekir.
        </p>
      </div>
    </div>
  );
}

// ── S6: Neden (EU261/UK261) ───────────────────────────
function Q6Reason({ value, onChange, onBack }) {
  const opts = [
    { value: 'technical', icon: '🔧', title: 'Teknik / mekanik arıza', sub: 'Uçak arızası, bakım sorunu' },
    { value: 'crew',      icon: '👥', title: 'Mürettebat / personel',  sub: 'Eksik mürettebat, zamanlama sorunları' },
    { value: 'weather',   icon: '🌩️', title: 'Olumsuz hava koşulları', sub: 'Fırtına, sis, buz veya ATC kısıtlamaları' },
    { value: 'none',      icon: '❓', title: 'Açıklama yapılmadı',     sub: 'Havayolu neden bildirmedi' },
    { value: 'other',     icon: '📋', title: 'Diğer',                  sub: 'Grev, havalimanı yoğunluğu vb.' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={6} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 6/6</div>
        <h2 className="q-head">Havayolu ne gibi bir sebep gösterdi?</h2>
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

// ── S5 SHY: Gecikme süresi ───────────────────────────
function Q5SHYDelay({ value, onChange, onBack }) {
  const opts = [
    { value: 'under2', title: '2 saatten az' },
    { value: '2to3',   title: '2 – 3 saat' },
    { value: '3to4',   title: '3 – 4 saat' },
    { value: '4plus',  title: '5 saat ve üzeri' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={6} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 5/6</div>
        <h2 className="q-head">Varışta gecikme ne kadar sürdü?</h2>
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
          Türkiye SHY kapsamında <strong>gecikmeler nakit tazminat hakkı doğurmaz</strong> — yalnızca bakım hakları (yemek, konaklama) geçerlidir.
        </p>
      </div>
    </div>
  );
}

// ── S SHY Neden ───────────────────────────────────────
function QSHYReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'airline',      icon: '🔧', title: 'Havayolunun sorumluluğu', sub: 'Teknik arıza, mürettebat eksikliği, overbooking, operasyonel sorun' },
    { value: 'forcemajeure', icon: '🌩️', title: 'Mücbir sebep',            sub: 'Şiddetli hava, siyasi istikrarsızlık, doğal afet, havalimanı grevi, güvenlik riski' },
    { value: 'unknown',      icon: '❓', title: 'Açıklama yapılmadı',       sub: 'Havayolu neden bildirmedi' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru {step}/{total}</div>
        <h2 className="q-head">Aksamanın nedeni neydi?</h2>
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
          Teknik arızalar ve mürettebat eksikliği SHY kapsamında mücbir sebep sayılmaz — havayolunun <strong>sorumluluğundadır</strong>.
        </p>
      </div>
    </div>
  );
}

// ── S SHY Bildirim (iptaller) ─────────────────────────
function QSHYNotified({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'yes', icon: '✓', title: 'Evet, 14+ gün önceden', sub: 'Kalkıştan en az 14 gün önce bilgilendirildim' },
    { value: 'no',  icon: '✕', title: 'Hayır — 14 günden az',  sub: '14 günden kısa süre önce veya havalimanında öğrendim' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru {step}/{total}</div>
        <h2 className="q-head">İptal önceden size bildirildi mi?</h2>
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
          SHY kapsamında havayolları, yalnızca kalkıştan <strong>14 günden kısa süre önce</strong> yapılan iptaller için tazminat ödemek zorundadır.
        </p>
      </div>
    </div>
  );
}

// ── S5 APPR: Gecikme seviyesi ─────────────────────────
function Q5APPR({ value, onChange, onBack }) {
  const opts = [
    { value: 'under3', title: '3 saatten az' },
    { value: '3to6',   title: '3 – 6 saat' },
    { value: '6to9',   title: '6 – 9 saat' },
    { value: '9plus',  title: '9 saat ve üzeri' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={5} total={7} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru 5/7</div>
        <h2 className="q-head">Varışta gecikme ne kadar sürdü?</h2>
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
          APPR tazminatı <strong>3 saati aşan gecikmelerden</strong> itibaren başlar.
        </p>
      </div>
    </div>
  );
}

// ── S Havayolu büyüklüğü (APPR) ───────────────────────
function QAirlineSize({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'large',   icon: '✈️', title: 'Büyük havayolu', sub: 'Air Canada, WestJet, Porter, Sunwing, Swoop, Flair, Air Transat' },
    { value: 'small',   icon: '🛩️', title: 'Küçük havayolu', sub: 'Yukarıdaki listede yer almayan bölgesel veya charter taşıyıcı' },
    { value: 'unknown', icon: '❓', title: 'Emin değilim',    sub: 'Büyük havayolu oranları uygulanacak' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru {step}/{total}</div>
        <h2 className="q-head">Havayolu ne kadar büyük?</h2>
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
          APPR tazminat miktarları büyük ve küçük havayolları için farklıdır.
        </p>
      </div>
    </div>
  );
}

// ── S APPR Neden ──────────────────────────────────────
function QAPPRReason({ value, onChange, onBack, step, total }) {
  const opts = [
    { value: 'controlled',   icon: '🔧', title: 'Havayolunun kontrolünde', sub: 'Teknik arıza, mürettebat sorunu, planlama, aşırı bilet satışı' },
    { value: 'safety',       icon: '⚠️', title: 'Güvenlik kaynaklı',       sub: 'Uçağın yerde tutulmasını gerektiren güvenlik sorunu' },
    { value: 'uncontrolled', icon: '🌩️', title: 'Havayolu kontrolü dışı',  sub: 'Şiddetli hava, ATC, havalimanı güvenliği, kuş çarpması' },
    { value: 'unknown',      icon: '❓', title: 'Açıklama yapılmadı',       sub: 'Havayolu neden bildirmedi' },
  ];
  return (
    <div className="screen">
      <ProgressBar step={step} total={total} onBack={onBack} />
      <div className="q-body">
        <div className="q-label">Soru {step}/{total}</div>
        <h2 className="q-head">Aksamanın nedeni neydi?</h2>
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

// ── Sonuçlar ekranı ───────────────────────────────────
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

const CARE_I18N_TR = {
  care_meals_title:       'Yemek ve ikramlıklar',
  care_meals_eu_prop:     'Bekleme sürenizle orantılı olarak. Hemen havalimanı masasında yemek kuponu isteyin.',
  care_meals_appr_3h:     '3 saat ve üzeri gecikmeler için havayolu, yiyecek ve içecek kuponu sağlamak zorundadır.',
  care_meals_shy_2h:      '2 saat ve üzeri aksamalarda havayolu, yiyecek ve içeceği ücretsiz olarak karşılamak zorundadır.',
  care_comm_title:        'Ücretsiz iletişim',
  care_comm_eu:           'Aile veya iş arkadaşlarını bilgilendirmek için telefon, e-posta veya faks.',
  care_comm_appr:         'Havayolu, ücretsiz iletişim imkânı (telefon/internet) sağlamak zorundadır.',
  care_comm_shy:          'Havayolu, aile veya iş arkadaşlarını bilgilendirmek için ücretsiz telefon veya e-posta imkânı tanımak zorundadır.',
  care_hotel_title:       'Otel konaklaması',
  care_hotel_eu:          'Geceleme gerekiyorsa havayolu otel konaklamasını ayarlamak ve ödemek zorundadır.',
  care_hotel_appr:        'Geceleme gerekiyorsa havayolu otel konaklamasını ayarlamak ve ödemek zorundadır.',
  care_hotel_shy:         'Geceleme gerekiyorsa havayolu otel konaklamasını ayarlamak ve ödemek zorundadır.',
  care_transport_title:   'Havalimanı–otel transferi',
  care_transport_detail:  'Otel ile havalimanı arasında ücretsiz gidiş-dönüş transfer.',
  care_rebook_title:      'Yeniden rezervasyon veya iade',
  care_rebook_eu:         'Biletinizin tam iadesi veya ek ücret ödemeksizin bir sonraki uygun uçuşa yeniden rezervasyon seçeneklerinden birini talep edebilirsiniz.',
  care_rebook_appr:       'Tam iade veya ek ücret ödemeksizin bir sonraki uygun uçuşa yeniden rezervasyon seçeneklerinden birini talep edebilirsiniz.',
  care_rebook_shy:        'Biletinizin tam iadesi veya ek ücret ödemeksizin bir sonraki uygun uçuşa yeniden rezervasyon seçeneklerinden birini talep edebilirsiniz.',
};

const VERDICT_NOTES_I18N_TR = {
  verdict_note_appr_safety:      'Güvenlikle ilgili aksamalar APPR nakit tazminatından muaftır; ancak havayolları bakım (yemek, otel) ve yeniden rezervasyon sağlamak zorundadır.',
  verdict_note_shy_delay:        'SHY kapsamında havayolları, 2 saati aşan gecikmelerde yemek, ikramlık ve konaklama sağlamak zorundadır. Ancak gecikmeler için nakit tazminat öngörülmemektedir — yalnızca iptal ve biniş reddi durumlarında tazminat hakkı doğmaktadır.',
  verdict_note_shy_delay_eu261:  'SHY kapsamında havayolları, 2 saati aşan gecikmelerde yemek, ikramlık ve konaklama sağlamak zorundadır. Ancak gecikmeler için nakit tazminat öngörülmemektedir — yalnızca iptal ve biniş reddi durumlarında tazminat hakkı doğmaktadır. Uçuşunuz aynı zamanda gecikmeler için tazminat öngören AB261 kapsamında da değerlendirilebilir. Türkiye\'den hareket ettiğiniz için SHY\'yi seçtik; ancak havayolunuz AB\'ye kayıtlı ise AB261 kapsamında başvuru yapmayı da düşünebilirsiniz.',
  verdict_note_shy_forcemajeure: 'Mücbir sebep olayları (şiddetli hava, siyasi istikrarsızlık, doğal afetler, güvenlik riskleri, havalimanı grevleri) havayollarını SHY nakit tazminatından muaf kılar. Bakım hakları (yemek, konaklama, yeniden rezervasyon) geçerliliğini korur.',
  verdict_note_eu_extraordinary:  'Olağanüstü koşullar (hava durumu, ATC grevleri, güvenlik olayları) havayollarını nakit tazminat ödemekten muaf kılar. Ancak bakım haklarınız — yemek, otel, yeniden rezervasyon — etkilenmez.',
};

const VERDICT_META_TR = {
  likely:   { badge: 'TAZMİNAT HAKKINIZ MUHTEMEL',     dot: '🟢' },
  possibly: { badge: 'TAZMİNAT HAKKINIZ OLABİLİR',     dot: '🟡' },
  unlikely: { badge: 'TAZMİNAT HAKKI MUHTEMELEN YOK',  dot: '🔴' },
};

const DISRUPTION_LABELS_TR = {
  cancelled:  'İptal',
  delayed:    'Gecikme',
  denied:     'Biniş reddi',
  downgraded: 'Sınıf düşürme',
};

function ResultsScreen({ result, answers, onGetLetter, onReset }) {
  const [captureEmail, setCaptureEmail]     = useState('');
  const [captureStatus, setCaptureStatus]   = useState('idle');

  const { verdict, regulation, compensation, verdictNote, careRights, distanceKm, shyMeta } = result;
  const meta = VERDICT_META_TR[verdict] ?? VERDICT_META_TR.likely;
  const amountDisplay = compensation?.amount || (verdict !== 'unlikely' ? '€250–€600' : null);
  const isSHYDelay = regulation === 'SHY' && answers.disruption === 'delayed';
  const showPrimaryCTA = verdict === 'likely' || verdict === 'possibly' || isSHYDelay;
  const showSecondaryCTA = (verdict === 'likely' || verdict === 'possibly') && !isSHYDelay;

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
    ? 'Kanada APPR (SOR/2019-150)'
    : regulation === 'SHY'
    ? 'Türkiye SHY (Sivil Havacılık Yönetmeliği)'
    : 'AB Tüzüğü 261/2004';

  return (
    <div className="res">
      <div className={`vbanner ${verdict}`}>
        <div className="veyebrow">{meta.dot} Sonucunuz</div>
        <div className="vbadge">{meta.badge}</div>
        {amountDisplay ? (
          <>
            <div className="vamount">{amountDisplay}</div>
            <div className="vreg">{regLabel} kapsamında</div>
          </>
        ) : (
          <div className="vreg" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Nakit tazminat yok — bakım hakları geçerli olabilir
          </div>
        )}
        {verdictNote && <p className="vnote">{VERDICT_NOTES_I18N_TR[verdictNote] ?? verdictNote}</p>}
        {shyMeta && (
          <div className="vnote" style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            <strong>Son başvuru tarihi:</strong> {shyMeta.deadline}<br />
            <strong>Şikâyet mercii:</strong> {shyMeta.escalation}
          </div>
        )}
      </div>

      <div className="res-body">

        {/* ── Mevzuat referansı ── */}
        {verdict !== 'unlikely' && regulation && (
          <div className="reg-citation">
            {regulation === 'EU261' && (
              <>
                <strong>AB Tüzüğü 261/2004, Madde 7(1)</strong> kapsamında <strong>{amountDisplay}</strong> tazminat hakkınız doğmuş olabilir. Madde 5(1)(c) uyarınca havayolları, yolcuları en az 14 gün önceden bilgilendirmedikleri iptallerde tazminat ödemek zorundadır.
              </>
            )}
            {regulation === 'UK261' && (
              <>
                <strong>UK Tüzüğü 261 (korunan AB hukuku), Madde 7(1)</strong> kapsamında <strong>{amountDisplay}</strong> tazminat hakkınız doğmuş olabilir. İngiltere Sivil Havacılık Otoritesi (CAA), İngiltere&apos;den kalkan uçuşlarda bu hakları denetlemektedir.
              </>
            )}
            {regulation === 'APPR' && (
              <>
                <strong>Kanada Hava Yolcusu Koruma Yönetmelikleri (SOR/2019-150), Madde 19(1)</strong> kapsamında <strong>{amountDisplay}</strong> tazminat hakkınız doğmuş olabilir. Kanada Ulaştırma Ajansı şikâyetleri almaktadır.
              </>
            )}
            {regulation === 'SHY' && (
              <>
                <strong>Türkiye SHY Yolcu Hakları Yönetmeliği</strong> kapsamında uluslararası uçuşlar için <strong>{amountDisplay}</strong> tazminat hakkınız doğmuş olabilir. Türkiye Sivil Havacılık Genel Müdürlüğü (SHGM) bu hakları denetlemektedir.
              </>
            )}
          </div>
        )}

        {/* ── BİRİNCİL CTA ── */}
        {showPrimaryCTA && (() => {
          const disruptionMap = {
            cancelled:  'İptal',
            delayed:    '3 saati aşan gecikme',
            denied:     'Biniş reddi',
            downgraded: 'Sınıf düşürme',
          };
          const params = new URLSearchParams();
          if (answers.flightNumber) params.set('flight',       answers.flightNumber);
          if (answers.flightDate)   params.set('date',         answers.flightDate);
          if (answers.from)         params.set('from',         answers.from);
          if (answers.to)           params.set('to',           answers.to);
          if (answers.disruption)   params.set('disruption',   disruptionMap[answers.disruption] || answers.disruption);
          if (regulation)           params.set('regulation',   regulation);
          if (compensation?.amount) params.set('compensation', compensation.amount);
          params.set('lang', 'tr');
          const authorizeUrl = `/authorize?${params.toString()}`;

          let airlineName = 'havayoluna';
          try {
            const carrier = resolveAirline(answers.flightNumber);
            if (carrier?.name) airlineName = carrier.name + ' şirketine';
          } catch { /* keep default */ }

          return (
            <div className="cta-handle">
              <div className="cta-handle-top">
                <span className="cta-handle-title">Başvurunuzu biz yapalım</span>
              </div>
              <div className="cta-howit">
                <div className="cta-step"><span className="cta-step-n">1</span><span>Bizim adınıza hareket etmemize yetki veriyorsunuz.</span></div>
                <div className="cta-step"><span className="cta-step-n">2</span><span>Başvurunuzu doğrudan {airlineName} iletiyoruz.</span></div>
                <div className="cta-step"><span className="cta-step-n">3</span><span>Tüm takip ve itiraz süreçlerini yönetiyoruz.</span></div>
                <div className="cta-step"><span className="cta-step-n">4</span><span>Yalnızca başarı durumunda %25 ödüyorsunuz. Sonuç alınamazsa ücret alınmaz.</span></div>
              </div>
              <a className="btn-authorize" href={authorizeUrl}>
                Yetkilendirmeyi Başlat →
              </a>
              <div className="notify-fallback">
                <p className="notify-fallback-label">Henüz hazır değil misiniz? E-postanızı bırakın, sizi arayalım.</p>
                {captureStatus === 'done' ? (
                  <div className="notify-success">✓ Tamam — en kısa sürede size ulaşacağız.</div>
                ) : captureStatus === 'error' ? (
                  <div className="notify-error">Bir hata oluştu — lütfen tekrar deneyin.</div>
                ) : (
                  <form className="notify-row" onSubmit={handleCapture}>
                    <input
                      className="notify-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="E-posta adresiniz"
                      value={captureEmail}
                      onChange={e => setCaptureEmail(e.target.value)}
                      required
                    />
                    <button className="btn-notify" type="submit" disabled={!captureEmail.trim() || captureStatus === 'submitting'}>
                      Haber Ver
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── İKİNCİL CTA: Tazminat Kiti ── */}
        {showSecondaryCTA && (
          <div className="cta-diy">
            <div className="cta-diy-head">
              <span className="cta-diy-title">Uçuş Tazminat Kitinizi Alın</span>
              <span className="cta-diy-price">$14.99</span>
            </div>
            <p className="cta-diy-desc">
              Kişiselleştirilmiş talep mektubu, havayoluna başvuru rehberi ve takip şablonlarını içeren eksiksiz {regulation} Uçuş Tazminat Kiti. PDF olarak indirin ve kendiniz gönderin.
            </p>
            <button className="btn-diy" onClick={onGetLetter}>
              Uçuş Tazminat Kitini Al — $14.99
            </button>
          </div>
        )}

        <Expander icon="🛡️" label="Havayolunun size şu an sağlaması gerekenler">
          {careRights.length > 0 ? (
            <div className="care-list">
              {careRights.map((r, i) => (
                <div key={i} className="care-item">
                  <span className="care-em">{r.emoji}</span>
                  <div className="care-txt">
                    <strong>{CARE_I18N_TR[r.titleKey] ?? r.titleKey}</strong><br />{CARE_I18N_TR[r.detailKey] ?? r.detailKey}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, paddingTop: 14, lineHeight: 1.6 }}>
              Bu aksama düzeyi için anlık bakım yükümlülüğü bulunmamaktadır.
            </p>
          )}
          <div className="care-clarifier">
            Bu anlık haklar, yasal tazminattan bağımsızdır. Havayolu her ikisini de sağlamakla yükümlüdür.
          </div>
        </Expander>

        <div className="summary">
          {[
            ['Aksama türü', DISRUPTION_LABELS_TR[answers.disruption] || '—'],
            ['Sefer',       answers.flightNumber || '—'],
            ['Rota',        `${answers.from} → ${answers.to}`],
            ['Mesafe',      distanceKm ? `~${distanceKm.toLocaleString()} km` : 'Bilinmiyor'],
            ['Mevzuat',     regulation],
            ['Tarih',       answers.flightDate || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="sum-label">{label}</div>
              <div className="sum-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="res-disclaimer">
          Sorumluluk reddi: FlightComp bir hukuk bürosu değildir ve hukuki tavsiye vermemektedir. EU261/UK261/APPR/SHY kapsamındaki haklarınız hakkında bilgi sunmakta ve talebinizi takip etmenize yardımcı olmaktayız. Hukuki danışmanlık için bir avukattan yardım almanızı öneririz.
        </div>

        <div className="reset-link">
          <button onClick={onReset}>← Başka bir uçuşu sorgula</button>
        </div>
      </div>
    </div>
  );
}

// ── Kişisel Bilgiler ekranı ───────────────────────────
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
        <button className="prog-back" onClick={onBack}>← Sonuçlara geri dön</button>
      </div>
      <div className="details-body">
        <div>
          <div className="q-label">Neredeyse tamam</div>
          <h2 className="q-head" style={{ fontSize: 22 }}>Mektup için bilgileriniz</h2>
        </div>

        <div className="field-group">
          <label className="field-label">Ad Soyad *</label>
          <input
            className="field-input"
            type="text"
            placeholder="örn. Ahmet Yılmaz"
            value={details.name}
            onChange={e => onChange({ name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label className="field-label">E-posta adresi *</label>
          <input
            className="field-input"
            type="email"
            placeholder="ahmet@ornek.com"
            value={details.email}
            onChange={e => onChange({ email: e.target.value })}
          />
          <span className="field-hint">Fatura ve takip e-postanız buraya gönderilecektir.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Ev adresi *</label>
          <textarea
            className="field-textarea"
            placeholder={"Örnek Mah. Atatürk Cad. No:1\nİstanbul\n34000"}
            value={details.address}
            onChange={e => onChange({ address: e.target.value })}
            rows={3}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Rezervasyon numarası</label>
          <input
            className="field-input inp-mono"
            type="text"
            placeholder="örn. ABC123"
            value={details.bookingRef}
            onChange={e => onChange({ bookingRef: e.target.value.toUpperCase() })}
            style={{ fontSize: 16 }}
          />
          <span className="field-hint">İsteğe bağlı — başvurunuzu güçlendirir.</span>
        </div>

        <div className="field-group">
          <label className="field-label">Banka / ödeme bilgileri</label>
          <textarea
            className="field-textarea"
            placeholder={"IBAN: TR00 0000 0000 0000 0000 0000 00\nveya PayPal: ahmet@ornek.com\n(İsteğe bağlı — havayolunun para iadesi için)"}
            value={details.bankDetails}
            onChange={e => onChange({ bankDetails: e.target.value })}
            rows={3}
          />
          <span className="field-hint">İsteğe bağlı. Yalnızca mektubunuzun içinde kullanılır.</span>
        </div>

        <div className="payment-card">
          <span className="payment-card-ico">🔒</span>
          <div className="payment-card-txt">
            <div className="payment-card-title">Stripe üzerinden güvenli ödeme</div>
            <div className="payment-card-sub">
              Ödeme tamamlandıktan hemen sonra mektubunuz oluşturulur.
              Kart bilgileri Stripe tarafından işlenir — biz görmeyiz.
            </div>
          </div>
          <span className="payment-price">$14.99</span>
        </div>

        <button className="btn-pay" onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Yönlendiriliyor…' : '$14.99 Öde ve Mektubumu Al →'}
        </button>
        <div className="secure-note">🔒 Stripe ile güvenli · SSL şifreli</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Ana sayfa — durum makinesi
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
  language: 'tr',
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

export default function TurkishHome() {
  const restored = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('fc_claim_tr');
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
    sessionStorage.setItem('fc_claim_tr', JSON.stringify(payload));
    // Also set the main key so the /success page can read it
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
      language:     'tr',
    };

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: details.email,
        successUrl: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${base}/tr`,
        claimMeta,
        language: 'tr',
      }),
    });

    if (!res.ok) { alert('Ödeme başlatılamadı. Lütfen tekrar deneyin.'); return; }
    const { url } = await res.json();
    window.location.href = url;
  }

  // ── Render ─────────────────────────────────────────

  const langToggle = <LangToggle active="TR" />;

  if (screen === 'hook') {
    return (
      <>
        <Head>
          <title>Uçuş İptali Tazminat Hesaplama | FlightComp — SHY &amp; EU261</title>
          <meta name="description" content="Ücretsiz uçuş iptali ve gecikme tazminat sorgulama. SHY yolcu hakları, EU261 ve UK261 kapsamında tazminat hakkınızı 60 saniyede öğrenin." />
          <meta name="keywords" content="uçuş iptali tazminat, SHY yolcu hakları, EU261 Türkiye, uçuş gecikmesi tazminat, havayolu şikayeti, SHY yönetmeliği, uçuş hakkı sorgula" />
          <meta property="og:title" content="Uçuşunuz iptal mi edildi? 60 saniyede tazminat hakkınızı öğrenin." />
          <meta property="og:description" content="Ücretsiz SHY / EU261 uygunluk sorgulama. Anında sonuç, kayıt gerektirmez." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.getflightcomp.com/tr" />
          <link rel="canonical" href="https://www.getflightcomp.com/tr" />
          <link rel="alternate" hrefLang="tr" href="https://www.getflightcomp.com/tr" />
          <link rel="alternate" hrefLang="en" href="https://www.getflightcomp.com" />
          <link rel="alternate" hrefLang="fr" href="https://www.getflightcomp.com/fr" />
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
                Uçuşunuz iptal mi edildi veya gecikti mi?<br />
                60 saniyede tazminat hakkınızı öğrenin.
              </h1>
              <div className="lp-badge" style={{ marginTop: 0, marginBottom: 20 }}>✈️ SHY / EU261 / UK261 / Kanada APPR</div>
              <p className="lp-sub">
                Havayolları yasal olarak size €600&apos;a kadar (AB/İngiltere), CA$1.000&apos;e kadar (Kanada) veya €600&apos;a kadar (Türkiye) tazminat ödemek zorundadır — ancak bürokratik engeller koyarak bunu zorlaştırırlar. Biz bu engelleri aşıyoruz.
              </p>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Uçuşumu Sorgula →
              </button>
              <div className="lp-hero-trust">
                <span>Ücretsiz</span>
                <span className="lp-dot">·</span>
                <span>Kayıt gerekmez</span>
                <span className="lp-dot">·</span>
                <span>Anında sonuç</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
                AB, İngiltere, Kanada ve Türkiye&apos;deki uçuşları kapsar.
                ABD iç hat seferleri kapsam dışıdır.
              </p>
            </div>
          </section>

          {/* ── NASIL ÇALIŞIR ── */}
          <section className="lp-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">Nasıl çalışır</h2>
              <div className="lp-steps">
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">1</span>
                    <span className="lp-step-ico">📋</span>
                  </div>
                  <div className="lp-step-title">6 kısa soruyu yanıtlayın</div>
                  <div className="lp-step-body">Sefer numarası, rota, aksama türü, gecikme süresi ve havayolunun gösterdiği neden.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">2</span>
                    <span className="lp-step-ico">✅</span>
                  </div>
                  <div className="lp-step-title">Uygunluk sonucunuzu alın</div>
                  <div className="lp-step-body">SHY, EU261, UK261 ve APPR kapsamında haklarınızı kontrol eder, ne kadar tazminat alabileceğinizi bildiririz.</div>
                </div>
                <div className="lp-step">
                  <div className="lp-step-top">
                    <span className="lp-step-num">3</span>
                    <span className="lp-step-ico">💰</span>
                  </div>
                  <div className="lp-step-title">Biz hallediyoruz</div>
                  <div className="lp-step-body">Başvurunuzu sunmamıza yetki verin — %25 başarı ücreti, sonuç alınamazsa ücret alınmaz. Ya da $14.99&apos;lık Tazminat Kiti ile kendiniz gönderin.</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── GÜVEN SİNYALLERİ ── */}
          <section className="lp-section lp-trust-section">
            <div className="lp-section-inner">
              <h2 className="lp-section-h">SHY Yönetmeliği ve EU261 kapsamında haklar</h2>
              <p className="lp-body">
                Türkiye SHY yönetmeliği ve AB Tüzüğü 261/2004, havayollarının uygun uçuşlarda iptal, uzun gecikme ve biniş reddi için yolculara tazminat ödemesini zorunlu kılar. Avukatsız talep edebilirsiniz.
              </p>
              <div className="lp-comp-grid">
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€250</span>
                  <span className="lp-comp-lbl">1.500 km&apos;nin altındaki uçuşlar</span>
                </div>
                <div className="lp-comp-card">
                  <span className="lp-comp-amt">€400</span>
                  <span className="lp-comp-lbl">1.500–3.500 km arası uçuşlar</span>
                </div>
                <div className="lp-comp-card lp-comp-card-hi">
                  <span className="lp-comp-amt">€600</span>
                  <span className="lp-comp-lbl">3.500 km&apos;yi aşan uçuşlar</span>
                </div>
              </div>
              <div className="lp-uk-note">İngiltere uçuşları (UK261 — £220/£350/£520), Kanada uçuşları (APPR — CA$400/CA$700/CA$1.000) ve Türkiye uçuşları (SHY — yurt içi €100 / uluslararası €250–€600 iptal &amp; biniş reddi; gecikmede yalnızca bakım hakkı) da kapsanmaktadır.</div>
            </div>
          </section>

          {/* ── FİNAL CTA ── */}
          <section className="lp-final-cta">
            <div className="lp-section-inner lp-final-inner">
              <h2 className="lp-final-h">Uçuşunuzun uygun olup olmadığını kontrol edin</h2>
              <button className="btn-hook lp-cta" onClick={() => setScreen('q1')}>
                Uçuşumu Sorgula →
              </button>
              <div className="lp-final-sub">Ücretsiz · 60 saniye · AB, İngiltere, Kanada ve Türkiye uçuşlarını kapsar</div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="lp-footer">
            <div className="lp-footer-inner">
              <div className="lp-footer-brand">FlightComp — SHY / EU261 / UK261 Uçuş Tazminat Aracı</div>
              <div className="lp-footer-links">
                <a href="/about">Hakkımızda</a>
                <a href="/how-it-works">Nasıl Çalışır</a>
                <a href="/blog">Blog</a>
                <a href="/privacy">Gizlilik Politikası</a>
                <a href="/terms">Kullanım Şartları</a>
                <a href="mailto:support@getflightcomp.com">İletişim</a>
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
            <h2 className="q-head" style={{ color: 'var(--text)' }}>EU261, UK261, APPR veya SHY kapsamında değil</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Girdiğiniz bilgilere göre bu uçuş, ele aldığımız yolcu tazminat mevzuatları kapsamında yer almıyor.
              EU261 ve UK261 yalnızca bir AB/UK havalimanından kalkan uçuşları (herhangi bir havayolu) veya
              AB/UK&apos;a Avrupalı bir havayoluyla gelen uçuşları kapsar. AB ya da UK havalimanından kalkan bir
              dönüş bacağınız varsa, o bacak kapsama girebilir — bunun için ayrıca sorgulama yapabilirsiniz.
            </p>
            <button className="btn-cont" onClick={() => {
              setAnswers(INITIAL_ANSWERS);
              setDetails(INITIAL_DETAILS);
              setResult(null);
              setScreen('hook');
            }}>
              Başka Bir Uçuşu Sorgula
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

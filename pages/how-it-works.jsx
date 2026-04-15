import Head from 'next/head';
import Link from 'next/link';

function Step({ n, title, body }) {
  return (
    <div className="hiw-step">
      <div className="hiw-step-n">{n}</div>
      <div className="hiw-step-content">
        <div className="hiw-step-title">{title}</div>
        <div className="hiw-step-body">{body}</div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <div className="hiw-faq-item">
      <div className="hiw-faq-q">{q}</div>
      <div className="hiw-faq-a">{a}</div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works | FlightComp</title>
        <meta name="description" content="From eligibility check to compensation in your account — here's exactly what happens at every step, for both the Flight Compensation Kit and our managed service." />
      </Head>
      <div className="hiw-pg">
        <div className="hiw-inner">
          <Link href="/" className="legal-back">← Back to Home</Link>

          {/* ── Hero ── */}
          <section className="hiw-hero">
            <h1 className="hiw-h1">How FlightComp Works</h1>
            <p className="hiw-sub">
              From eligibility check to compensation in your account — here&apos;s exactly what happens at every step.
            </p>
          </section>

          {/* ── Two tracks ── */}
          <section className="hiw-tracks">

            {/* Track 1: DIY */}
            <div className="hiw-track">
              <div className="hiw-track-header">
                <div className="hiw-track-badge hiw-track-badge-diy">Do It Yourself</div>
                <div className="hiw-track-price">$19 Flight Compensation Kit</div>
              </div>
              <div className="hiw-track-steps">
                <Step n="1" title="Check your eligibility (free)"
                  body="Answer a few questions about your flight. We'll tell you instantly if you're likely owed compensation and how much, based on the specific regulation that applies to your route." />
                <Step n="2" title="Get your Flight Compensation Kit ($19)"
                  body="We generate a personalized, legally-cited claim letter addressed to your airline. The kit includes the letter, step-by-step submission instructions, follow-up templates, and a guide on what to expect." />
                <Step n="3" title="Submit to your airline"
                  body="Send the letter to your airline using the instructions in your kit. Most airlines have a dedicated claims or customer relations email. The letter does the heavy lifting." />
                <Step n="4" title="Get paid"
                  body="Airlines typically respond within 4–8 weeks. If they reject your claim, the kit includes follow-up templates and escalation guidance for the relevant aviation authority." />
              </div>
            </div>

            {/* Track 2: Managed */}
            <div className="hiw-track">
              <div className="hiw-track-header">
                <div className="hiw-track-badge hiw-track-badge-managed">Let Us Handle It</div>
                <div className="hiw-track-price">25% — No Win, No Fee</div>
              </div>
              <div className="hiw-track-steps">
                <Step n="1" title="Check your eligibility (free)"
                  body="Same as above. Answer a few questions and get your verdict instantly — no signup required." />
                <Step n="2" title="Authorize us to act on your behalf"
                  body="Sign a simple digital authorization. This lets us contact the airline and manage the entire process for you. Takes about two minutes." />
                <Step n="3" title="We submit and follow up"
                  body="We send a formal claim letter to the airline on your behalf, citing the specific legal provisions. If the airline doesn't respond or rejects the claim, we send follow-ups and can escalate to the relevant aviation authority — UK CAA, Canadian CTA, Turkish DGCA, or EU national enforcement bodies." />
                <Step n="4" title="You get paid"
                  body="When the airline pays, we transfer the compensation to your bank account minus our 25% fee. If we don't recover anything, you owe nothing." />
              </div>
            </div>

          </section>

          {/* ── Example letter ── */}
          <section className="hiw-section">
            <h2 className="hiw-section-h">What your claim letter looks like</h2>
            <div className="hiw-letter">
              <pre className="hiw-letter-body">{`[Airline Name] Customer Relations
[Airline Address]

15 March 2026

Re: Claim for Compensation — Flight XX1234, 15 March 2026
    London Heathrow (LHR) → Rome Fiumicino (FCO)
    Passenger: J. Smith

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004
for the cancellation of the above-referenced flight.

Pursuant to Article 5(1)(c)(iii) of EU Regulation 261/2004, passengers are
entitled to compensation where a flight is cancelled and the operating air
carrier fails to inform them of the cancellation at least 14 days before the
scheduled departure date.

Pursuant to Article 7(1)(b) of EU Regulation 261/2004, for intra-Community
flights of more than 1,500 km and all other flights between 1,500 km and
3,500 km, the compensation amount is €400.

I was not informed of the cancellation at least 14 days before the scheduled
departure of 15 March 2026, and no alternative flight was offered within the
time windows specified in Article 5(1)(c).

I therefore request payment of €400 compensation within 14 days of this
letter. If I do not receive a satisfactory response within that time, I will
escalate this matter to the relevant national enforcement body.

Sincerely,
J. Smith`}</pre>
            </div>
            <p className="hiw-letter-note">
              Every FlightComp letter is tailored to your specific flight, regulation, and circumstances. No generic templates.
            </p>
          </section>

          {/* ── Timeline ── */}
          <section className="hiw-section">
            <h2 className="hiw-section-h">How long does it take?</h2>
            <div className="hiw-timeline">
              <div className="hiw-tl-row">
                <div className="hiw-tl-label">Eligibility check</div>
                <div className="hiw-tl-val">Instant</div>
              </div>
              <div className="hiw-tl-row">
                <div className="hiw-tl-label">Flight Compensation Kit delivery</div>
                <div className="hiw-tl-val">Immediate (digital download)</div>
              </div>
              <div className="hiw-tl-row">
                <div className="hiw-tl-label">Airline response (typical)</div>
                <div className="hiw-tl-val">4–8 weeks</div>
              </div>
              <div className="hiw-tl-row">
                <div className="hiw-tl-label">If escalation needed</div>
                <div className="hiw-tl-val">2–6 months</div>
              </div>
            </div>
            <p className="hiw-tl-note">
              Some airlines respond quickly; others drag their feet. Our managed service follows up persistently until the case is resolved.
            </p>
          </section>

          {/* ── Rejection ── */}
          <section className="hiw-section">
            <h2 className="hiw-section-h">What happens if your claim is rejected?</h2>
            <p className="hiw-body">
              Airlines reject claims frequently, often citing &quot;extraordinary circumstances.&quot; Many of these rejections
              are invalid — a technical fault, for example, is not an extraordinary circumstance under EU261, even if
              the airline frames it as one.
            </p>
            <p className="hiw-body">
              FlightComp&apos;s managed service includes follow-up rebuttals citing relevant case law and specific
              regulation provisions. If the airline still won&apos;t pay, we escalate to the relevant national aviation
              authority. This is included in the 25% fee — no extra charge, no surprise legal fees.
            </p>
          </section>

          {/* ── FAQ ── */}
          <section className="hiw-section">
            <h2 className="hiw-section-h">Common questions</h2>
            <div className="hiw-faq">
              <FaqItem
                q="Is FlightComp a law firm?"
                a="No. We're a claims management service. We help you exercise your legal rights under passenger protection regulations. For complex legal matters, we recommend consulting a qualified attorney."
              />
              <FaqItem
                q="What regulations do you cover?"
                a="EU Regulation 261/2004, UK Regulation 261 (retained EU law), Canadian Air Passenger Protection Regulations (APPR, SOR/2019-150), and Turkey's SHY Regulation. These cover most flights to, from, and within Europe, the UK, Canada, and Turkey."
              />
              <FaqItem
                q="How far back can I claim?"
                a="EU261: up to 3 years (some EU countries allow 6 years). UK261: 6 years. Canada APPR: 1 year. Turkey SHY: 1 year. Time limits vary — check sooner rather than later."
              />
              <FaqItem
                q="Do I need to have kept my boarding pass?"
                a="It helps, but it's not always required. A booking confirmation or e-ticket receipt is usually sufficient to establish you were on the flight."
              />
              <FaqItem
                q="What if I already contacted the airline myself?"
                a="You can still use FlightComp. If the airline rejected your direct claim, our managed service can send a formal follow-up with stronger legal citations and escalation if needed."
              />
            </div>
          </section>

          {/* ── COMPARISON ── */}
          <section className="hiw-section">
            <h2 className="hiw-section-h">How FlightComp compares</h2>

            {/* Desktop table */}
            <div className="hiw-cmp-desktop">
              <div className="cmp-wrap">
                <table className="cmp-table">
                  <thead>
                    <tr>
                      <th className="cmp-th cmp-th-feature"></th>
                      <th className="cmp-th cmp-th-us">FlightComp</th>
                      <th className="cmp-th">AirHelp</th>
                      <th className="cmp-th">ClaimCompass</th>
                      <th className="cmp-th">Skycop</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cmp-td cmp-td-feature">Eligibility check</td>
                      <td className="cmp-td cmp-td-us"><span className="cmp-chk">✓</span> Free</td>
                      <td className="cmp-td"><span className="cmp-x">✕</span> Paywalled</td>
                      <td className="cmp-td"><span className="cmp-chk">✓</span> Free</td>
                      <td className="cmp-td"><span className="cmp-chk">✓</span> Free</td>
                    </tr>
                    <tr>
                      <td className="cmp-td cmp-td-feature">Flight Compensation Kit</td>
                      <td className="cmp-td cmp-td-us"><span className="cmp-chk">✓</span> $19 flat fee</td>
                      <td className="cmp-td cmp-na">N/A</td>
                      <td className="cmp-td cmp-na">N/A</td>
                      <td className="cmp-td cmp-na">N/A</td>
                    </tr>
                    <tr>
                      <td className="cmp-td cmp-td-feature">Managed service fee</td>
                      <td className="cmp-td cmp-td-us"><strong>25%</strong></td>
                      <td className="cmp-td">~35% <span className="cmp-caveat">(up to 50% with legal)</span></td>
                      <td className="cmp-td">~35% <span className="cmp-caveat">(up to 50% with legal)</span></td>
                      <td className="cmp-td">~25% <span className="cmp-caveat">(up to 50% with legal)</span></td>
                    </tr>
                    <tr>
                      <td className="cmp-td cmp-td-feature">Additional legal fees</td>
                      <td className="cmp-td cmp-td-us"><span className="cmp-chk">✓</span> None</td>
                      <td className="cmp-td"><span className="cmp-x">✕</span> Up to 15% extra</td>
                      <td className="cmp-td"><span className="cmp-x">✕</span> Up to 15% extra</td>
                      <td className="cmp-td"><span className="cmp-x">✕</span> Up to 25% extra</td>
                    </tr>
                    <tr>
                      <td className="cmp-td cmp-td-feature">No win, no fee</td>
                      <td className="cmp-td cmp-td-us"><span className="cmp-chk">✓</span> Yes</td>
                      <td className="cmp-td"><span className="cmp-chk">✓</span> Yes</td>
                      <td className="cmp-td"><span className="cmp-chk">✓</span> Yes</td>
                      <td className="cmp-td"><span className="cmp-chk">✓</span> Yes</td>
                    </tr>
                    <tr>
                      <td className="cmp-td cmp-td-feature">Regulations covered</td>
                      <td className="cmp-td cmp-td-us"><strong>EU261, UK261, APPR, SHY</strong></td>
                      <td className="cmp-td">EU261, UK261</td>
                      <td className="cmp-td">EU261, UK261</td>
                      <td className="cmp-td">EU261</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="hiw-cmp-mobile">
              {[
                {
                  name: 'AirHelp',
                  eligibility: ['✕ Paywalled', '✓ Free'],
                  diy:         ['N/A',          '✓ $19'],
                  fee:         ['~35%+',         '25%'],
                  legal:       ['Up to 15% extra', 'None'],
                  regs:        ['EU261, UK261',  'EU261, UK261, APPR, SHY'],
                },
                {
                  name: 'ClaimCompass',
                  eligibility: ['✓ Free',        '✓ Free'],
                  diy:         ['N/A',            '✓ $19'],
                  fee:         ['~35%+',           '25%'],
                  legal:       ['Up to 15% extra', 'None'],
                  regs:        ['EU261, UK261',    'EU261, UK261, APPR, SHY'],
                },
                {
                  name: 'Skycop',
                  eligibility: ['✓ Free',         '✓ Free'],
                  diy:         ['N/A',             '✓ $19'],
                  fee:         ['~25%+',            '25%'],
                  legal:       ['Up to 25% extra',  'None'],
                  regs:        ['EU261',            'EU261, UK261, APPR, SHY'],
                },
              ].map(c => (
                <div key={c.name} className="hiw-cmp-card">
                  <div className="hiw-cmp-card-head">
                    {c.name} <span>vs FlightComp</span>
                  </div>
                  {[
                    { label: 'Eligibility check', theirs: c.eligibility[0], ours: c.eligibility[1] },
                    { label: 'Flight Compensation Kit', theirs: c.diy[0],    ours: c.diy[1] },
                    { label: 'Managed fee',       theirs: c.fee[0],         ours: c.fee[1] },
                    { label: 'Extra legal fees',  theirs: c.legal[0],       ours: c.legal[1] },
                    { label: 'Regulations',       theirs: c.regs[0],        ours: c.regs[1] },
                  ].map(row => (
                    <div key={row.label} className="hiw-cmp-row">
                      <span className="hiw-cmp-label">{row.label}</span>
                      <div className="hiw-cmp-vals">
                        <span className="hiw-cmp-theirs">{row.theirs}</span>
                        <span className="hiw-cmp-ours">{row.ours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <p className="cmp-note">Fees compared as of April 2026. FlightComp never charges additional legal action fees.</p>
          </section>

          {/* ── CTA ── */}
          <section className="hiw-cta-section">
            <p className="hiw-cta-label">Check your eligibility now — it&apos;s free and takes 2 minutes.</p>
            <Link href="/" className="about-cta-btn">Check Your Flight →</Link>
          </section>

          {/* ── Footer ── */}
          <footer className="about-footer">
            <div className="lp-footer-links">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <a href="mailto:support@getflightcomp.com">Contact</a>
            </div>
            <div className="lp-footer-copy">© 2026 Noontide Ventures LLC · FlightComp</div>
          </footer>
        </div>
      </div>
    </>
  );
}

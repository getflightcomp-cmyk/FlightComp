import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About | FlightComp</title>
        <meta name="description" content="FlightComp was built by Ethan — traveler, MBA, former BCG consultant — because passengers deserve better tools and fairer fees." />
      </Head>
      <div className="about-pg">
        <div className="about-inner">
          <Link href="/" className="legal-back">← Back to Home</Link>

          {/* ── Header ── */}
          <section className="about-header">
            <h1 className="about-h1">Built by a traveler, for travelers</h1>
            <div className="about-founder-row">
              <img
                src="/images/ethan.jpg"
                alt="Ethan, founder of FlightComp"
                className="about-photo"
              />
              <span className="about-founder-name">Call me Ethan.</span>
            </div>
          </section>

          {/* ── Story ── */}
          <section className="about-story">
            <p>
              I&apos;ve been to 85+ countries. Along the way, I&apos;ve had plenty of cancelled flights, long delays,
              and missed connections — the kind of disruptions that derail a trip. Most of the time, I just absorbed
              the cost and moved on.
            </p>
            <p>
              It never occurred to me that airlines legally owed me money.
            </p>
            <p>
              When I finally looked into it, I found that EU Regulation 261/2004 entitles passengers to up to €600
              for disrupted flights — and similar laws exist in the UK, Canada, and Turkey. The rules are clear.
              The amounts are specific. But airlines don&apos;t advertise what you&apos;re owed, and the claims
              process is designed to make you give up.
            </p>
            <p>
              The companies that exist to help? They take 35–50% of your compensation. For what&apos;s often a
              straightforward letter, that&apos;s a lot.
            </p>
            <p>
              So I built FlightComp. Check your eligibility for free. If you&apos;re owed money, we&apos;ll handle
              the entire claim for you — at the lowest fee in the market, and if we don&apos;t win, you don&apos;t
              pay. Prefer to do it yourself? We offer a DIY Claims Kit with everything you need.
            </p>
          </section>

          {/* ── Credentials ── */}
          <aside className="about-credentials">
            <p>
              Ethan holds an MBA from Yale School of Management and previously worked at Boston Consulting Group,
              the International Monetary Fund, and the U.S. Bureau of Labor Statistics.
            </p>
          </aside>

          {/* ── Principles ── */}
          <section className="about-values-section">
            <h2 className="about-values-heading">Our Core Principles</h2>
            <div className="about-values">
              <div className="about-value">
                <div className="about-value-icon" style={{ color: '#22C55E' }}>🔍</div>
                <div>
                  <div className="about-value-head">Transparency</div>
                  <div className="about-value-body">We show you our fees upfront. No hidden costs, no surprises.</div>
                </div>
              </div>
              <div className="about-value">
                <div className="about-value-icon" style={{ color: '#3B82F6' }}>⚖</div>
                <div>
                  <div className="about-value-head">Fairness</div>
                  <div className="about-value-body">If we don&apos;t win, you don&apos;t pay. Our fee is the lowest managed service fee in the market.</div>
                </div>
              </div>
              <div className="about-value">
                <div className="about-value-icon" style={{ color: '#F59E0B' }}>§</div>
                <div>
                  <div className="about-value-head">Expertise</div>
                  <div className="about-value-body">Every claim letter cites the specific regulation and legal provisions that apply to your case.</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="about-cta-section">
            <p className="about-cta-label">Ready to check if you&apos;re owed compensation?</p>
            <Link href="/" className="about-cta-btn">Check Your Flight →</Link>
          </section>

          {/* ── Footer ── */}
          <footer className="about-footer">
            <div className="lp-footer-links">
              <Link href="/">Home</Link>
              <Link href="/how-it-works">How It Works</Link>
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

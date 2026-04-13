import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About | FlightComp</title>
        <meta name="description" content="FlightComp was built by Ethan Bernstein — traveler, MBA, former BCG consultant — because passengers deserve better tools and fairer fees." />
      </Head>
      <div className="about-pg">
        <div className="about-inner">
          <Link href="/" className="legal-back">← Back to Home</Link>

          {/* ── Header ── */}
          <section className="about-header">
            <h1 className="about-h1">Built by a traveler, not a corporation</h1>
            <div className="about-founder">
              {/* TODO: Replace placeholder with actual founder photo — upload to /public/images/ethan.jpg */}
              <div className="about-photo-placeholder">Photo</div>
              <div className="about-founder-info">
                <div className="about-name">Ethan</div>
                <div className="about-role">Founder, FlightComp</div>
              </div>
            </div>
          </section>

          {/* ── Story ── */}
          <section className="about-story">
            <p>
              I&apos;ve been to 85+ countries. Over the years I&apos;ve had my share of cancelled flights, multi-hour
              delays, and missed connections — the kind of disruptions that throw off an entire trip. Most of the
              time, I absorbed the loss and moved on. It didn&apos;t occur to me that I was often legally owed money.
            </p>
            <p>
              When I finally looked into it, I discovered that EU Regulation 261/2004 entitles passengers to up to
              €600 in compensation for disrupted flights — and similar laws exist in the UK, Canada, and Turkey. The
              regulations are clear. The amounts are specific. But airlines don&apos;t exactly put up signs advertising
              what you&apos;re owed, and the claims process is intentionally opaque. They count on passengers not knowing
              their rights.
            </p>
            <p>
              The existing claims companies will handle it for you — but they charge 35–50% of whatever they recover.
              For what is often a straightforward letter-writing process, that felt excessive. So I built FlightComp:
              a tool that checks your eligibility for free and helps you claim what you&apos;re owed — either with a $19
              DIY Claims Kit you send yourself, or through our managed service at 25%, the lowest fee in the market.
            </p>
            <p>
              My background: MBA from Yale School of Management, former management consultant at Boston Consulting
              Group, prior roles at the International Monetary Fund and the U.S. Bureau of Labor Statistics. I built
              FlightComp because I believe passengers deserve better tools and fairer fees — not because there&apos;s a
              shortage of claims companies, but because the existing ones are too expensive and too opaque.
            </p>
          </section>

          {/* ── Values ── */}
          <section className="about-values">
            <div className="about-value">
              <div className="about-value-icon">◈</div>
              <div>
                <div className="about-value-head">Transparency</div>
                <div className="about-value-body">We show you our fees upfront. No hidden costs, no surprises.</div>
              </div>
            </div>
            <div className="about-value">
              <div className="about-value-icon">⚖</div>
              <div>
                <div className="about-value-head">Fairness</div>
                <div className="about-value-body">25% is the lowest managed service fee in the market. If we don&apos;t win, you don&apos;t pay.</div>
              </div>
            </div>
            <div className="about-value">
              <div className="about-value-icon">§</div>
              <div>
                <div className="about-value-head">Expertise</div>
                <div className="about-value-body">Every claim letter cites the specific regulation and legal provisions that apply to your case.</div>
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

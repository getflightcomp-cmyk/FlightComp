import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | FlightComp</title>
        <meta name="description" content="FlightComp Privacy Policy — how we collect, use, and protect your data." />
      </Head>
      <div className="legal-pg">
        <div className="legal-inner">
          <Link href="/" className="legal-back">← Back to Home</Link>

          <h1 className="legal-h1">Privacy Policy</h1>
          <p className="legal-date">Last updated: March 31, 2026</p>

          <section className="legal-section">
            <h2>1. Who We Are</h2>
            <p>FlightComp operates <a href="https://getflightcomp.com">getflightcomp.com</a>. For privacy inquiries, contact us at <a href="mailto:privacy@getflightcomp.com">privacy@getflightcomp.com</a>.</p>
          </section>

          <section className="legal-section">
            <h2>2. What Data We Collect</h2>
            <p><em>Data you provide directly:</em></p>
            <ul>
              <li>Flight details (airline, flight number, route, dates, disruption type)</li>
              <li>Personal details for claim letters (name, address, booking reference)</li>
              <li>Email address (if you opt in to claim tracking)</li>
              <li>Payment information (processed by Stripe — we never see or store your full card number)</li>
            </ul>
            <p><em>Data collected automatically:</em></p>
            <ul>
              <li>Basic analytics via Google Analytics (page views, device type, referral source)</li>
              <li>No cookies are used for advertising or tracking beyond analytics</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Data</h2>
            <ul>
              <li>To determine your eligibility under EU261/UK261</li>
              <li>To generate your personalized claim letter</li>
              <li>To process your payment via Stripe</li>
              <li>To send you claim tracking updates (only if you provide your email)</li>
              <li>To improve the service (aggregated, anonymized usage data)</li>
            </ul>
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section className="legal-section">
            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>If you are in the European Economic Area or United Kingdom, our legal bases for processing your data are:</p>
            <ul>
              <li><strong>Contract performance:</strong> We need your flight and personal details to generate your claim letter and provide the service you paid for.</li>
              <li><strong>Legitimate interest:</strong> We use anonymized analytics to improve the service.</li>
              <li><strong>Consent:</strong> We only send you emails if you opt in.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Data Retention</h2>
            <ul>
              <li><strong>Eligibility checker inputs:</strong> Processed transiently and not retained after your session, except as necessary to generate your requested output. Data may be transmitted to our AI provider (Anthropic) for letter generation; Anthropic processes this data per their privacy policy and does not retain it for training.</li>
              <li><strong>Claim letter details:</strong> Retained for 12 months to support any follow-up, then deleted.</li>
              <li><strong>Email addresses:</strong> Retained until you unsubscribe.</li>
              <li><strong>Payment records:</strong> Retained as required by tax and financial regulations.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Your Rights (GDPR)</h2>
            <p>If you are in the EEA or UK, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data ("right to be forgotten")</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise any of these rights, email <a href="mailto:privacy@getflightcomp.com">privacy@getflightcomp.com</a>. We will respond within 30 days.</p>
          </section>

          <section className="legal-section">
            <h2>7. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li>Stripe — payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>)</li>
              <li>Google Analytics — anonymized usage analytics (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>)</li>
              <li>Vercel — hosting (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>)</li>
              <li>Anthropic — AI-powered letter generation (<a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a>)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Data Transfers</h2>
            <p>Your data may be processed in the United States. We rely on standard contractual clauses and the data protection practices of our service providers to ensure adequate protection.</p>
          </section>

          <section className="legal-section">
            <h2>9. Children</h2>
            <p>FlightComp is not intended for use by anyone under 18.</p>
          </section>

          <section className="legal-section">
            <h2>10. Changes</h2>
            <p>We may update this policy. Changes will be posted on this page with an updated date.</p>
          </section>

          <section className="legal-section">
            <h2>11. Contact</h2>
            <p>For any privacy-related questions: <a href="mailto:privacy@getflightcomp.com">privacy@getflightcomp.com</a>.</p>
          </section>
        </div>
      </div>
    </>
  );
}

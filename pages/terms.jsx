import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | FlightComp</title>
        <meta name="description" content="FlightComp Terms of Service — EU261/UK261 flight compensation tool." />
      </Head>
      <div className="legal-pg">
        <div className="legal-inner">
          <Link href="/" className="legal-back">← Back to Home</Link>

          <h1 className="legal-h1">Terms of Service</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>FlightComp is a service operated by Noontide Ventures LLC, a Georgia limited liability company.</p>
          <p className="legal-date">Last updated: April 6, 2026</p>

          <section className="legal-section">
            <h2>1. What FlightComp Is</h2>
            <p>FlightComp provides a flight compensation eligibility checker and claim letter generation service. We help you understand your rights under EU Regulation 261/2004 and UK Regulation 261. We are not a law firm. We do not provide legal advice. The information and documents we provide are for informational and self-service purposes only.</p>
          </section>

          <section className="legal-section">
            <h2>2. Eligibility Checker</h2>
            <p>The eligibility checker is free and requires no account. It provides an estimate of whether your flight disruption may qualify for compensation based on the information you provide. Results are not a guarantee of eligibility or payout. Actual eligibility depends on factors we cannot verify, including the airline's stated reason for the disruption.</p>
          </section>

          <section className="legal-section">
            <h2>3. Claim Letter Generation</h2>
            <p>For a flat fee of $19 USD, FlightComp generates a personalized claim letter you can send to your airline. Payment is processed securely via Stripe. The letter is a template populated with your flight and personal details — it is not legal counsel. You are responsible for submitting the letter to your airline and for any subsequent correspondence.</p>
          </section>

          <section className="legal-section">
            <h2>4. Managed Claim Service (Coming Soon)</h2>
            <p>FlightComp will offer a managed claims service on a no-win, no-fee basis. If we do not recover compensation on your behalf, you owe nothing. If we do, our fee is 29% of the compensation recovered — all-in, with no hidden fees or legal surcharges. Full terms for this service will be published before it launches.</p>
          </section>

          <section className="legal-section">
            <h2>5. No Guarantees</h2>
            <p>We do not guarantee that any airline will accept your claim, respond within any timeframe, or pay compensation. EU261/UK261 eligibility depends on the specific circumstances of each disruption, and airlines may dispute claims. FlightComp provides tools and information only — we do not represent you, negotiate on your behalf, or act as your agent. Any decision to submit a claim to an airline is yours alone. Airlines and national aviation authorities may interpret regulations differently than our service.</p>
          </section>

          <section className="legal-section">
            <h2>6. Disclaimer of Warranties</h2>
            <p>The service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We make no representations or warranties regarding the accuracy, completeness, or applicability of any information provided by the eligibility checker or any generated documents, including claim letters.</p>
          </section>

          <section className="legal-section">
            <h2>7. Your Responsibilities</h2>
            <p>You agree to provide accurate information about your flight disruption. If you provide false or misleading information, any claim letter generated may be ineffective, and FlightComp is not responsible for the outcome.</p>
          </section>

          <section className="legal-section">
            <h2>8. Refund Policy</h2>
            <p>Because the claim letter is delivered digitally and immediately upon payment, refunds are not available once the letter has been generated and downloaded. If there is a technical error preventing delivery, contact us at <a href="mailto:support@getflightcomp.com">support@getflightcomp.com</a>.</p>
          </section>

          <section className="legal-section">
            <h2>9. Intellectual Property</h2>
            <p>All content on <a href="https://getflightcomp.com">getflightcomp.com</a> — including text, design, code, and branding — is owned by FlightComp. You may not copy, reproduce, or redistribute it without permission.</p>
          </section>

          <section className="legal-section">
            <h2>10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, FlightComp, Noontide Ventures LLC, and their operators, affiliates, and contractors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of compensation, loss of revenue, or loss of data, arising from your use of the service. FlightComp's total aggregate liability to you for all claims arising out of or relating to the service is limited to the amount you paid to FlightComp in the 12 months preceding the claim.</p>
          </section>

          <section className="legal-section">
            <h2>11. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless FlightComp, Noontide Ventures LLC, and their operators from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your use of the service, your submission of a claim to an airline, any inaccurate information you provide, or your violation of these terms.</p>
          </section>

          <section className="legal-section">
            <h2>12. Dispute Resolution</h2>
            <p>Any dispute arising from these terms or your use of FlightComp shall first be resolved through informal negotiation. If unresolved within 30 days, the dispute shall be settled by binding arbitration administered under the rules of the American Arbitration Association, conducted in the State of Georgia. You agree to waive any right to a jury trial or to participate in a class action.</p>
          </section>

          <section className="legal-section">
            <h2>13. Changes to These Terms</h2>
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section className="legal-section">
            <h2>14. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Georgia, United States. Disputes will be resolved in accordance with Section 12.</p>
          </section>

          <section className="legal-section">
            <h2>15. Contact</h2>
            <p>Questions about these terms? Email <a href="mailto:support@getflightcomp.com">support@getflightcomp.com</a>.</p>
          </section>
        </div>
      </div>
    </>
  );
}

import Head from 'next/head';
import IndexPage from './index';

/**
 * /check — Google Ads landing page for the eligibility checker.
 * Renders the full homepage/checker experience. All GA4 events fire
 * from the IndexPage component exactly as they do on the homepage.
 */
export default function CheckPage() {
  return (
    <>
      <IndexPage />
      {/* Override head tags — rendered after IndexPage so next/head deduplicates correctly */}
      <Head>
        <title>Check Flight Compensation Eligibility | FlightComp</title>
        <meta
          name="description"
          content="Check if your delayed or cancelled flight may qualify for compensation under EU261, UK261, Canada APPR, or Turkey SHY."
        />
        <link rel="canonical" key="canonical" href="https://www.getflightcomp.com/check" />
      </Head>
    </>
  );
}

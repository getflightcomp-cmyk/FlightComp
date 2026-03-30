import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <script defer data-domain="flight-comp.vercel.app" src="https://plausible.io/js/script.js" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

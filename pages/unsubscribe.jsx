import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Unsubscribe() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading | success | error | invalid

  useEffect(() => {
    if (!router.isReady) return;

    const { token } = router.query;
    if (!token) {
      setStatus('invalid');
      return;
    }

    fetch('/api/unsubscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
      .then(async r => {
        if (r.ok) {
          setStatus('success');
        } else {
          const j = await r.json().catch(() => ({}));
          setStatus(j.error === 'Token not found' ? 'invalid' : 'error');
        }
      })
      .catch(() => setStatus('error'));
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>Unsubscribe · FlightComp</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: 'var(--surf)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          {status === 'loading' && (
            <>
              <p style={{ fontSize: 32, margin: '0 0 16px' }}>⏳</p>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                Processing…
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
                Please wait a moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <p style={{ fontSize: 40, margin: '0 0 16px' }}>✓</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
                You've been unsubscribed
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
                You won't receive any more reminder emails from FlightComp.
                You can still check your eligibility and purchase a compensation kit any time.
              </p>
              <a href="/" style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: 'var(--blue)',
                color: '#fff',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}>
                Back to FlightComp
              </a>
            </>
          )}

          {status === 'invalid' && (
            <>
              <p style={{ fontSize: 40, margin: '0 0 16px' }}>🔗</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
                Link not recognised
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
                This unsubscribe link may have already been used or may be invalid.
                If you're still receiving emails, contact us at{' '}
                <a href="mailto:support@getflightcomp.com" style={{ color: 'var(--blue)' }}>
                  support@getflightcomp.com
                </a>.
              </p>
              <a href="/" style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: 'var(--surf2)',
                color: 'var(--text)',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--border)',
              }}>
                Back to FlightComp
              </a>
            </>
          )}

          {status === 'error' && (
            <>
              <p style={{ fontSize: 40, margin: '0 0 16px' }}>⚠️</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
                Something went wrong
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
                We couldn't process your unsubscribe request. Please try again or email{' '}
                <a href="mailto:support@getflightcomp.com" style={{ color: 'var(--blue)' }}>
                  support@getflightcomp.com
                </a>{' '}
                and we'll remove you manually.
              </p>
              <a href="/" style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: 'var(--surf2)',
                color: 'var(--text)',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--border)',
              }}>
                Back to FlightComp
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Thin wrapper around window.gtag for GA4 custom events.
 * Includes debug_mode: true so events appear in GA4 DebugView in real time.
 * Safe to call on server render — no-ops if gtag is not available.
 */
export function trackEvent(eventName, params) {
  if (typeof window === 'undefined') return;

  const payload = { ...(params ?? {}), debug_mode: true };

  // eslint-disable-next-line no-console
  console.log(
    '[GA4] trackEvent →', eventName,
    '| params:', payload,
    '| typeof window.gtag:', typeof window.gtag,
  );

  if (typeof window.gtag !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('[GA4] ⚠️ window.gtag is not a function — event was NOT sent to GA4');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[GA4] → calling window.gtag("event", "' + eventName + '", { debug_mode: true, ... })');
  window.gtag('event', eventName, payload);
}

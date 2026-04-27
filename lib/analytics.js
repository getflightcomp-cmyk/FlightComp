/**
 * Thin wrapper around window.gtag for GA4 custom events.
 * Safe to call on server render — no-ops if gtag is not available.
 */
export function trackEvent(eventName, params) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params ?? {});
  }
}

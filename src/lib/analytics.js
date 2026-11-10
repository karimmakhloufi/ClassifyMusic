// Umami Cloud custom events (script loaded in index.html).
// Never throws: if Umami is blocked (ad blocker), not loaded yet, or we're on
// localhost (the script only records on the production domain), this is a no-op.

export function track(event, data) {
  try {
    window.umami?.track(event, data);
  } catch {
    /* analytics must never break the game */
  }
}

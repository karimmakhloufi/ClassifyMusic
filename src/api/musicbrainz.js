// MusicBrainz recording search. Called directly from the browser (MusicBrainz sends
// CORS headers), so each player uses their own per-IP rate limit.
// Used to find a song's ORIGINAL release year: Deezer usually returns the date of
// whatever compilation/remaster it streams (e.g. "Billie Jean" -> 2009).
//
// MusicBrainz allows ~1 request per second, so all calls go through a serial queue.

import { normalize, normTitle, baseTitle } from '../lib/text.js';

const BASE = 'https://musicbrainz.org/ws/2';
const MIN_GAP_MS = 1250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let queue = Promise.resolve();
let lastCall = 0;

function throttled(fn) {
  const run = queue.then(async () => {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

async function searchRecordings(query) {
  const url = `${BASE}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=100`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await throttled(() => fetch(url, { headers: { Accept: 'application/json' } }));
    if (res.ok) return (await res.json()).recordings ?? [];
    if (res.status !== 503 && res.status !== 429) throw new Error(`MusicBrainz HTTP ${res.status}`);
    await sleep(1000 * (attempt + 1)); // rate-limited: back off and retry
  }
  throw new Error('MusicBrainz is unavailable');
}

const lucenePhrase = (s) => `"${s.replace(/["\\]/g, '\\$&')}"`;
const NOT_ORIGINAL = /live|demo|remix|instrumental|acoustic|karaoke|cover/i;

function matches(rec, wantTitle, wantArtist) {
  if (rec.video || NOT_ORIGINAL.test(rec.disambiguation ?? '')) return false;
  if (normTitle(rec.title) !== wantTitle) return false;
  const credits = rec['artist-credit'] ?? [];
  const joined = normalize(credits.map((c) => c.name + (c.joinphrase ?? '')).join(''));
  return credits.some((c) => normalize(c.name) === wantArtist) || joined.startsWith(wantArtist);
}

function parseYear(date) {
  const y = parseInt(String(date ?? '').slice(0, 4), 10);
  return y >= 1900 ? y : null;
}

/**
 * Earliest first-release year of any official recording matching artist + title,
 * or null if nothing matched. Throws if MusicBrainz can't be reached.
 */
export async function firstReleaseYear(artist, title) {
  const wantTitle = normTitle(title);
  const wantArtist = normalize(artist);
  const base = `recording:${lucenePhrase(baseTitle(title))} AND artist:${lucenePhrase(artist)} AND status:official`;

  // Album releases first: restricting to them pushes the original studio recording
  // into the result window instead of dozens of singles/promos.
  for (const query of [`${base} AND primarytype:album`, base]) {
    const years = (await searchRecordings(query))
      .filter((rec) => matches(rec, wantTitle, wantArtist))
      .map((rec) => parseYear(rec['first-release-date']))
      .filter(Boolean);
    if (years.length) return Math.min(...years);
  }
  return null;
}

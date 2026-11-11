import { firstReleaseYear } from '../api/musicbrainz.js';

// Bump the version whenever the date logic changes, so players' browsers drop
// years computed by the old logic (v1 had live recordings excluded).
const CACHE_KEY = 'tt:years:v2';

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {};
  } catch {
    return {};
  }
}
const cache = loadCache();
function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full or blocked: caching is optional */
  }
}

function parseYear(date) {
  const y = parseInt(String(date ?? '').slice(0, 4), 10);
  return y >= 1900 ? y : null;
}

/**
 * Best guess at a track's original release year.
 *
 * Deezer's dates are only ever too LATE (reissues, compilations), never too early,
 * so we take the earliest of Deezer's track date, album date and MusicBrainz's
 * first-release date. If the track came from a decade playlist and the year lands
 * outside that decade, the data is unreliable and the song is skipped (null).
 *
 * @param track  full Deezer track object (from /track/:id)
 * @param decade {from, to} or null for custom playlists
 * @returns {{year:number, source:'musicbrainz'|'deezer'} | null}
 */
export async function findReleaseYear(track, decade) {
  let mbYear;
  if (track.id in cache) {
    mbYear = cache[track.id];
  } else {
    try {
      mbYear = await firstReleaseYear(track.artist.name, track.title);
      cache[track.id] = mbYear;
      saveCache();
    } catch (err) {
      // Plenty of songs to choose from: skip rather than trust a possible reissue date.
      console.warn('MusicBrainz lookup failed', err);
      return null;
    }
  }

  // Mixed-era playlists have no decade to sanity-check Deezer's date against,
  // so they need a MusicBrainz match.
  if (!decade && mbYear == null) return null;

  const candidates = [parseYear(track.release_date), parseYear(track.album?.release_date), mbYear].filter(Boolean);
  if (!candidates.length) return null;
  const year = Math.min(...candidates);

  if (decade && (year < decade.from - 1 || year > decade.to + 1)) return null;
  return { year, source: year === mbYear ? 'musicbrainz' : 'deezer' };
}

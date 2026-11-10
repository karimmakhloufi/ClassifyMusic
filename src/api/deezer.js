// Thin wrapper around the Deezer public API (proxied through Vite at /deezer).

const BASE = '/deezer';
const QUOTA_ERROR = 4; // Deezer: "Quota limit exceeded" (50 requests / 5 s)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, params = {}, attempt = 0) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/${path}${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Échec de la requête Deezer (HTTP ${res.status})`);
  const data = await res.json();
  if (data.error) {
    if (data.error.code === QUOTA_ERROR && attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return get(path, params, attempt + 1);
    }
    throw new Error(data.error.message || 'Erreur Deezer');
  }
  return data;
}

/** Tracks of a playlist. Note: these list entries have no release_date. */
export function getPlaylistTracks(playlistId) {
  // Cached for the session: big playlists are several MB and don't change mid-game.
  if (!playlistCache.has(playlistId)) {
    const tracks = fetchAllTracks(playlistId);
    tracks.catch(() => playlistCache.delete(playlistId)); // retry on the next game
    playlistCache.set(playlistId, tracks);
  }
  return playlistCache.get(playlistId);
}

const PAGE_SIZE = 500;
const playlistCache = new Map();

async function fetchAllTracks(playlistId) {
  const path = `playlist/${playlistId}/tracks`;
  const first = await get(path, { limit: PAGE_SIZE, index: 0 });
  const total = first.total ?? first.data?.length ?? 0;
  // Remaining pages in parallel (a 2000-track playlist: 4 requests of ~1 s instead of one of ~6 s).
  const rest = [];
  for (let index = PAGE_SIZE; index < total; index += PAGE_SIZE) {
    rest.push(get(path, { limit: PAGE_SIZE, index }));
  }
  const pages = await Promise.all(rest);
  return [first, ...pages].flatMap((page) => page.data ?? []);
}

/** Full track: includes release_date, album (with release_date + covers) and a fresh preview URL. */
export function getTrack(trackId) {
  return get(`track/${trackId}`);
}

/**
 * Plain-text track search. (Deezer's advanced syntax, artist:"…" track:"…",
 * returns nothing through the public API, so this is a simple "artist title" query.)
 */
export async function searchTracks(query, limit = 15) {
  const res = await get('search', { q: query, limit });
  return res.data ?? [];
}

// Thin wrapper around the Deezer public API (proxied through Vite at /deezer).

const BASE = '/deezer';
const QUOTA_ERROR = 4; // Deezer: "Quota limit exceeded" (50 requests / 5 s)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, params = {}, attempt = 0) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/${path}${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Deezer request failed (HTTP ${res.status})`);
  const data = await res.json();
  if (data.error) {
    if (data.error.code === QUOTA_ERROR && attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return get(path, params, attempt + 1);
    }
    throw new Error(data.error.message || 'Deezer error');
  }
  return data;
}

/** Tracks of a playlist. Note: these list entries have no release_date. */
export async function getPlaylistTracks(playlistId, limit = 100) {
  const res = await get(`playlist/${playlistId}/tracks`, { limit });
  return res.data ?? [];
}

/** Full track: includes release_date, album (with release_date + covers) and a fresh preview URL. */
export function getTrack(trackId) {
  return get(`track/${trackId}`);
}

// Finds a playable copy of a dead playlist track.
//
// Many playlist entries point at track IDs Deezer has withdrawn: labels re-upload their
// catalogs under new IDs, and old playlists keep the dead ones (readable: false,
// available in 0 countries). The song itself is usually still on Deezer under a new ID.

import { searchTracks } from '../api/deezer.js';
import { baseTitle, normalize, normTitle } from './text.js';

// Versions that aren't the song players know.
const NOT_ORIGINAL = /remix|live|acoustic|instrumental|karaoke|cover|re-?recorded|sped up|slowed/i;

/**
 * A playable Deezer track (search result) with the same artist and title, or null.
 * Preference: identical title > plain title (no "(…)" tags) > same base title.
 */
export async function findReplacement(artist, title) {
  const results = await searchTracks(`${artist} ${baseTitle(title)}`);
  const wantArtist = normalize(artist);
  const wantTitle = normTitle(title);
  const exact = title.trim().toLowerCase();

  const candidates = results.filter(
    (t) =>
      t.readable !== false &&
      t.preview &&
      normalize(t.artist?.name) === wantArtist &&
      normTitle(t.title) === wantTitle &&
      // Keep a remix only if the playlist asked for that exact remix.
      (!NOT_ORIGINAL.test(t.title) || t.title.trim().toLowerCase() === exact),
  );
  const rank = (t) => {
    if (t.title.trim().toLowerCase() === exact) return 0;
    if (t.title.trim() === baseTitle(t.title)) return 1;
    return 2;
  };
  candidates.sort((a, b) => rank(a) - rank(b)); // stable: keeps Deezer's relevance order within a rank
  return candidates[0] ?? null;
}

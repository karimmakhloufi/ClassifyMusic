// Category lookup for a song, from the data built by scripts/build-categories.mjs.
// Kept apart from categories.js so the build script can import the definitions
// without depending on the file it generates.
import data from '../data/categories.json';
import { normalize, normTitle } from './text.js';

/** Category keys of a song: its own override if any, otherwise its artist's. */
export function songCategories(artist, title) {
  const a = normalize(artist);
  return data.songs[`${a}|${normTitle(title)}`] ?? data.artists[a] ?? [];
}

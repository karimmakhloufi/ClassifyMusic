// Music categories. Artists are classified offline from their Last.fm tags
// (scripts/build-categories.mjs -> src/data/categories.json).
// Two independent axes: style (an artist can have several) and origin.

export const STYLES = [
  { key: 'rock', label: 'Rock' },
  { key: 'pop', label: 'Pop' },
  { key: 'rap', label: 'Rap / Hip-hop' },
  { key: 'electro', label: 'Électro / Dance' },
  { key: 'soul', label: 'Soul / Funk / R&B' },
  { key: 'world', label: 'Reggae / Afro / Latino' },
  { key: 'chanson', label: 'Chanson française' },
  { key: 'folk', label: 'Folk / Country' },
  { key: 'jazz', label: 'Jazz / Blues / Swing' },
  { key: 'classical', label: 'Classique / Films' },
];

export const ORIGINS = [
  { key: 'all', label: 'Toutes' },
  { key: 'fr', label: 'Francophone' },
  { key: 'intl', label: 'Internationale' },
];

/** Every category key that can appear in categories.json. */
export const CATEGORIES = [...STYLES, { key: 'fr', label: 'Francophone' }];

/** @typedef {{styles: string[], origin: 'all'|'fr'|'intl'}} Selection  (no styles = all styles) */
export const DEFAULT_SELECTION = { styles: [], origin: 'all' };

export const isDefaultSelection = (sel) => !sel.styles.length && sel.origin === 'all';

/** Stable id of a selection, e.g. "all", "rap+rock", "rap/fr". */
export function selectionKey(sel) {
  const styles = [...sel.styles].sort().join('+') || 'all';
  return sel.origin === 'all' ? styles : `${styles}/${sel.origin}`;
}

/** Does a song with these categories belong to the selection? */
export function matchesSelection(cats, sel) {
  if (sel.styles.length && !sel.styles.some((s) => cats.includes(s))) return false;
  if (sel.origin !== 'all' && cats.includes('fr') !== (sel.origin === 'fr')) return false;
  return true;
}

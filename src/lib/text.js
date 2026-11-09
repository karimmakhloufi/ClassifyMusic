// Title/artist normalisation shared by the matching and display code.

/** Lowercase, strip accents and punctuation; keeps letters/digits from any script. */
export function normalize(s) {
  const out = String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^\p{L}\p{N}]/gu, '');
  return out || String(s ?? '').toLowerCase();
}

/** Title without any "(...)", "[...]" or " - suffix" parts. */
export function baseTitle(title) {
  const t = String(title)
    .replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();
  return t || String(title);
}

export const normTitle = (title) => normalize(baseTitle(title));

// Tags that would give the year away (or mislead), e.g. "(2005 Remaster)",
// '(From "Footloose" Soundtrack)'.
const DATE_TAG = /remaster|anniversary|deluxe|mono|stereo|soundtrack|^\W*from\s|\b(19|20)\d{2}\b/i;

/** Title for display: drops remaster/year tags but keeps "(feat. X)", "(Radio Edit)" etc. */
export function displayTitle(title) {
  return String(title)
    .replace(/\s*[([][^)\]]*[)\]]/g, (m) => (DATE_TAG.test(m) ? '' : m))
    .replace(/\s+-\s+([^-]*)$/, (m, tail) => (DATE_TAG.test(tail) ? '' : m))
    .trim();
}

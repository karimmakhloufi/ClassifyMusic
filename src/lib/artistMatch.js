// Tolerant comparison of a typed artist name with the real one (solo blind test).
//
// Accepted as equal:
//  - case, accents, punctuation and spaces:   "ac dc" = "AC/DC", "beyonce" = "Beyoncé"
//  - "&", "+", "and", "et":                    "Simon and Garfunkel" = "Simon & Garfunkel"
//  - a leading article on either side:         "Rolling Stones" = "The Rolling Stones"
//  - typos, depending on length (see maxTypos): "Rolling Stnoes", "Micheal Jackson"
//  - the lead artist of a combined name:       "Bob Marley" for "Bob Marley & The Wailers"
//  - the name without its first word (first name): "Brel" for "Jacques Brel",
//    "De Palmas" for "Gérald de Palmas". Applied to bands too, which can't be told
//    apart from people here ("Punk" counts for "Daft Punk").

const ARTICLES = new Set(['the', 'les', 'le', 'la', 'l', 'los', 'las', 'el', 'die', 'der', 'das', 'il', 'lo']);
// Separators between several artists in one name. Commas are NOT separators
// ("Earth, Wind & Fire" is one name).
const SEPARATORS = /\s+(?:and|feat|featuring|ft|with|vs|x)\s+/;
const MIN_PART_LENGTH = 5; // a part of a combined name must be at least this long to count alone
const MIN_SURNAME_LENGTH = 3; // "Jay Z" can't be guessed as "Z"
const MAX_NAME_WORDS = 4; // longer names are titles of bands, not first name + surname

/** Lowercase words without accents/punctuation; "&", "+" and "et" become "and". */
function words(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[&+]/g, ' and ')
    // Hyphenated words are one word: "Jean-Jacques Goldman" has a single first name.
    // (Harmless for matching itself, which compares names without spaces.)
    .replace(/(?<=[\p{L}\p{N}])-(?=[\p{L}\p{N}])/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\bet\b/g, 'and')
    .trim();
}

const compact = (w) => w.replace(/\s+/g, '');

/** The forms a name can be written in: as is, and without its leading article. */
function variants(w) {
  const out = [compact(w)];
  const [first, ...rest] = w.split(' ');
  if (rest.length && ARTICLES.has(first)) out.push(compact(rest.join(' ')));
  return out.filter(Boolean);
}

/** Allowed typos for a name of this length (without spaces). */
function maxTypos(length) {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  if (length <= 10) return 2;
  return 3;
}

/** Edit distance where swapping two adjacent letters counts as one typo. */
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** "gerald de palmas" -> "de palmas"; null when that doesn't leave a plausible surname. */
function withoutFirstName(w) {
  const [first, ...rest] = w.split(' ');
  if (!rest.length || rest.length >= MAX_NAME_WORDS || ARTICLES.has(first)) return null;
  if (rest[0] === 'and') return null; // "kool and the gang"
  const surname = rest.join(' ');
  return compact(surname).length >= MIN_SURNAME_LENGTH ? surname : null;
}

/** Is `guess` close enough to `artist`? */
export function artistMatches(guess, artist) {
  const g = words(guess);
  const a = words(artist);
  if (!g || !a) return false;

  // The full name, plus each part of a combined name ("bob marley", "the wailers").
  const parts = [a, ...a.split(SEPARATORS).filter((p) => p !== a && compact(p).length >= MIN_PART_LENGTH)];
  // ...and each of them without its first word: "jacques brel" -> "brel".
  const targets = [...parts, ...parts.map(withoutFirstName).filter(Boolean)];

  const guesses = variants(g);
  return targets.some((t) =>
    variants(t).some((tv) => guesses.some((gv) => distance(gv, tv) <= maxTypos(tv.length))),
  );
}

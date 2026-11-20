// Classifies every artist of the game's playlists into music categories, from their
// Last.fm tags (track-level tags are almost always empty on Last.fm, artist tags are not).
//
// Usage: node scripts/build-categories.mjs [--refresh]
//   Needs LASTFM_API_KEY in .env.local.
//   Raw tags are cached in scripts/lastfm-artist-tags.json: reruns only query new
//   artists (--refresh re-queries everyone), and tweaking the mapping below needs no network.
//
// Writes src/data/categories.json: { artists: {normalizedName: [keys]}, songs: {"artist|title": [keys]} }.
// Manual fixes go in src/data/categoryOverrides.json (see the README).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DECADES, MIXED } from '../src/lib/sources.js';
import { CATEGORIES } from '../src/lib/categories.js';
import { normalize, normTitle } from '../src/lib/text.js';

const file = (p) => new URL(p, import.meta.url);
const TAGS_CACHE = file('./lastfm-artist-tags.json');
const OVERRIDES = file('../src/data/categoryOverrides.json');
const OUTPUT = file('../src/data/categories.json');

// --- Tag -> category mapping (tags are lowercased, accents stripped, "-"/"_" -> space) ---

const STYLE_TAGS = {
  rock: [
    'rock', 'classic rock', 'hard rock', 'soft rock', 'alternative rock', 'alternative', 'indie rock',
    'punk', 'punk rock', 'pop punk', 'grunge', 'metal', 'heavy metal', 'nu metal', 'alternative metal',
    'britpop', 'new wave', 'post punk', 'blues rock', 'folk rock', 'glam rock', 'pop rock', 'rock and roll',
    'rock n roll', 'rockabilly', 'progressive rock', 'psychedelic rock', 'garage rock', 'arena rock',
    'piano rock', 'post grunge', 'southern rock', 'french rock', 'rock francais', 'aor', 'surf rock',
    'merseybeat', 'british invasion', 'beat', 'shoegaze', 'stoner rock', 'thrash metal', 'death metal',
    'rapcore', 'rock opera',
  ],
  pop: [
    'pop', 'dance pop', 'synthpop', 'synth pop', 'pop rock', 'teen pop', 'electropop', 'indie pop',
    'europop', 'french pop', 'pop francaise', 'k pop', 'power pop', 'yeye', 'ye ye', 'boy band',
    'girl group', 'dream pop', 'acoustic pop', 'french 80s',
  ],
  rap: [
    'hip hop', 'rap', 'french rap', 'rap francais', 'hip hop francais', 'trap', 'gangsta rap',
    'french hip hop', 'grime', 'drill', 'rappers', 'pop rap', 'conscious hip hop',
  ],
  electro: [
    'electronic', 'electro', 'electronica', 'house', 'french house', 'techno', 'trance', 'eurodance',
    'dance', 'edm', 'dubstep', 'drum and bass', 'big beat', 'electropop', 'synthwave', 'electro house',
    'progressive house', 'deep house', 'eurobeat', 'hi nrg', 'italo disco', 'trip hop', 'chillout',
    'downtempo', 'ambient', 'new age', 'lounge',
  ],
  chanson: [
    'chanson francaise', 'chanson', 'variete francaise', 'variete', 'varietes francaises',
    'nouvelle scene francaise', 'chanson a texte', 'chanson francais', 'comedie musicale francaise',
  ],
  folk: [
    'folk', 'country', 'classic country', 'singer songwriter', 'acoustic', 'indie folk', 'folk rock',
    'bluegrass', 'americana', 'freak folk', 'country pop',
  ],
  jazz: [
    'jazz', 'swing', 'vocal jazz', 'blues', 'easy listening', 'crooner', 'cool jazz', 'smooth jazz',
    'chicago blues', 'delta blues', 'big band', 'bebop', 'nu jazz', 'neo swing', 'oldies',
  ],
  classical: [
    'classical', 'soundtrack', 'soundtracks', 'opera', 'instrumental', 'score', 'orchestra',
    'symphonic', 'composer', 'composers', 'romantic', 'film score', 'disney', 'musical',
  ],
  soul: [
    'soul', 'funk', 'rnb', 'r and b', 'randb', 'contemporary r and b', 'neo soul', 'motown', 'disco',
    'northern soul', 'philly soul', 'rhythm and blues', 'urban', 'new jack swing', 'funk rock',
  ],
  world: [
    'reggae', 'dancehall', 'afrobeats', 'afrobeat', 'african', 'afropop', 'afro pop', 'rai', 'zouk',
    'latin', 'latin pop', 'reggaeton', 'salsa', 'world', 'world music', 'ska', 'kompa', 'coupe decale',
    'bossa nova', 'samba', 'flamenco', 'celtic', 'arabic',
  ],
};
// Last.fm tag counts are 0..100, relative to the artist's top tag. That top tag is often
// "french" or "female vocalists", so style thresholds are relative to the dominant STYLE:
// each style scores the sum of its tags, and every style reaching STYLE_RATIO of the best
// one is kept (GIMS: french 100, rap 36, hip-hop 11 -> rap 47 -> rap).
const STYLE_RATIO = 0.4;
const STYLE_FLOOR = 10;
// "french" is an origin tag, judged on its own (absolute) count.
const ORIGIN_MIN = 20;
const FRANCOPHONE_TAGS = [
  'french', 'chanson francaise', 'chanson', 'francais', 'francaise', 'french rap', 'rap francais',
  'french pop', 'variete francaise', 'quebec', 'quebecois', 'french rock', 'hip hop francais',
  'french hip hop', 'pop francaise', 'rock francais', 'chanson a texte', 'francophone',
  'nouvelle scene francaise', 'varietes francaises', 'french 80s', 'comedie musicale francaise',
];

const normTag = (t) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
    .replace(/[-_/]/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const tagIndex = new Map(); // tag -> [category]
for (const [cat, tags] of Object.entries(STYLE_TAGS)) {
  for (const t of new Set(tags)) tagIndex.set(t, [...(tagIndex.get(t) ?? []), cat]);
}
const francophoneSet = new Set(FRANCOPHONE_TAGS);

function categorize(tags) {
  const scores = {};
  let francophone = false;
  for (const { name, count } of tags) {
    const t = normTag(name);
    tagIndex.get(t)?.forEach((c) => (scores[c] = (scores[c] ?? 0) + count));
    if (count >= ORIGIN_MIN && francophoneSet.has(t)) francophone = true;
  }
  const best = Math.max(0, ...Object.values(scores));
  const cats = Object.keys(scores).filter((c) => scores[c] >= STYLE_FLOOR && scores[c] >= best * STYLE_RATIO);
  return francophone ? [...cats, 'fr'] : cats;
}

// --- Data fetching ---

function readJson(url, fallback) {
  return existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : fallback;
}

function apiKey() {
  const env = existsSync(file('../.env.local')) ? readFileSync(file('../.env.local'), 'utf8') : '';
  const key = process.env.LASTFM_API_KEY ?? env.match(/^LASTFM_API_KEY=(.*)$/m)?.[1]?.trim();
  if (!key) throw new Error('LASTFM_API_KEY missing (put it in .env.local)');
  return key;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function deezerPlaylist(id) {
  const out = [];
  for (let index = 0; ; index += 500) {
    const page = await (await fetch(`https://api.deezer.com/playlist/${id}/tracks?limit=500&index=${index}`)).json();
    if (page.error) throw new Error(`Deezer playlist ${id}: ${page.error.message}`);
    out.push(...(page.data ?? []));
    if (!page.next) return out;
  }
}

async function artistTags(key, artist) {
  const qs = new URLSearchParams({ method: 'artist.getTopTags', artist, autocorrect: '1', api_key: key, format: 'json' });
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`, { headers: { 'User-Agent': 'classifymusic/1.0' } });
    await sleep(220); // ~4 requests/s, well within Last.fm's limits
    const data = await res.json().catch(() => null);
    if (data?.toptags) {
      return data.toptags.tag.slice(0, 15).map((t) => ({ name: t.name, count: Number(t.count) }));
    }
    if (data?.error === 6) return []; // artist not found
    await sleep(2000 * (attempt + 1)); // rate limited or server error: back off
  }
  throw new Error(`Last.fm failed for "${artist}"`);
}

// --- Main ---

const refresh = process.argv.includes('--refresh');
const playlists = [...DECADES, ...MIXED];
const tracks = (await Promise.all(playlists.map((p) => deezerPlaylist(p.playlistId)))).flat();

const artists = new Map(); // normalized -> display name
for (const t of tracks) {
  const name = t.artist?.name;
  if (name && !artists.has(normalize(name))) artists.set(normalize(name), name);
}
console.log(`${tracks.length} tracks, ${artists.size} artists`);

const cache = refresh ? {} : readJson(TAGS_CACHE, {});
const missing = [...artists].filter(([norm]) => !(norm in cache));
if (missing.length) {
  const key = apiKey();
  console.log(`Querying Last.fm for ${missing.length} artists…`);
  let done = 0;
  for (const [norm, name] of missing) {
    cache[norm] = await artistTags(key, name);
    if (++done % 100 === 0) {
      console.log(`  ${done}/${missing.length}`);
      writeFileSync(TAGS_CACHE, JSON.stringify(cache, null, 1)); // progress survives a crash
    }
  }
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(TAGS_CACHE, JSON.stringify(sorted, null, 1));
}

// Apply overrides
const overrides = readJson(OVERRIDES, { artists: {}, songs: {} });
const validKeys = new Set(CATEGORIES.map((c) => c.key));
function applyFix(cats, fix, where) {
  const set = new Set(fix.set ?? cats);
  (fix.add ?? []).forEach((c) => set.add(c));
  (fix.remove ?? []).forEach((c) => set.delete(c));
  for (const c of set) if (!validKeys.has(c)) throw new Error(`Unknown category "${c}" in overrides (${where})`);
  return [...set];
}

const outArtists = {};
for (const [norm] of artists) {
  let cats = categorize(cache[norm] ?? []);
  const fix = Object.entries(overrides.artists ?? {}).find(([name]) => normalize(name) === norm)?.[1];
  if (fix) cats = applyFix(cats, fix, norm);
  if (cats.length) outArtists[norm] = cats.sort();
}

const outSongs = {};
for (const [song, fix] of Object.entries(overrides.songs ?? {})) {
  const [artist, title] = song.split('|');
  if (!title) throw new Error(`Song override "${song}" must look like "Artist|Title"`);
  const norm = normalize(artist);
  outSongs[`${norm}|${normTitle(title)}`] = applyFix(outArtists[norm] ?? [], fix, song).sort();
}

writeFileSync(OUTPUT, JSON.stringify({ artists: outArtists, songs: outSongs }) + '\n');

// --- Report ---

const songsOf = (cat) =>
  new Set(
    tracks
      .filter((t) => {
        const norm = normalize(t.artist?.name);
        const cats = outSongs[`${norm}|${normTitle(t.title)}`] ?? outArtists[norm] ?? [];
        return cat ? cats.includes(cat) : !cats.some((c) => c !== 'fr');
      })
      .map((t) => `${normalize(t.artist?.name)}|${normTitle(t.title)}`),
  ).size;

console.log('\nChansons par catégorie (doublons exclus) :');
for (const c of CATEGORIES) console.log(`  ${c.label.padEnd(22)} ${songsOf(c.key)}`);
console.log(`  ${'(aucun style)'.padEnd(22)} ${songsOf(null)}`);

const unstyled = [...artists].filter(([n]) => !(outArtists[n] ?? []).some((c) => c !== 'fr'));
console.log(`\nArtistes sans style (${unstyled.length}/${artists.size}) :`);
console.log(
  unstyled
    .map(([n, name]) => `${name} [${(cache[n] ?? []).slice(0, 4).map((t) => t.name).join(', ') || 'aucun tag'}]`)
    .join('\n')
    .replace(/^/gm, '  '),
);

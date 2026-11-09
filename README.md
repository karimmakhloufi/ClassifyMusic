# Timeline Tunes

A music game: listen to a 30-second preview and place the song at the right spot in your
chronological timeline. Three wrong placements and the game is over.

Built with React + Vite. Song data (title, artist, cover, preview) comes from the
[Deezer API](https://developers.deezer.com/api).

## Run it

Requires Node.js 18+.

```sh
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## How it works

- **Song sources**: Deezer's editorial decade playlists (60s → 2020s), all mixed together.
  The game starts as soon as the page loads.
- **CORS**: Deezer's API doesn't send CORS headers, so the browser can't call it directly.
  `vite.config.js` proxies `/deezer/*` to `api.deezer.com` (for both `npm run dev` and
  `npm run preview`). A static deployment (`npm run build`) needs the same proxy on your host,
  e.g. a Netlify/Vercel rewrite or a small serverless function.
- **Release dates**: Deezer's `release_date` is usually the date of the compilation or remaster
  it streams ("Billie Jean" comes back as 2009, "Don't Stop Believin'" as 2001). That would
  make the game wrong, so `src/lib/releaseYear.js` takes the **earliest** of:
  - Deezer's track date and album date
  - MusicBrainz's `first-release-date` for matching official recordings

  Songs from a decade playlist whose year still falls outside that decade (±1 year) are
  skipped as unreliable. Lookups are cached in `localStorage`.
- MusicBrainz allows about 1 request/second, so songs are resolved a few at a time in the
  background while you play (`src/lib/songPool.js`).
- Years are compared, not full dates. Songs from the same year can go in either order.

## Project layout

```
src/
  api/deezer.js         Deezer calls (via proxy)
  api/musicbrainz.js    Throttled recording search → earliest release year
  lib/releaseYear.js    Combines Deezer + MusicBrainz dates, decade sanity check, cache
  lib/songPool.js       Shuffled queue of songs, background prefetching
  lib/timeline.js       Pure placement rules
  lib/sources.js        Decade → Deezer playlist IDs
  hooks/useAudio.js     Single shared <audio> element for previews
  components/           Game, CurrentCard, Timeline, GameOver
```

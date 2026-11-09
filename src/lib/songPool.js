import { getPlaylistTracks, getTrack } from '../api/deezer.js';
import { findReleaseYear } from './releaseYear.js';
import { displayTitle, normalize, normTitle } from './text.js';

const BUFFER = 3; // songs resolved ahead of time

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Supplies playable songs with a verified release year.
 * Resolving a year takes ~1 s (MusicBrainz rate limit), so a few songs are
 * prepared in the background while the player is thinking.
 */
export class SongPool {
  /** @param sources [{playlistId, decade: {from,to} | null}] */
  constructor(sources) {
    this.sources = sources;
    this.queue = [];
    this.ready = [];
    this.waiters = [];
    this.filling = false;
    this.stopped = false;
  }

  async init() {
    const results = await Promise.allSettled(
      this.sources.map(async (src) =>
        (await getPlaylistTracks(src.playlistId)).map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist?.name ?? '',
          readable: t.readable,
          preview: t.preview,
          decade: src.decade,
        })),
      ),
    );
    const failed = results.find((r) => r.status === 'rejected');
    const entries = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    if (!entries.length && failed) throw failed.reason;

    const seen = new Set();
    this.queue = shuffle(entries).filter((e) => {
      if (e.readable === false || !e.preview) return false;
      const key = `${normalize(e.artist)}|${normTitle(e.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (this.queue.length < 2) throw new Error('Not enough playable songs in that selection.');
    this.fill();
  }

  stop() {
    this.stopped = true;
    this.notify();
  }

  /** Next ready song, or null when the pool is exhausted. */
  async next() {
    this.fill();
    while (!this.ready.length) {
      if (this.stopped || (!this.queue.length && !this.filling)) return null;
      await new Promise((resolve) => this.waiters.push(resolve));
    }
    const song = this.ready.shift();
    this.fill();
    return song;
  }

  notify() {
    const waiters = this.waiters;
    this.waiters = [];
    waiters.forEach((w) => w());
  }

  async fill() {
    if (this.filling) return;
    this.filling = true;
    while (!this.stopped && this.ready.length < BUFFER && this.queue.length) {
      const entry = this.queue.shift();
      try {
        const song = await resolveSong(entry);
        if (song) {
          this.ready.push(song);
          this.notify();
        }
      } catch (err) {
        console.warn(`Skipping "${entry.title}"`, err);
      }
    }
    this.filling = false;
    this.notify();
  }
}

async function resolveSong(entry) {
  // Fetch the full track: the playlist listing has no release date, and preview
  // URLs are signed and expire, so a fresh one is better anyway.
  const track = await getTrack(entry.id);
  if (!track.preview) return null;
  const found = await findReleaseYear(track, entry.decade);
  if (!found) return null;
  return {
    id: track.id,
    title: displayTitle(track.title),
    artist: track.artist.name,
    cover: track.album?.cover_big || track.album?.cover_medium || '',
    preview: track.preview,
    link: track.link,
    year: found.year,
    yearSource: found.source,
  };
}

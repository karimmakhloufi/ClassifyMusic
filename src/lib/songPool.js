import { getPlaylistTracks, getTrack } from '../api/deezer.js';
import { findReleaseYear } from './releaseYear.js';
import { findReplacement } from './replacement.js';
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

    // Dead tracks (withdrawn by Deezer, no preview) are kept: a playable copy is looked up
    // when they come up (see replacement.js). Playable entries go first in the dedup, so a
    // song present both ways keeps its working version.
    const isDead = (e) => e.readable === false || !e.preview;
    const seen = new Set();
    const unique = [...entries.filter((e) => !isDead(e)), ...entries.filter(isDead)].filter((e) => {
      const key = `${normalize(e.artist)}|${normTitle(e.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    this.queue = shuffle(unique.map((e) => ({ ...e, dead: isDead(e) })));
    if (this.queue.length < 2) throw new Error('Pas assez de chansons jouables.');
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
  let track = entry.dead ? null : await getTrack(entry.id);
  if (!track || track.readable === false || !track.preview) {
    // Withdrawn or unplayable here: look for the same song under another Deezer ID.
    const copy = await findReplacement(entry.artist, entry.title);
    if (!copy) return null;
    track = await getTrack(copy.id);
    if (!track.preview) return null;
  }
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

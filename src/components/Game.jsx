import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../hooks/useAudio.js';
import { correctSlot, insertAt, isCorrectSlot } from '../lib/timeline.js';
import CurrentCard from './CurrentCard.jsx';
import TapOverlay from './TapOverlay.jsx';
import Timeline from './Timeline.jsx';

const LIVES = 3;
const REVEAL_MS = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Game({ pool, onEnd, locked, onUnlock }) {
  const audio = useAudio();
  const [timeline, setTimeline] = useState([]);
  const [current, setCurrent] = useState(null);
  const [reveal, setReveal] = useState(null); // { song, ok } after placing
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const started = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Deal the first (already revealed) song plus the first song to place.
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    (async () => {
      const anchor = await pool.next();
      const first = await pool.next();
      if (!alive.current) return;
      if (!anchor || !first) {
        onEnd({ score: 0, timeline: anchor ? [{ ...anchor, placed: 'anchor' }] : [], reason: 'exhausted' });
        return;
      }
      setTimeline([{ ...anchor, placed: 'anchor' }]);
      setCurrent(first);
      setLoading(false);
    })();
  }, [pool, onEnd]);

  // Auto-play each new song (once the player has tapped to start).
  useEffect(() => {
    if (current && !locked) audio.play(current.preview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, locked]);

  function unlock() {
    // Start playback inside the tap handler itself: iOS Safari requires it.
    if (current) audio.play(current.preview);
    onUnlock();
  }

  async function place(slot) {
    if (!current || reveal) return;
    const song = current;
    const ok = isCorrectSlot(timeline, slot, song.year);
    const next = insertAt(timeline, ok ? slot : correctSlot(timeline, song.year), {
      ...song,
      placed: ok ? 'correct' : 'wrong',
    });
    const newLives = ok ? lives : lives - 1;
    const newScore = ok ? score + 1 : score;

    audio.stop();
    setTimeline(next);
    setLives(newLives);
    setScore(newScore);
    setReveal({ song, ok });
    setCurrent(null);

    await sleep(REVEAL_MS);
    if (!alive.current) return;
    if (newLives === 0) {
      onEnd({ score: newScore, timeline: next, reason: 'lives' });
      return;
    }

    setLoading(true);
    const upcoming = await pool.next();
    if (!alive.current) return;
    setLoading(false);
    setReveal(null);
    if (!upcoming) {
      onEnd({ score: newScore, timeline: next, reason: 'exhausted' });
      return;
    }
    setCurrent(upcoming);
  }

  return (
    <main className="screen game">
      {locked && <TapOverlay ready={!!current} onTap={unlock} />}
      <header className="hud">
        <span className="score">Score {score}</span>
        <span className="lives" aria-label={`${lives} lives left`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <span key={i} className={i < lives ? 'life' : 'life lost'}>
              ♥
            </span>
          ))}
        </span>
      </header>

      <div className="sticky">
        <CurrentCard song={current} reveal={reveal} loading={loading} audio={audio} />
      </div>

      {timeline.length > 0 && (
        <>
          <p className="hint center">
            {current ? (
              <>
                Tap a <strong>+</strong> to place the song. Oldest at the top.
              </>
            ) : (
              ' '
            )}
          </p>
          <Timeline
            songs={timeline}
            onPlace={current && !reveal ? place : null}
            highlightId={reveal?.song.id}
            audio={audio}
          />
        </>
      )}
    </main>
  );
}

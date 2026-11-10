import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../hooks/useAudio.js';
import { correctSlot, insertAt, isCorrectSlot } from '../lib/timeline.js';
import { applyPlacement, awardArtist, checkEnd, createPlayers, leader, nextTurn } from '../lib/players.js';
import ArtistQuiz from './ArtistQuiz.jsx';
import CurrentCard from './CurrentCard.jsx';
import Scoreboard from './Scoreboard.jsx';
import TapOverlay from './TapOverlay.jsx';
import Timeline from './Timeline.jsx';

const REVEAL_MS = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One game. `players` is a list of names: one name = solo, several = party mode.
 *
 * Turn phases:
 *   solo:  blind (guess the artist) -> award (did you get it?) -> place
 *   party: handoff ("Pass to X") -> blind (guess the artist) -> award (who got it?) -> place
 */
export default function Game({ pool, players: names, target, onEnd }) {
  const party = names.length > 1;
  const firstPhase = party ? 'handoff' : 'blind';
  const audio = useAudio();
  const [players, setPlayers] = useState(() => createPlayers(names));
  const [turn, setTurn] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [current, setCurrent] = useState(null);
  const [phase, setPhase] = useState(firstPhase);
  const [awarded, setAwarded] = useState(undefined); // undefined = not decided, null = no one, else index
  const [reveal, setReveal] = useState(null); // { song, ok, by } after placing
  const [loading, setLoading] = useState(true);

  const started = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const finish = (end, finalPlayers, finalTimeline) =>
    onEnd({ mode: party ? 'party' : 'solo', players: finalPlayers, timeline: finalTimeline, ...end });

  // Deal the first (already revealed) song plus the first song to place.
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    (async () => {
      const anchor = await pool.next();
      const first = await pool.next();
      if (!alive.current) return;
      const anchorTimeline = anchor ? [{ ...anchor, placed: 'anchor' }] : [];
      if (!anchor || !first) {
        finish({ reason: 'exhausted', winner: party ? 0 : null }, players, anchorTimeline);
        return;
      }
      setTimeline(anchorTimeline);
      setCurrent(first);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play each new song once it's visible (in party mode: after the handoff tap).
  const waitingForTap = phase === 'handoff';
  useEffect(() => {
    if (current && !waitingForTap) audio.play(current.preview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, waitingForTap]);

  function startTurn() {
    // Play inside the tap handler itself: iOS Safari requires it.
    if (current) audio.play(current.preview);
    setPhase('blind');
  }

  function award(index) {
    setPlayers((ps) => awardArtist(ps, index));
    setAwarded(index);
    setPhase('place');
  }

  async function place(slot) {
    if (!current || reveal || phase !== 'place') return;
    const song = current;
    const player = players[turn];
    const ok = isCorrectSlot(timeline, slot, song.year);
    const nextTimeline = insertAt(timeline, ok ? slot : correctSlot(timeline, song.year), {
      ...song,
      placed: ok ? 'correct' : 'wrong',
      placedBy: party ? player.name : null,
    });
    const nextPlayers = applyPlacement(players, turn, ok);

    audio.stop();
    setTimeline(nextTimeline);
    setPlayers(nextPlayers);
    setReveal({ song, ok, by: party ? player.name : null });
    setCurrent(null);

    await sleep(REVEAL_MS);
    if (!alive.current) return;
    const end = checkEnd(nextPlayers, target);
    if (end) {
      finish(end, nextPlayers, nextTimeline);
      return;
    }

    setTurn(nextTurn(nextPlayers, turn));
    setLoading(true);
    const upcoming = await pool.next();
    if (!alive.current) return;
    setLoading(false);
    setReveal(null);
    setAwarded(undefined);
    if (!upcoming) {
      finish({ reason: 'exhausted', winner: party ? leader(nextPlayers) : null }, nextPlayers, nextTimeline);
      return;
    }
    // Batched together, so the auto-play effect sees the handoff and waits for the tap.
    setPhase(firstPhase);
    setCurrent(upcoming);
  }

  const who = players[turn];
  const canPlace = current && !reveal && phase === 'place';

  let hint = ' ';
  if (current && phase === 'place') {
    hint = (
      <>
        {party && <strong>{who.name}: </strong>}
        Tap a <strong>+</strong> to place the song. Oldest at the top.
      </>
    );
  } else if (current && (phase === 'blind' || phase === 'award')) {
    hint = (
      <>
        {party ? (
          <>
            Then <strong>{who.name}</strong> places the song on the timeline.
          </>
        ) : (
          'Then place the song on the timeline.'
        )}
      </>
    );
  }

  return (
    <main className="screen game">
      {phase === 'handoff' && !reveal && (
        <TapOverlay
          title={`${who.name}'s turn`}
          sub={current ? 'Pass the device, then tap to play the song' : 'Loading the next song…'}
          onTap={startTurn}
        />
      )}

      <Scoreboard players={players} turn={turn} target={target} />

      <div className="sticky">
        <CurrentCard
          song={current}
          reveal={reveal}
          loading={loading}
          audio={audio}
          blind={phase === 'blind'}
        />
        {current && !reveal && (
          <ArtistQuiz
            phase={phase}
            players={players}
            awarded={awarded}
            onReveal={() => setPhase('award')}
            onAward={award}
          />
        )}
      </div>

      {timeline.length > 0 && (
        <>
          <p className="hint center">{hint}</p>
          <Timeline songs={timeline} onPlace={canPlace ? place : null} highlightId={reveal?.song.id} audio={audio} />
        </>
      )}
    </main>
  );
}

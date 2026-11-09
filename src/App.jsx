import { useEffect, useRef, useState } from 'react';
import Game from './components/Game.jsx';
import GameOver from './components/GameOver.jsx';
import TapOverlay from './components/TapOverlay.jsx';
import { SongPool } from './lib/songPool.js';
import { DECADES } from './lib/sources.js';
import { loadBest, saveBest } from './lib/storage.js';

const SOURCES = DECADES.map(({ playlistId, decade }) => ({ playlistId, decade }));

export default function App() {
  const [screen, setScreen] = useState('loading'); // loading | error | game | over
  const [pool, setPool] = useState(null);
  const [gameId, setGameId] = useState(0);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(loadBest);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false); // has the player tapped to start?
  const unlock = () => setUnlocked(true);
  const started = useRef(false);

  async function start() {
    const p = new SongPool(SOURCES);
    await p.init(); // throws with a readable message; callers show it
    setPool(p);
    setGameId((n) => n + 1);
    setScreen('game');
  }

  async function startFromScratch() {
    setScreen('loading');
    try {
      await start();
    } catch (err) {
      setError(err.message || 'Something went wrong loading the songs.');
      setScreen('error');
    }
  }

  // Start the first game straight away.
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    startFromScratch();
  }, []);

  function endGame(res) {
    pool?.stop();
    const newBest = res.score > best;
    if (newBest) {
      setBest(res.score);
      saveBest(res.score);
    }
    setResult({ ...res, newBest });
    setScreen('over');
  }

  if (screen === 'game' && pool) {
    return <Game key={gameId} pool={pool} onEnd={endGame} locked={!unlocked} onUnlock={unlock} />;
  }
  if (screen === 'over' && result) {
    return <GameOver result={result} best={best} onAgain={start} />;
  }
  return (
    <main className="screen intro">
      {screen === 'loading' && !unlocked && <TapOverlay ready={false} onTap={unlock} />}
      <h1>Timeline Tunes</h1>
      {screen === 'error' ? (
        <>
          <p className="status error" role="alert">
            {error}
          </p>
          <button className="primary" onClick={startFromScratch}>
            Try again
          </button>
        </>
      ) : (
        <p className="lead" role="status">
          Loading songs…
        </p>
      )}
    </main>
  );
}

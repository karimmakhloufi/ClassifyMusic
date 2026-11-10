import { useEffect, useRef, useState } from 'react';
import Menu from './components/Menu.jsx';
import PartySetup from './components/PartySetup.jsx';
import Game from './components/Game.jsx';
import GameOver from './components/GameOver.jsx';
import { SongPool } from './lib/songPool.js';
import { SOURCES } from './lib/sources.js';
import { loadBest, saveBest } from './lib/storage.js';
import { track } from './lib/analytics.js';

export default function App() {
  const [screen, setScreen] = useState('menu'); // menu | party | game | over
  const [game, setGame] = useState(null); // { id, pool, players: string[], target }
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(loadBest);
  const [partyNames, setPartyNames] = useState(['Joueur 1', 'Joueur 2']);
  const [target, setTarget] = useState(10);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // The next game's song pool, loaded in the background so starting is instant.
  const nextPool = useRef(null);
  function preparePool() {
    const pool = new SongPool(SOURCES);
    const ready = pool.init();
    ready.catch(() => {}); // reported when a game tries to start
    nextPool.current = { pool, ready };
  }
  useEffect(() => {
    if (!nextPool.current) preparePool();
  }, []);

  async function start(players) {
    if (!nextPool.current) preparePool();
    const { pool, ready } = nextPool.current;
    setStarting(true);
    setError('');
    try {
      await ready;
    } catch (err) {
      nextPool.current = null; // retry with a fresh pool next time
      console.warn('Loading songs failed', err);
      track('erreur_chargement', { message: String(err?.message ?? err).slice(0, 200) });
      setError('Impossible de charger les chansons. Vérifie ta connexion internet.');
      setStarting(false);
      return;
    }
    nextPool.current = null;
    const party = players.length > 1;
    track('partie_lancee', party ? { mode: 'soiree', joueurs: players.length, cible: target } : { mode: 'solo' });
    setGame((g) => ({ id: (g?.id ?? 0) + 1, pool, players, target, startedAt: Date.now() }));
    setStarting(false);
    setScreen('game');
  }

  function endGame(res) {
    game.pool.stop();
    const party = res.mode === 'party';
    track('partie_terminee', {
      mode: party ? 'soiree' : 'solo',
      fin: res.reason, // solo: lives | party: target | both: exhausted
      chansons: res.timeline.length,
      duree_s: Math.round((Date.now() - game.startedAt) / 1000),
      ...(party
        ? { joueurs: res.players.length, score_gagnant: res.players[res.winner]?.score ?? 0 }
        : { score: res.players[0].score, artistes: res.players[0].artist }),
    });
    let newBest = false;
    if (res.mode === 'solo' && res.players[0].score > best) {
      newBest = true;
      setBest(res.players[0].score);
      saveBest(res.players[0].score);
    }
    setResult({ ...res, newBest, target: game.target });
    preparePool(); // reshuffled songs for "Play again"
    setScreen('over');
  }

  function toMenu() {
    setError('');
    setScreen('menu');
  }

  if (screen === 'game' && game) {
    return <Game key={game.id} pool={game.pool} players={game.players} target={game.target} onEnd={endGame} />;
  }
  if (screen === 'over' && result) {
    return (
      <GameOver
        result={result}
        best={best}
        starting={starting}
        error={error}
        onAgain={() => {
          track('revanche', { mode: game.players.length > 1 ? 'soiree' : 'solo' });
          return start(game.players);
        }}
        onMenu={toMenu}
      />
    );
  }
  if (screen === 'party') {
    return (
      <PartySetup
        names={partyNames}
        setNames={setPartyNames}
        target={target}
        setTarget={setTarget}
        starting={starting}
        error={error}
        onStart={start}
        onBack={toMenu}
      />
    );
  }
  return (
    <Menu
      best={best}
      starting={starting}
      error={error}
      onSolo={() => start(['Toi'])}
      onParty={() => {
        setError('');
        setScreen('party');
      }}
    />
  );
}

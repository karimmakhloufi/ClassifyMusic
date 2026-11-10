import { LIVES } from '../lib/players.js';

function Hearts({ lives }) {
  return (
    <span className="lives" aria-label={`${lives} ${lives === 1 ? 'life' : 'lives'} left`}>
      {Array.from({ length: LIVES }, (_, i) => (
        <span key={i} className={i < lives ? 'life' : 'life lost'} aria-hidden="true">
          ♥
        </span>
      ))}
    </span>
  );
}

/** Solo: score + hearts. Party (no lives): one chip per player, current turn highlighted. */
export default function Scoreboard({ players, turn, target }) {
  if (players.length === 1) {
    return (
      <header className="hud">
        <span className="score">Score {players[0].score}</span>
        <Hearts lives={players[0].lives} />
      </header>
    );
  }
  return (
    <header className="hud party">
      <ul className="scoreboard">
        {players.map((p, i) => (
          <li
            key={i}
            className={`player-chip ${i === turn ? 'active' : ''}`}
            aria-current={i === turn ? 'true' : undefined}
          >
            <span className="pc-name">{p.name}</span>
            <span className="pc-score">{p.score}</span>
          </li>
        ))}
      </ul>
      <span className="hint">First to {target}</span>
    </header>
  );
}

import { useAudio } from '../hooks/useAudio.js';
import { standings } from '../lib/players.js';
import Timeline from './Timeline.jsx';

function partyHeadline({ players, winner, reason, target }) {
  const name = players[winner]?.name;
  switch (reason) {
    case 'target':
      return [`${name} wins!`, `First to ${target} points.`];
    default:
      return [`${name} wins!`, 'We ran out of songs. Most points takes it.'];
  }
}

export default function GameOver({ result, best, starting, error, onAgain, onMenu }) {
  const audio = useAudio();
  const party = result.mode === 'party';
  const { score, artist } = result.players[0];
  const placed = score - artist;

  const [title, subtitle] = party
    ? partyHeadline(result)
    : [
        result.reason === 'exhausted' ? 'Out of songs!' : 'Game over',
        result.newBest ? 'New best score!' : `Best: ${best}`,
      ];

  return (
    <main className="screen over">
      <h1>{title}</h1>
      {!party && (
        <>
          <p className="big">
            {score} {score === 1 ? 'point' : 'points'}
          </p>
          <p className="hint">
            {placed} {placed === 1 ? 'song' : 'songs'} placed · 🎤 {artist} {artist === 1 ? 'artist' : 'artists'}{' '}
            guessed
          </p>
        </>
      )}
      <p className="hint">{subtitle}</p>

      {party && (
        <ol className="standings">
          {standings(result.players).map((p, rank) => (
            <li key={p.index} className={p.index === result.winner ? 'winner' : ''}>
              <span className="st-rank">{rank + 1}</span>
              <span className="st-name">{p.name}</span>
              <span className="st-score">
                {p.score} {p.score === 1 ? 'pt' : 'pts'}
                {p.artist > 0 && <span className="st-artist"> (🎤 {p.artist})</span>}
              </span>            </li>
          ))}
        </ol>
      )}

      <div className="actions">
        <button className="primary" onClick={onAgain} disabled={starting}>
          {starting ? 'Loading songs…' : party ? 'Rematch' : 'Play again'}
        </button>
        <button className="ghost" onClick={onMenu} disabled={starting}>
          Main menu
        </button>
      </div>
      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}

      <h2>{party ? 'The timeline' : 'Your timeline'}</h2>
      <Timeline songs={result.timeline} audio={audio} />
    </main>
  );
}

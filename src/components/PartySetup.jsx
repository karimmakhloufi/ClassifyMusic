const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const TARGETS = [5, 10, 15];

export default function PartySetup({ names, setNames, target, setTarget, starting, error, onStart, onBack }) {
  function rename(i, value) {
    setNames((cur) => cur.map((n, j) => (j === i ? value : n)));
  }
  function add() {
    setNames((cur) => (cur.length < MAX_PLAYERS ? [...cur, `Player ${cur.length + 1}`] : cur));
  }
  function remove(i) {
    setNames((cur) => (cur.length > MIN_PLAYERS ? cur.filter((_, j) => j !== i) : cur));
  }
  function submit(e) {
    e.preventDefault();
    onStart(names.map((n, i) => n.trim() || `Player ${i + 1}`));
  }

  return (
    <main className="screen party-setup">
      <button className="ghost back" onClick={onBack} disabled={starting}>
        ← Back
      </button>
      <h1>Party mode</h1>
      <p className="lead">
        Pass the device around. Each song starts as a blind test: everyone guesses the artist, and whoever gets it
        right scores a point. Then the player whose turn it is places the song on the shared timeline. A correct
        placement scores a point too. First to the target score wins.
      </p>

      <form onSubmit={submit}>
        <h2>Players or teams</h2>
        <ol className="player-list">
          {names.map((name, i) => (
            <li key={i}>
              <input
                type="text"
                value={name}
                maxLength={20}
                onChange={(e) => rename(i, e.target.value)}
                aria-label={`Player ${i + 1} name`}
              />
              <button
                type="button"
                className="ghost icon"
                onClick={() => remove(i)}
                disabled={names.length <= MIN_PLAYERS}
                aria-label={`Remove ${name || `player ${i + 1}`}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="ghost" onClick={add} disabled={names.length >= MAX_PLAYERS}>
          + Add player
        </button>

        <h2>First to</h2>
        <div className="chips" role="radiogroup" aria-label="Points to win">
          {TARGETS.map((t) => (
            <button
              type="button"
              key={t}
              role="radio"
              aria-checked={target === t}
              className={`chip ${target === t ? 'on' : ''}`}
              onClick={() => setTarget(t)}
            >
              {t} points
            </button>
          ))}
        </div>

        <button type="submit" className="primary" disabled={starting}>
          {starting ? 'Loading songs…' : 'Start party'}
        </button>
      </form>

      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}

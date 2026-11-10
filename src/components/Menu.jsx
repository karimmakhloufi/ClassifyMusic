export default function Menu({ best, starting, error, onSolo, onParty }) {
  return (
    <main className="screen menu">
      <h1>Timeline Tunes</h1>
      <p className="lead">
        Listen to each song and slot it into the timeline at the right spot. Turn your sound on 🔊
      </p>

      <div className="mode-buttons">
        <button className="mode primary-mode" onClick={onSolo} disabled={starting}>
          <span className="mode-icon" aria-hidden="true">
            ▶
          </span>
          <span className="mode-text">
            <span className="mode-title">{starting ? 'Loading songs…' : 'Solo'}</span>
            <span className="mode-sub">Guess the artist, then place the song. 3 lives.</span>
          </span>
        </button>
        <button className="mode" onClick={onParty} disabled={starting}>
          <span className="mode-icon" aria-hidden="true">
            👥
          </span>
          <span className="mode-text">
            <span className="mode-title">Party</span>
            <span className="mode-sub">2–8 players on one device, one shared timeline</span>
          </span>
        </button>
      </div>

      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
      {best > 0 && <p className="hint center">Solo best: {best}</p>}
    </main>
  );
}

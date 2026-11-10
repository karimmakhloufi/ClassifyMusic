export default function Menu({ best, starting, error, onSolo, onParty }) {
  return (
    <main className="screen menu">
      <h1>Timeline Tunes</h1>
      <p className="lead">
        Écoute chaque chanson et place-la au bon endroit sur la frise chronologique. Monte le son 🔊
      </p>

      <div className="mode-buttons">
        <button className="mode primary-mode" onClick={onSolo} disabled={starting}>
          <span className="mode-icon" aria-hidden="true">
            ▶
          </span>
          <span className="mode-text">
            <span className="mode-title">{starting ? 'Chargement des chansons…' : 'Solo'}</span>
            <span className="mode-sub">Devine l'artiste, puis place la chanson. 3 vies.</span>
          </span>
        </button>
        <button className="mode" onClick={onParty} disabled={starting}>
          <span className="mode-icon" aria-hidden="true">
            👥
          </span>
          <span className="mode-text">
            <span className="mode-title">Soirée</span>
            <span className="mode-sub">2 à 8 joueurs sur un seul appareil, une frise commune</span>
          </span>
        </button>
      </div>

      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
      {best > 0 && <p className="hint center">Meilleur score solo : {best}</p>}
    </main>
  );
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const TARGETS = [5, 10, 15];

export default function PartySetup({ names, setNames, target, setTarget, starting, error, onStart, onBack }) {
  function rename(i, value) {
    setNames((cur) => cur.map((n, j) => (j === i ? value : n)));
  }
  function add() {
    setNames((cur) => (cur.length < MAX_PLAYERS ? [...cur, `Joueur ${cur.length + 1}`] : cur));
  }
  function remove(i) {
    setNames((cur) => (cur.length > MIN_PLAYERS ? cur.filter((_, j) => j !== i) : cur));
  }
  function submit(e) {
    e.preventDefault();
    onStart(names.map((n, i) => n.trim() || `Joueur ${i + 1}`));
  }

  return (
    <main className="screen party-setup">
      <button className="ghost back" onClick={onBack} disabled={starting}>
        ← Retour
      </button>
      <h1>Mode soirée</h1>
      <p className="lead">
        Faites tourner l'appareil. Chaque chanson commence par un blind test : tout le monde devine l'artiste, et
        celui qui trouve marque un point. Ensuite, le joueur dont c'est le tour place la chanson sur la frise commune.
        Un placement correct rapporte aussi un point. Le premier à atteindre le score cible gagne.
      </p>

      <form onSubmit={submit}>
        <h2>Joueurs ou équipes</h2>
        <ol className="player-list">
          {names.map((name, i) => (
            <li key={i}>
              <input
                type="text"
                value={name}
                maxLength={20}
                onChange={(e) => rename(i, e.target.value)}
                aria-label={`Nom du joueur ${i + 1}`}
              />
              <button
                type="button"
                className="ghost icon"
                onClick={() => remove(i)}
                disabled={names.length <= MIN_PLAYERS}
                aria-label={`Retirer ${name || `le joueur ${i + 1}`}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="ghost" onClick={add} disabled={names.length >= MAX_PLAYERS}>
          + Ajouter un joueur
        </button>

        <h2>Premier à</h2>
        <div className="chips" role="radiogroup" aria-label="Points pour gagner">
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
          {starting ? 'Chargement des chansons…' : 'Lancer la partie'}
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

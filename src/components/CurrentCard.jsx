export default function CurrentCard({ song, reveal, loading, audio, blind = false }) {
  if (reveal) {
    const { song: s, ok, by, first } = reveal;
    return (
      <div className={`current-card ${first ? 'is-first' : ok ? 'is-correct' : 'is-wrong'}`} role="status">
        <img className="cover" src={s.cover} alt="" />
        <div className="info">
          <div className="verdict">
            {first ? (
              'Première chanson sur la frise'
            ) : (
              <>
                {by ? `${by} : ` : ''}
                {ok ? 'Bien joué !' : 'Raté'}
              </>
            )}
          </div>
          <div className="title">{s.title}</div>
          <div className="artist">{s.artist}</div>
          <div className="year-big">{s.year}</div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="current-card placeholder" role="status">
        <div className="spinner" aria-hidden="true" />
        <div className="info">
          <div className="artist">{loading ? 'Recherche de la prochaine chanson et vérification de sa date de sortie…' : ''}</div>
        </div>
      </div>
    );
  }

  const playing = audio.isPlaying(song.preview);
  const progress = audio.src === song.preview ? audio.progress : 0;

  return (
    <div className={`current-card ${blind ? 'blind' : ''}`}>
      {blind ? (
        <div className="cover mystery" aria-hidden="true">
          ?
        </div>
      ) : (
        <img className="cover" src={song.cover} alt="" />
      )}
      <div className="info">
        <div className="title">{blind ? 'Chanson mystère' : song.title}</div>
        <div className="artist">{blind ? 'Écoute bien…' : song.artist}</div>
        <div className="player">
          <button
            className="play"
            onClick={() => audio.toggle(song.preview)}
            aria-label={playing ? "Mettre en pause l'extrait" : "Écouter l'extrait"}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="progress" aria-hidden="true">
            <div style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

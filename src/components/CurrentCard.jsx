export default function CurrentCard({ song, reveal, loading, audio }) {
  if (reveal) {
    const { song: s, ok } = reveal;
    return (
      <div className={`current-card ${ok ? 'is-correct' : 'is-wrong'}`} role="status">
        <img className="cover" src={s.cover} alt="" />
        <div className="info">
          <div className="verdict">{ok ? 'Correct!' : 'Not quite'}</div>
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
          <div className="artist">{loading ? 'Finding the next song and checking its release date…' : ''}</div>
        </div>
      </div>
    );
  }

  const playing = audio.isPlaying(song.preview);
  const progress = audio.src === song.preview ? audio.progress : 0;

  return (
    <div className="current-card">
      <img className="cover" src={song.cover} alt="" />
      <div className="info">
        <div className="title">{song.title}</div>
        <div className="artist">{song.artist}</div>
        <div className="player">
          <button
            className="play"
            onClick={() => audio.toggle(song.preview)}
            aria-label={playing ? 'Pause preview' : 'Play preview'}
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

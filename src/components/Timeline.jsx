import { Fragment } from 'react';

function slotLabel(songs, index) {
  const before = songs[index - 1];
  const after = songs[index];
  if (!before) return `Before ${after.year}`;
  if (!after) return `After ${before.year}`;
  return `Between ${before.year} and ${after.year}`;
}

function Slot({ songs, index, onPlace }) {
  const label = slotLabel(songs, index);
  return (
    <li className="slot">
      <button onClick={() => onPlace(index)} aria-label={`Place here: ${label}`} title={label}>
        <span className="plus">+</span>
        <span className="slot-label">{label}</span>
      </button>
    </li>
  );
}

/**
 * Chronological list of revealed songs.
 * With `onPlace`, "+" slots appear between cards; tapping a cover plays its preview.
 */
export default function Timeline({ songs, onPlace, highlightId, audio }) {
  return (
    <ol className="timeline">
      {onPlace && <Slot songs={songs} index={0} onPlace={onPlace} />}
      {songs.map((s, i) => {
        const playing = audio?.isPlaying(s.preview);
        const classes = ['tl-card', s.placed, s.id === highlightId ? 'just-placed' : ''].join(' ');
        return (
          <Fragment key={s.id}>
            <li className={classes}>
              <span className="tl-year">{s.year}</span>
              <button
                className="tl-cover"
                onClick={() => audio?.toggle(s.preview)}
                disabled={!audio}
                aria-label={`${playing ? 'Pause' : 'Play'} ${s.title}`}
              >
                <img src={s.cover} alt="" loading="lazy" />
                {audio && <span className="tl-play">{playing ? '❚❚' : '▶'}</span>}
              </button>
              <span className="tl-meta">
                <span className="title">{s.title}</span>
                <span className="artist">{s.artist}</span>
                {s.placedBy && <span className="tl-by">placed by {s.placedBy}</span>}
              </span>
              {s.placed === 'wrong' && (
                <span className="tl-mark" aria-label="Misplaced">
                  ✗
                </span>
              )}
              {s.placed === 'correct' && (
                <span className="tl-mark" aria-label="Placed correctly">
                  ✓
                </span>
              )}
            </li>
            {onPlace && <Slot songs={songs} index={i + 1} onPlace={onPlace} />}
          </Fragment>
        );
      })}
    </ol>
  );
}

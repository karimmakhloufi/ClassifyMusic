/**
 * Blind test, shown under the song card (solo and party).
 *  - phase "blind": guess the artist, then tap Reveal.
 *  - phase "award": party: pick who guessed right (+1 point) or "No one";
 *                   solo: "Yes, I got it" (+1) or "No".
 *  - phase "place": shows the outcome while the card is being placed.
 */
export default function ArtistQuiz({ phase, players, awarded, onReveal, onAward }) {
  const solo = players.length === 1;

  if (phase === 'blind') {
    return (
      <div className="quiz">
        <p className="quiz-prompt">{solo ? "🎤 Who's the artist? Say it out loud!" : "🎤 Everyone: who's the artist?"}</p>
        <button className="primary quiz-reveal" onClick={onReveal}>
          Reveal
        </button>
      </div>
    );
  }

  if (phase === 'award') {
    return (
      <div className="quiz">
        <p className="quiz-prompt">{solo ? 'Did you get the artist?' : 'Who guessed the artist?'}</p>
        <div className="chips quiz-choices">
          {solo ? (
            <button className="chip award" onClick={() => onAward(0)}>
              Yes, +1 point
            </button>
          ) : (
            players.map((p, i) => (
              <button key={i} className="chip award" onClick={() => onAward(i)}>
                +1 {p.name}
              </button>
            ))
          )}
          <button className="chip none" onClick={() => onAward(null)}>
            {solo ? 'No' : 'No one'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'place' && awarded !== undefined) {
    let text;
    if (solo) text = awarded == null ? 'No artist point this time.' : '🎤 +1 point for the artist!';
    else text = awarded == null ? 'Nobody got the artist.' : `🎤 +1 point for ${players[awarded].name}`;
    return <p className={`quiz-result ${awarded == null ? 'miss' : ''}`}>{text}</p>;
  }
  return null;
}

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
        <p className="quiz-prompt">{solo ? "🎤 Qui est l'artiste ? Dis-le à voix haute !" : "🎤 Tout le monde : qui est l'artiste ?"}</p>
        <button className="primary quiz-reveal" onClick={onReveal}>
          Révéler
        </button>
      </div>
    );
  }

  if (phase === 'award') {
    return (
      <div className="quiz">
        <p className="quiz-prompt">{solo ? "Tu as trouvé l'artiste ?" : "Qui a trouvé l'artiste ?"}</p>
        <div className="chips quiz-choices">
          {solo ? (
            <button className="chip award" onClick={() => onAward(0)}>
              Oui, +1 point
            </button>
          ) : (
            players.map((p, i) => (
              <button key={i} className="chip award" onClick={() => onAward(i)}>
                +1 {p.name}
              </button>
            ))
          )}
          <button className="chip none" onClick={() => onAward(null)}>
            {solo ? 'Non' : 'Personne'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'place' && awarded !== undefined) {
    let text;
    if (solo) text = awarded == null ? "Pas de point d'artiste cette fois." : "🎤 +1 point pour l'artiste !";
    else text = awarded == null ? "Personne n'a trouvé l'artiste." : `🎤 +1 point pour ${players[awarded].name}`;
    return <p className={`quiz-result ${awarded == null ? 'miss' : ''}`}>{text}</p>;
  }
  return null;
}

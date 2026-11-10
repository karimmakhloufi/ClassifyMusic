import { useState } from 'react';

/**
 * Blind test, shown under the song card.
 *
 * Solo:
 *  - phase "blind": type the artist's name (checked with typo tolerance), or skip.
 *  - phase "place": shows whether the answer was right while the card is placed.
 * Party (unchanged):
 *  - phase "blind": everyone guesses out loud, then someone taps Reveal.
 *  - phase "award": pick who guessed right (+1 point) or "Personne".
 *  - phase "place": shows who got the point.
 */
export default function ArtistQuiz({ phase, players, awarded, artist, guess, onReveal, onAward, onGuess }) {
  const solo = players.length === 1;

  if (phase === 'blind') {
    return solo ? (
      <GuessForm onGuess={onGuess} />
    ) : (
      <div className="quiz">
        <p className="quiz-prompt">🎤 Tout le monde : qui est l'artiste ?</p>
        <button className="primary quiz-reveal" onClick={onReveal}>
          Révéler
        </button>
      </div>
    );
  }

  if (phase === 'award' && !solo) {
    return (
      <div className="quiz">
        <p className="quiz-prompt">Qui a trouvé l'artiste ?</p>
        <div className="chips quiz-choices">
          {players.map((p, i) => (
            <button key={i} className="chip award" onClick={() => onAward(i)}>
              +1 {p.name}
            </button>
          ))}
          <button className="chip none" onClick={() => onAward(null)}>
            Personne
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'place' && awarded !== undefined) {
    if (solo) {
      let text;
      if (guess?.ok) text = '🎤 Bien vu ! +1 point';
      else if (guess?.text) text = `Raté : tu as répondu « ${guess.text} », c'était ${artist}.`;
      else text = `Pas de réponse : c'était ${artist}.`;
      return <p className={`quiz-result ${guess?.ok ? '' : 'miss'}`}>{text}</p>;
    }
    const text = awarded == null ? "Personne n'a trouvé l'artiste." : `🎤 +1 point pour ${players[awarded].name}`;
    return <p className={`quiz-result ${awarded == null ? 'miss' : ''}`}>{text}</p>;
  }
  return null;
}

/** Solo: type the artist's name. */
function GuessForm({ onGuess }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    if (text.trim()) onGuess(text);
  }

  return (
    <form className="quiz guess-form" onSubmit={submit}>
      <label className="quiz-prompt" htmlFor="artist-guess">
        🎤 Qui est l'artiste ?
      </label>
      <div className="guess-row">
        <input
          id="artist-guess"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nom de l'artiste"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={60}
          autoFocus
        />
        <button type="submit" className="guess-submit" disabled={!text.trim()}>
          Valider
        </button>
      </div>
      <button type="button" className="ghost guess-skip" onClick={() => onGuess('')}>
        Je ne sais pas, passer
      </button>
    </form>
  );
}

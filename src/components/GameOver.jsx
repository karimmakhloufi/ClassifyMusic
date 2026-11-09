import { useState } from 'react';
import { useAudio } from '../hooks/useAudio.js';
import Timeline from './Timeline.jsx';

export default function GameOver({ result, best, onAgain }) {
  const audio = useAudio();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function again() {
    setBusy(true);
    setError('');
    try {
      await onAgain();
    } catch (err) {
      setError(err.message || 'Could not start a new game.');
      setBusy(false);
    }
  }

  return (
    <main className="screen over">
      <h1>{result.reason === 'exhausted' ? 'Out of songs!' : 'Game over'}</h1>
      <p className="big">
        {result.score} {result.score === 1 ? 'song' : 'songs'} placed
      </p>
      <p className="hint">{result.newBest ? 'New best score!' : `Best: ${best}`}</p>
      <div className="actions">
        <button className="primary" onClick={again} disabled={busy}>
          {busy ? 'Loading songs…' : 'Play again'}
        </button>
      </div>
      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}

      <h2>Your timeline</h2>
      <Timeline songs={result.timeline} audio={audio} />
    </main>
  );
}

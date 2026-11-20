import CategoryPicker from './CategoryPicker.jsx';
import { isDefaultSelection } from '../lib/categories.js';

export default function Menu({ best, selection, onSelectionChange, poolInfo, starting, error, onSolo, onParty }) {
  const blocked = starting || poolInfo?.tooSmall;
  return (
    <main className="screen menu">
      <h1>Timeline Tunes</h1>
      <p className="lead">
        Écoute chaque chanson et place-la au bon endroit sur la frise chronologique. Monte le son 🔊
      </p>

      <CategoryPicker selection={selection} onChange={onSelectionChange} poolInfo={poolInfo} disabled={starting} />

      <div className="mode-buttons">
        <button className="mode primary-mode" onClick={onSolo} disabled={blocked}>
          <span className="mode-icon" aria-hidden="true">
            ▶
          </span>
          <span className="mode-text">
            <span className="mode-title">{starting ? 'Chargement des chansons…' : 'Solo'}</span>
            <span className="mode-sub">Devine l'artiste, puis place la chanson. 3 vies.</span>
          </span>
        </button>
        <button className="mode" onClick={onParty} disabled={blocked}>
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
      {best > 0 && (
        <p className="hint center">
          Meilleur score solo{isDefaultSelection(selection) ? '' : ' (cette sélection)'} : {best}
        </p>
      )}
    </main>
  );
}

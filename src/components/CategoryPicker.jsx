import { ORIGINS, STYLES } from '../lib/categories.js';

/** Style chips (several allowed, none = all) and origin choice. */
export default function CategoryPicker({ selection, onChange, poolInfo, disabled }) {
  const { styles, origin } = selection;

  function toggleStyle(key) {
    const next = styles.includes(key) ? styles.filter((s) => s !== key) : [...styles, key];
    // Every style selected is the same as none: fall back to "all".
    onChange({ ...selection, styles: next.length === STYLES.length ? [] : next });
  }

  return (
    <section className="categories" aria-label="Choix des musiques">
      <div className="chips" role="group" aria-label="Styles">
        <button
          type="button"
          className="chip"
          aria-pressed={!styles.length}
          disabled={disabled}
          onClick={() => onChange({ ...selection, styles: [] })}
        >
          Tous les styles
        </button>
        {STYLES.map((s) => (
          <button
            key={s.key}
            type="button"
            className="chip"
            aria-pressed={styles.includes(s.key)}
            disabled={disabled}
            onClick={() => toggleStyle(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="segmented" role="radiogroup" aria-label="Origine">
        {ORIGINS.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={origin === o.key}
            disabled={disabled}
            onClick={() => onChange({ ...selection, origin: o.key })}
          >
            {o.key === 'all' ? 'Toutes origines' : o.label}
          </button>
        ))}
      </div>

      <p className={`hint center pool-info${poolInfo?.tooSmall ? ' error' : ''}`} aria-live="polite">
        {!poolInfo
          ? ' '
          : poolInfo.tooSmall
            ? `Seulement ${poolInfo.count} chanson${poolInfo.count > 1 ? 's' : ''} : élargis ta sélection.`
            : `${poolInfo.count} chansons`}
      </p>
    </section>
  );
}

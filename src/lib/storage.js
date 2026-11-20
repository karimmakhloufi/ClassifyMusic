import { DEFAULT_SELECTION, ORIGINS, STYLES, selectionKey } from './categories.js';

const BEST_KEY = 'tt:best'; // record with every song; other selections get their own key
const SELECTION_KEY = 'tt:categories';

const bestKey = (sel) => {
  const key = selectionKey(sel);
  return key === 'all' ? BEST_KEY : `${BEST_KEY}:${key}`;
};

export function loadBest(sel = DEFAULT_SELECTION) {
  try {
    return Number(localStorage.getItem(bestKey(sel))) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score, sel = DEFAULT_SELECTION) {
  try {
    localStorage.setItem(bestKey(sel), String(score));
  } catch {
    /* ignore */
  }
}

export function loadSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(SELECTION_KEY));
    // Drop anything that no longer exists (renamed/removed categories).
    return {
      styles: (saved?.styles ?? []).filter((s) => STYLES.some((x) => x.key === s)),
      origin: ORIGINS.some((o) => o.key === saved?.origin) ? saved.origin : 'all',
    };
  } catch {
    return DEFAULT_SELECTION;
  }
}

export function saveSelection(sel) {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(sel));
  } catch {
    /* ignore */
  }
}

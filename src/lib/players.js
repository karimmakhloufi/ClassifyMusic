// Turn and win rules for solo and party (same-device) games.
//  - Solo: 3 lives, a wrong placement costs one. Game over at 0.
//  - Party: no lives. Players take turns; first to the target score wins.

export const LIVES = 3;

/** score = total points (placements + artist guesses); artist = artist-guess points only. */
export function createPlayers(names) {
  return names.map((name) => ({ name, score: 0, artist: 0, lives: LIVES }));
}

/** Give one artist-guess point to player `index` (null = nobody guessed it). */
export function awardArtist(players, index) {
  if (index == null) return players;
  return players.map((p, i) => (i === index ? { ...p, score: p.score + 1, artist: p.artist + 1 } : p));
}

/** Apply a placement result for player `turn`. Only solo loses lives. */
export function applyPlacement(players, turn, ok) {
  const solo = players.length === 1;
  return players.map((p, i) => {
    if (i !== turn) return p;
    if (ok) return { ...p, score: p.score + 1 };
    return solo ? { ...p, lives: p.lives - 1 } : p;
  });
}

export const nextTurn = (players, turn) => (turn + 1) % players.length;

/** Index of the player in the lead (most points; ties go to the earlier player). */
export function leader(players) {
  return players.reduce((best, p, i) => (p.score > players[best].score ? i : best), 0);
}

/**
 * Has the game ended after a turn?
 * @returns {{reason: string, winner: number|null} | null}
 */
export function checkEnd(players, target) {
  if (players.length === 1) {
    return players[0].lives === 0 ? { reason: 'lives', winner: null } : null;
  }
  // Artist points can push anyone (not just the placer) over the target.
  if (players.some((p) => p.score >= target)) return { reason: 'target', winner: leader(players) };
  return null;
}

/** Players sorted for the final standings. */
export function standings(players) {
  return players.map((p, i) => ({ ...p, index: i })).sort((a, b) => b.score - a.score || a.index - b.index);
}

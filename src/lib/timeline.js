// Pure game rules. A timeline is sorted oldest -> newest; equal years may go either way.

/** Is inserting `year` at slot `index` (0..timeline.length) chronologically valid? */
export function isCorrectSlot(timeline, index, year) {
  const before = timeline[index - 1];
  const after = timeline[index];
  return (!before || before.year <= year) && (!after || year <= after.year);
}

/** A valid slot for `year` (after any songs from the same year). */
export function correctSlot(timeline, year) {
  const i = timeline.findIndex((s) => s.year > year);
  return i === -1 ? timeline.length : i;
}

export function insertAt(timeline, index, item) {
  return [...timeline.slice(0, index), item, ...timeline.slice(index)];
}

/**
 * Tiny shared state so page-level animations (e.g. the hero entrance) can wait until the
 * transition curtain has opened instead of playing unseen underneath it.
 */
let covered = typeof document !== 'undefined' && document.documentElement.classList.contains('is-intro');
const waiters = new Set();

export function setCovered(value) {
  covered = value;
  if (!value) {
    const callbacks = [...waiters];
    waiters.clear();
    callbacks.forEach((callback) => callback());
  }
}

/** Runs `callback` once the curtain is open (immediately if it already is). Returns a cancel function. */
export function onPageReady(callback) {
  if (!covered) {
    callback();
    return () => {};
  }
  waiters.add(callback);
  return () => waiters.delete(callback);
}

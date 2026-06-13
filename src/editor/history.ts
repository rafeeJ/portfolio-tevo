// Pure undo/redo over an immutable `present` value. The editor checkpoints at
// gesture boundaries (drag-start, resize-start, before each discrete edit), then
// freely replaces `present` during the gesture — so one gesture = one undo step,
// not one per pointer-move. No React/DOM here — unit-tested in history.test.ts.

export const HISTORY_LIMIT = 100;

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/** Mark a restore point: remember the current `present`, drop the redo stack. */
export function checkpoint<T>(h: History<T>): History<T> {
  return {
    past: [...h.past, h.present].slice(-HISTORY_LIMIT),
    present: h.present,
    future: [],
  };
}

/** Replace `present` without touching history (live updates within a gesture). */
export function setPresent<T>(h: History<T>, present: T): History<T> {
  return { ...h, present };
}

export function undo<T>(h: History<T>): History<T> {
  if (h.past.length === 0) return h;
  return {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
  };
}

export function redo<T>(h: History<T>): History<T> {
  if (h.future.length === 0) return h;
  return {
    past: [...h.past, h.present],
    present: h.future[0],
    future: h.future.slice(1),
  };
}

export const canUndo = <T>(h: History<T>): boolean => h.past.length > 0;
export const canRedo = <T>(h: History<T>): boolean => h.future.length > 0;

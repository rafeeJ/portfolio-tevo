import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  checkpoint,
  HISTORY_LIMIT,
  initHistory,
  redo,
  setPresent,
  undo,
} from "../src/editor/history";

// Model `present` as a simple string; the history logic is value-agnostic.
const start = () => initHistory("a");

describe("history", () => {
  it("starts with no undo/redo available", () => {
    const h = start();
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("checkpoint + setPresent makes one undoable step", () => {
    let h = start();
    h = setPresent(checkpoint(h), "b");
    expect(h.present).toBe("b");
    expect(canUndo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toBe("a");
    expect(canRedo(h)).toBe(true);
  });

  it("setPresent without checkpoint does NOT add an undo step (gesture coalescing)", () => {
    let h = start();
    h = checkpoint(h);
    h = setPresent(h, "b");
    h = setPresent(h, "c"); // live updates within one gesture
    expect(h.past).toHaveLength(1);
    h = undo(h);
    expect(h.present).toBe("a"); // one undo jumps back past the whole gesture
  });

  it("redo replays an undone change", () => {
    let h = setPresent(checkpoint(start()), "b");
    h = undo(h);
    h = redo(h);
    expect(h.present).toBe("b");
    expect(canRedo(h)).toBe(false);
  });

  it("a new checkpoint clears the redo stack", () => {
    let h = setPresent(checkpoint(start()), "b");
    h = undo(h); // present 'a', future ['b']
    h = setPresent(checkpoint(h), "c"); // new branch
    expect(canRedo(h)).toBe(false);
    expect(h.present).toBe("c");
  });

  it("undo on empty past is a no-op", () => {
    const h = start();
    expect(undo(h)).toBe(h);
  });

  it("caps the past at HISTORY_LIMIT", () => {
    let h = start();
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) h = setPresent(checkpoint(h), String(i));
    expect(h.past.length).toBe(HISTORY_LIMIT);
  });
});

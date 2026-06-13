import { describe, expect, it } from "vitest";
import { blockToRecord, rowToBlock } from "../src/lib/map";
import type { BlockRow } from "../src/db/schema";
import type { Block } from "../src/lib/types";

describe("blockToRecord", () => {
  it("serializes a text block's align into style JSON", () => {
    const block: Block = {
      id: "t",
      type: "heading",
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      z: 5,
      text: "Hi",
      align: "center",
    };
    const rec = blockToRecord(block, "page1");
    expect(rec).toMatchObject({
      id: "t",
      page_id: "page1",
      type: "heading",
      text: "Hi",
      image_id: null,
      style: JSON.stringify({ align: "center" }),
    });
  });

  it("stores image_id and null style for image blocks", () => {
    const block: Block = {
      id: "i",
      type: "image",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      z: 0,
      imageId: "img1",
    };
    const rec = blockToRecord(block, "p");
    expect(rec.image_id).toBe("img1");
    expect(rec.style).toBeNull();
    expect(rec.text).toBeNull();
  });

  it("round-trips through rowToBlock (record -> row -> block)", () => {
    const block: Block = {
      id: "t",
      type: "body",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      z: 1,
      text: "body",
      align: "right",
      imageId: null,
    };
    const rec = blockToRecord(block, "p");
    const row: BlockRow = { ...rec, created_at: 0, updated_at: 0 };
    expect(rowToBlock(row)).toEqual(block);
  });
});

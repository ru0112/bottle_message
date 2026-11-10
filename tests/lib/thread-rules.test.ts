import { describe, expect, it } from "vitest";
import { canPostReply } from "../../lib/thread-rules";

describe("thread reply rules", () => {
  it("allows the next reply from the other participant", () => {
    expect(canPostReply(0, "other")).toBe(true);
    expect(canPostReply(1, "other")).toBe(true);
    expect(canPostReply(2, "other")).toBe(true);
  });

  it("rejects consecutive replies from the same participant", () => {
    expect(canPostReply(1, "you")).toBe(false);
    expect(canPostReply(2, "you")).toBe(false);
  });

  it("rejects a fourth reply after the three-reply limit", () => {
    expect(canPostReply(3, "other")).toBe(false);
    expect(canPostReply(3, "you")).toBe(false);
  });

  it("rejects invalid reply counts", () => {
    expect(canPostReply(-1, "other")).toBe(false);
    expect(canPostReply(1.5, "other")).toBe(false);
  });
});

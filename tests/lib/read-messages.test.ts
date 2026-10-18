import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getReadMessageIds, markMessageAsRead } from "../../lib/read-messages";

const READ_MESSAGE_IDS_KEY = "bottle-message-read-message-ids";
const firstId = "550e8400-e29b-41d4-a716-446655440000";
const secondId = "550e8400-e29b-41d4-a716-446655440001";

describe("read message storage", () => {
  let storedValue: string | null;
  let localStorage: Storage;

  beforeEach(() => {
    storedValue = null;
    localStorage = {
      getItem: vi.fn((key: string) =>
        key === READ_MESSAGE_IDS_KEY ? storedValue : null,
      ),
      setItem: vi.fn((key: string, value: string) => {
        if (key === READ_MESSAGE_IDS_KEY) {
          storedValue = value;
        }
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(() => null),
      get length() {
        return storedValue === null ? 0 : 1;
      },
    };
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty list when no IDs have been stored", () => {
    expect(getReadMessageIds()).toEqual([]);
  });

  it("reads stored IDs and removes duplicates", () => {
    storedValue = JSON.stringify([firstId, secondId, firstId]);

    expect(getReadMessageIds()).toEqual([firstId, secondId]);
  });

  it("records a received message ID", () => {
    markMessageAsRead(firstId);

    expect(storedValue).toBe(JSON.stringify([firstId]));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      READ_MESSAGE_IDS_KEY,
      JSON.stringify([firstId]),
    );
  });

  it("does not store the same ID twice", () => {
    storedValue = JSON.stringify([firstId]);

    markMessageAsRead(firstId);

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(getReadMessageIds()).toEqual([firstId]);
  });

  it("rejects malformed stored data", () => {
    storedValue = "{";

    expect(() => getReadMessageIds()).toThrow(
      "既読メッセージIDの保存データを読み込めませんでした。",
    );
  });

  it("rejects stored values that are not UUID arrays", () => {
    storedValue = JSON.stringify([firstId, "not-a-uuid"]);

    expect(() => getReadMessageIds()).toThrow(
      "既読メッセージIDの保存データが不正です。",
    );
  });

  it("surfaces localStorage write errors", () => {
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(() => markMessageAsRead(firstId)).toThrow("storage unavailable");
  });

  it("rejects an invalid message ID before writing it", () => {
    expect(() => markMessageAsRead("not-a-uuid")).toThrow(
      "メッセージIDが不正です。",
    );
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});

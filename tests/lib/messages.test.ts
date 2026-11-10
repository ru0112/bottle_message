import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    auth: { getUser: supabaseMocks.getUser },
    from: supabaseMocks.from,
    rpc: supabaseMocks.rpc,
  }),
}));

import {
  createMessage,
  createMessageReply,
  getMessageHistory,
  getRandomMessage,
} from "../../lib/messages";

const userId = "550e8400-e29b-41d4-a716-446655440000";

describe("authenticated message operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
    supabaseMocks.insert.mockResolvedValue({ error: null });
    supabaseMocks.from.mockReturnValue({ insert: supabaseMocks.insert });
    supabaseMocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it("saves the message with the authenticated user's ID", async () => {
    await createMessage("  hello  ");

    expect(supabaseMocks.from).toHaveBeenCalledWith("messages");
    expect(supabaseMocks.insert).toHaveBeenCalledWith({
      content: "hello",
      user_id: userId,
    });
  });

  it("rejects posting when no user is signed in", async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(createMessage("hello")).rejects.toThrow(
      "メッセージを流すにはログインが必要です。",
    );
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("treats a missing auth session as a login requirement", async () => {
    const error = new Error("Auth session missing!");
    error.name = "AuthSessionMissingError";
    supabaseMocks.getUser.mockRejectedValue(error);

    await expect(createMessage("hello")).rejects.toThrow(
      "メッセージを流すにはログインが必要です。",
    );
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("does not let callers supply an identity to random-message retrieval", async () => {
    const excludedIds = ["550e8400-e29b-41d4-a716-446655440001"];

    await getRandomMessage(excludedIds);

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("get_random_message", {
      p_excluded_ids: excludedIds,
    });
  });

  it("creates replies through the database-validated RPC", async () => {
    await createMessageReply(
      "550e8400-e29b-41d4-a716-446655440002",
      "  reply  ",
    );

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("create_message_reply", {
      p_message_id: "550e8400-e29b-41d4-a716-446655440002",
      p_content: "reply",
    });
  });

  it("surfaces database reply-rule errors", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("相手の返信を待ってから送信してください。"),
    });

    await expect(
      createMessageReply("550e8400-e29b-41d4-a716-446655440002", "reply"),
    ).rejects.toThrow("相手の返信を待ってから送信してください。");
  });

  it("requests only the signed-in user's selected history", async () => {
    await getMessageHistory("received");

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("get_message_history", {
      p_direction: "received",
    });
  });

  it("surfaces Supabase errors", async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("auth unavailable"),
    });

    await expect(createMessage("hello")).rejects.toThrow("auth unavailable");
  });
});

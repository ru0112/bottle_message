import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type ReceivedMessage = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "content" | "created_at"
>;

export async function createMessage(
  content: string,
  userId: string,
): Promise<void> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("メッセージを入力してください。");
  }

  const { error } = await getSupabaseClient()
    .from("messages")
    .insert({ content: trimmedContent, user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getRandomMessage(
  userId: string,
): Promise<ReceivedMessage | null> {
  const { data, error } = await getSupabaseClient().rpc("get_random_message", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data[0] ?? null;
}

import { getSupabaseClient } from "@/lib/supabase/client";
import { isAuthSessionMissingError } from "@/lib/supabase/auth-errors";
import type { Database } from "@/types/database";

export type ReceivedMessage = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "content" | "created_at"
>;

export async function createMessage(content: string): Promise<void> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("メッセージを入力してください。");
  }

  const supabase = getSupabaseClient();
  let user;
  try {
    const {
      data: { user: authenticatedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError && !isAuthSessionMissingError(authError)) {
      throw authError;
    }
    user = authenticatedUser;
  } catch (error) {
    if (isAuthSessionMissingError(error)) {
      throw new Error("メッセージを流すにはログインが必要です。");
    }
    throw new Error(
      error instanceof Error ? error.message : "ユーザーを確認できませんでした。",
    );
  }

  if (!user) {
    throw new Error("メッセージを流すにはログインが必要です。");
  }

  const { error } = await supabase
    .from("messages")
    .insert({ content: trimmedContent, user_id: user.id });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getRandomMessage(
  excludedMessageIds: string[],
): Promise<ReceivedMessage | null> {
  const { data, error } = await getSupabaseClient().rpc("get_random_message", {
    p_excluded_ids: excludedMessageIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data[0] ?? null;
}

import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import type { MessageThreadEntry } from "@/lib/messages";
import { isAuthSessionMissingError } from "@/lib/supabase/auth-errors";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MessageThread from "./message-thread";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center px-5 py-8 text-sm text-cyan-100/70">
        Supabaseの接続設定がありません。.env.localを確認してください。
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-5 py-8 text-sm text-cyan-100/70">
          スレッドを読み込んでいます...
        </main>
      }
    >
      <MessageThreadContent params={params} />
    </Suspense>
  );
}

async function MessageThreadContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }
  await connection();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && !isAuthSessionMissingError(authError)) {
    throw authError;
  }
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.rpc("get_message_thread", {
    p_message_id: id,
  });
  if (error) {
    throw new Error(error.message);
  }
  const entries: MessageThreadEntry[] = data;
  if (entries.length === 0) {
    notFound();
  }

  return <MessageThread entries={entries} />;
}

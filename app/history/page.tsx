import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { isAuthSessionMissingError } from "@/lib/supabase/auth-errors";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageHistoryItem } from "@/lib/messages";
import HistoryTabs from "./history-tabs";

export default function HistoryPage() {
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
          履歴を読み込んでいます...
        </main>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}

async function HistoryContent() {
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
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
        <Link className="text-sm text-cyan-100/80 hover:text-white" href="/">
          ← ホームへ戻る
        </Link>
        <section className="glass-panel mt-12 rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-medium text-white">送受信履歴</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300/75">
            履歴を見るにはログインしてください。
          </p>
          <Link
            className="send-button mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-slate-950"
            href="/login"
          >
            ログイン
          </Link>
        </section>
      </main>
    );
  }

  const [sentResult, receivedResult] = await Promise.all([
    supabase.rpc("get_message_history", { p_direction: "sent" }),
    supabase.rpc("get_message_history", { p_direction: "received" }),
  ]);

  if (sentResult.error) {
    throw new Error(sentResult.error.message);
  }
  if (receivedResult.error) {
    throw new Error(receivedResult.error.message);
  }

  const sentMessages: MessageHistoryItem[] = sentResult.data;
  const receivedMessages: MessageHistoryItem[] = receivedResult.data;

  return (
    <main className="min-h-screen px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div className="ocean-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem]" />
      <div className="mx-auto w-full max-w-4xl">
        <Link
          className="flex w-fit items-center gap-3"
          href="/"
          aria-label="漂流瓶 ホーム"
        >
          <span className="brand-mark" aria-hidden="true">
            瓶
          </span>
          <span className="text-lg font-semibold tracking-[0.14em]">
            漂流瓶
          </span>
        </Link>
        <section className="mt-12">
          <p className="text-xs tracking-[0.18em] text-cyan-100/65">
            YOUR MESSAGE THREADS
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-wider text-white">
            履歴
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300/70">
            あなたが海に流した手紙と、返信した手紙のスレッドです。
          </p>
          <HistoryTabs sentMessages={sentMessages} receivedMessages={receivedMessages} />
        </section>
      </div>
    </main>
  );
}

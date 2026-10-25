"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();
  const callbackFailed = searchParams.get("error") === "callback";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || isSending || !configured) {
      return;
    }

    setStatus(null);
    setError(null);
    setIsSending(true);

    try {
      const { error: authError } = await getSupabaseClient().auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        throw authError;
      }

      setStatus("認証用のメールを送信しました。メール内のリンクからログインしてください。");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "認証メールを送信できませんでした。",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div className="ocean-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem]" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <header>
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
        </header>

        <section className="glass-panel mx-auto my-auto w-full max-w-md rounded-[1.75rem] p-6 sm:p-8">
          <p className="text-xs tracking-[0.18em] text-cyan-100/65">
            SIGN IN OR CREATE ACCOUNT
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-wider text-white">
            メールでログイン
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300/75">
            メールアドレスは認証にのみ使用され、プロフィールや投稿に表示されません。
          </p>

          {callbackFailed && (
            <p
              className="mt-5 rounded-xl border border-rose-200/20 bg-rose-100/[0.06] px-4 py-3 text-sm leading-6 text-rose-100/90"
              role="alert"
            >
              認証リンクを確認できませんでした。新しいリンクをお試しください。
            </p>
          )}
          {!configured && (
            <p
              className="mt-5 rounded-xl border border-amber-200/20 bg-amber-100/[0.06] px-4 py-3 text-sm leading-6 text-amber-100/80"
              role="status"
            >
              Supabaseの接続設定がありません。.env.localに必要な環境変数を設定してください。
            </p>
          )}
          {status && (
            <p
              className="mt-5 rounded-xl border border-cyan-100/20 bg-cyan-100/[0.06] px-4 py-3 text-sm leading-6 text-cyan-50/90"
              role="status"
            >
              {status}
            </p>
          )}
          {error && (
            <p
              className="mt-5 rounded-xl border border-rose-200/20 bg-rose-100/[0.06] px-4 py-3 text-sm leading-6 text-rose-100/90"
              role="alert"
            >
              {error}
            </p>
          )}

          <form className="mt-6" onSubmit={handleSubmit}>
            <label
              className="mb-2 block text-sm text-slate-200/80"
              htmlFor="email"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={!configured || isSending}
              className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400/45 focus:border-cyan-200/45 focus:ring-2 focus:ring-cyan-200/10 disabled:opacity-50"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={!configured || isSending || !email.trim()}
              className="send-button mt-5 flex w-full items-center justify-center rounded-xl px-5 py-4 text-sm font-semibold tracking-[0.08em] text-slate-950 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSending ? "送信しています..." : "認証メールを送信"}
            </button>
          </form>
          <Link
            className="mt-6 inline-block text-sm text-cyan-100/75 underline-offset-4 hover:underline"
            href="/"
          >
            ホームへ戻る
          </Link>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { getAnonymousUserId } from "@/lib/anonymous-user";
import { createMessage, getRandomMessage } from "@/lib/messages";
import type { ReceivedMessage } from "@/lib/messages";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "原因を特定できませんでした。";
}

export default function Home() {
  const [content, setContent] = useState("");
  const [receivedMessage, setReceivedMessage] =
    useState<ReceivedMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [hasPosted, setHasPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = content.trim();

    if (!message || isSending || isReceiving || !isSupabaseConfigured) {
      return;
    }

    setError(null);
    setReceiveError(null);
    setReceivedMessage(null);
    setHasPosted(false);
    setIsSending(true);

    let userId: string;
    try {
      userId = getAnonymousUserId();
    } catch (caughtError) {
      setError(`匿名IDを準備できませんでした。${errorMessage(caughtError)}`);
      setIsSending(false);
      return;
    }

    try {
      await createMessage(message, userId);
    } catch (caughtError) {
      setError(`メッセージを保存できませんでした。${errorMessage(caughtError)}`);
      setIsSending(false);
      return;
    }

    setContent("");
    setHasPosted(true);
    setIsSending(false);
    setIsReceiving(true);

    try {
      setReceivedMessage(await getRandomMessage(userId));
    } catch (caughtError) {
      setReceiveError(
        `投稿は保存されましたが、受信メッセージを取得できませんでした。${errorMessage(caughtError)}`,
      );
    } finally {
      setIsReceiving(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div className="ocean-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem]" />
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            className="flex items-center gap-3"
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
          <span className="hidden text-xs tracking-[0.2em] text-cyan-100/55 sm:block">
            A MESSAGE ACROSS THE SEA
          </span>
        </header>

        <section className="mx-auto mt-16 grid w-full max-w-4xl gap-10 lg:mt-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.06] px-4 py-2 text-xs tracking-[0.12em] text-cyan-100/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_2px_rgba(103,232,249,0.6)]" />
              どこかの誰かへ
            </div>
            <h1 className="text-4xl font-medium leading-[1.35] tracking-[0.08em] text-white sm:text-5xl">
              あなたの言葉を、
              <br />
              <span className="text-cyan-100">海へ。</span>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-sm leading-8 text-slate-300/75 lg:mx-0">
              何気ないことも、胸にしまっていたことも。
              <br className="hidden sm:block" />
              瓶に詰めて流せば、思いがけない誰かに届くかもしれません。
            </p>
            <div className="mt-9 hidden items-center gap-3 text-xs tracking-[0.08em] text-slate-300/45 lg:flex">
              <span aria-hidden="true">✦</span>
              名前もログインも必要ありません
            </div>
          </div>

          <div className="glass-panel rounded-[1.75rem] p-5 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.18em] text-cyan-100/65">
                  WRITE A MESSAGE
                </p>
                <h2 className="mt-2 text-xl font-medium tracking-wider text-white">
                  海へ流す
                </h2>
              </div>
              <span className="bottle-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                  <path
                    d="M19 5h10v7l4 4v23a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V16l4-4V5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M19 5h10v5H19z" fill="currentColor" opacity=".42" />
                  <path
                    d="M17 25c4-2 10 2 16 0M17 30c4-2 10 2 16 0"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.4"
                    opacity=".75"
                  />
                </svg>
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="message">
                流すメッセージ
              </label>
              <textarea
                id="message"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="今、心に浮かんだことを書いてみてください..."
                rows={6}
                required
                disabled={isSending || isReceiving || !isSupabaseConfigured}
                className="message-input w-full resize-y rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-400/45 focus:border-cyan-200/45 focus:ring-2 focus:ring-cyan-200/10 disabled:opacity-50"
              />
              <div className="mt-2 flex justify-between text-[11px] text-slate-300/45">
                <span>あなたを特定する情報は表示されません</span>
                <span>{content.length}字</span>
              </div>

              {!isSupabaseConfigured && (
                <p
                  className="mt-4 rounded-xl border border-amber-200/20 bg-amber-100/[0.06] px-4 py-3 text-xs leading-6 text-amber-100/80"
                  role="status"
                >
                  Supabaseの接続設定がありません。.env.localに必要な環境変数を設定してください。
                </p>
              )}
              {error && (
                <p
                  className="mt-4 rounded-xl border border-rose-200/20 bg-rose-100/[0.06] px-4 py-3 text-xs leading-6 text-rose-100/90"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  isSending ||
                  isReceiving ||
                  !isSupabaseConfigured ||
                  content.trim().length === 0
                }
                className="send-button mt-5 flex w-full items-center justify-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold tracking-[0.12em] text-slate-950 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSending
                  ? "瓶に手紙を詰めています..."
                  : isReceiving
                    ? "手紙を探しています..."
                    : "海へ流す"}
                {!isSending && !isReceiving && (
                  <span aria-hidden="true">↗</span>
                )}
              </button>
            </form>
          </div>
        </section>

        <section
          aria-live="polite"
          aria-atomic="true"
          className="mx-auto mt-10 w-full max-w-4xl"
        >
          {isReceiving && (
            <div className="glass-panel rounded-2xl px-6 py-5 text-center text-sm text-cyan-100/75">
              波に乗って届く手紙を探しています...
            </div>
          )}
          {receiveError && (
            <p
              className="rounded-xl border border-rose-200/20 bg-rose-100/[0.06] px-4 py-3 text-sm leading-6 text-rose-100/90"
              role="alert"
            >
              {receiveError}
            </p>
          )}
          {hasPosted && !isReceiving && !receiveError && (
            <div className="grid gap-4 sm:grid-cols-[0.75fr_1.25fr]">
              <div className="glass-panel flex flex-col justify-center rounded-2xl p-6">
                <span className="text-xs tracking-[0.16em] text-cyan-100/60">
                  MESSAGE SENT
                </span>
                <p className="mt-3 text-lg font-medium text-white">
                  手紙を流しました
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300/65">
                  あなたの言葉が、海を漂いはじめました。
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-6 sm:p-7">
                <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-cyan-100/65">
                  <span aria-hidden="true">✦</span>
                  A MESSAGE FOR YOU
                </div>
                {receivedMessage ? (
                  <blockquote className="mt-5 whitespace-pre-wrap break-words text-base leading-8 text-white/90">
                    {receivedMessage.content}
                  </blockquote>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-slate-300/70">
                    まだ受け取れる手紙がありません。
                    <br />
                    誰かの言葉が海に流れてくるまで、少し待ってみてください。
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <footer className="mt-auto pt-16 text-center text-[11px] tracking-[0.12em] text-slate-400/35">
          <p>ひとつの言葉が、誰かの夜を照らしますように。</p>
        </footer>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/supabase/email-otp";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();
  const callbackFailed = searchParams.get("error") === "callback";

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function sendCode(isResend: boolean) {
    if (!email.trim() || isSending || !configured) {
      return;
    }

    setError(null);
    setStatus(null);
    setIsSending(true);

    try {
      await sendEmailOtp(email.trim());
      setToken("");
      setStep("code");
      setResendCooldown(30);
      setStatus(
        isResend
          ? "新しい認証コードをメールで送信しました。"
          : "6桁の認証コードをメールで送信しました。",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "認証コードを送信できませんでした。",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendCode(false);
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedToken = token.trim();
    if (!/^\d{6}$/.test(normalizedToken) || isVerifying || !configured) {
      setError("メールに記載された6桁の認証コードを入力してください。");
      return;
    }

    setError(null);
    setStatus(null);
    setIsVerifying(true);

    try {
      await verifyEmailOtp(email.trim(), normalizedToken);
      router.replace("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `認証コードが正しくないか、有効期限が切れています。${caughtError.message}`
          : "認証コードが正しくないか、有効期限が切れています。もう一度お試しください。",
      );
    } finally {
      setIsVerifying(false);
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

          {step === "email" ? (
            <form className="mt-6" onSubmit={handleEmailSubmit}>
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
                {isSending ? "送信しています..." : "6桁の認証コードを送信"}
              </button>
            </form>
          ) : (
            <form className="mt-6" onSubmit={handleCodeSubmit}>
              <p className="text-sm leading-7 text-slate-200/80">
                <span className="font-medium text-white">{email}</span>
                に届いた6桁のコードを入力してください。
              </p>
              <label
                className="mb-2 mt-5 block text-sm text-slate-200/80"
                htmlFor="token"
              >
                認証コード
              </label>
              <input
                id="token"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={token}
                onChange={(event) =>
                  setToken(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                disabled={!configured || isVerifying}
                aria-describedby="otp-resend-status"
                className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-center text-xl tracking-[0.5em] text-white outline-none transition placeholder:text-slate-400/45 focus:border-cyan-200/45 focus:ring-2 focus:ring-cyan-200/10 disabled:opacity-50"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={
                  !configured || isVerifying || token.length !== 6
                }
                className="send-button mt-5 flex w-full items-center justify-center rounded-xl px-5 py-4 text-sm font-semibold tracking-[0.08em] text-slate-950 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isVerifying ? "確認しています..." : "コードを確認してログイン"}
              </button>
              <div
                id="otp-resend-status"
                className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <button
                  type="button"
                  onClick={() => void sendCode(true)}
                  disabled={!configured || isSending || resendCooldown > 0}
                  className="text-cyan-100/80 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-slate-400/50"
                >
                  {isSending
                    ? "再送信しています..."
                    : resendCooldown > 0
                      ? `コードを再送信 (${resendCooldown}秒)`
                      : "コードを再送信"}
                </button>
              </div>
            </form>
          )}
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

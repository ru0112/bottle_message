"use client";

import Link from "next/link";
import { useState } from "react";
import type { MessageHistoryItem } from "@/lib/messages";

type HistoryTabsProps = {
  sentMessages: MessageHistoryItem[];
  receivedMessages: MessageHistoryItem[];
};

const statusLabels: Record<MessageHistoryItem["status"], string> = {
  waiting: "返信待ち",
  reply_received: "相手の返信あり",
  ended: "やり取り終了",
};

export default function HistoryTabs({
  sentMessages,
  receivedMessages,
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const messages = activeTab === "sent" ? sentMessages : receivedMessages;

  return (
    <div className="mt-8">
      <div className="flex gap-2 border-b border-white/10" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sent"}
          aria-controls="history-list"
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-3 text-sm transition ${
            activeTab === "sent"
              ? "border-b-2 border-cyan-200 text-cyan-100"
              : "text-slate-300/60 hover:text-white"
          }`}
        >
          送信したメッセージ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "received"}
          aria-controls="history-list"
          onClick={() => setActiveTab("received")}
          className={`px-4 py-3 text-sm transition ${
            activeTab === "received"
              ? "border-b-2 border-cyan-200 text-cyan-100"
              : "text-slate-300/60 hover:text-white"
          }`}
        >
          返信したメッセージ
        </button>
      </div>

      <div id="history-list" role="tabpanel" className="mt-5">
        {messages.length === 0 ? (
          <div className="glass-panel rounded-2xl px-6 py-10 text-center text-sm text-slate-300/70">
            まだメッセージはありません。
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li key={message.message_id}>
                <Link
                  className="glass-panel block rounded-2xl p-5 transition hover:border-cyan-100/30"
                  href={`/messages/${message.message_id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${
                        message.status === "ended"
                          ? "border-slate-300/20 text-slate-300/65"
                          : message.status === "reply_received"
                            ? "border-cyan-100/30 text-cyan-100"
                            : "border-amber-100/25 text-amber-100/80"
                      }`}
                    >
                      {statusLabels[message.status]}
                    </span>
                    <time
                      className="text-xs text-slate-300/45"
                      dateTime={message.updated_at}
                    >
                      {new Intl.DateTimeFormat("ja-JP", {
                        timeZone: "Asia/Tokyo",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(message.updated_at))}
                    </time>
                  </div>
                  <p className="mt-4 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-7 text-white/90">
                    {message.content}
                  </p>
                  {message.latest_content !== message.content && (
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-6 text-slate-300/60">
                      最新の返信: {message.latest_content}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] text-slate-400/50">
                    返信 {message.reply_count}/3
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        className="mt-8 inline-flex text-sm text-cyan-100/75 underline-offset-4 hover:underline"
        href="/"
      >
        ホームへ戻る
      </Link>
    </div>
  );
}

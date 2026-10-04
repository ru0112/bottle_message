import React, { useState, useEffect } from 'react';
import { X, Heart, Send, CheckCircle2, Waves } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ReceivedBottleItem } from '../types';
import { replyBottle } from '../api';
import { soundManager } from '../utils/audio';

interface Props {
  bottle: ReceivedBottleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReplySuccess?: () => void;
}

const REACTIONS = [
  { emoji: '🌊', label: '穏やかな波' },
  { emoji: '🌙', label: '月明かり' },
  { emoji: '🐚', label: '貝殻' },
  { emoji: '✨', label: '星の光' },
  { emoji: '💌', label: '届いたよ' },
  { emoji: '🕊️', label: '安らぎ' },
];

export const BottleReceiveModal: React.FC<Props> = ({ bottle, isOpen, onClose, onReplySuccess }) => {
  const [selectedReaction, setSelectedReaction] = useState<string>('🌊');
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReplied, setHasReplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bottle) {
      soundManager.playCorkPop();
      if (bottle.replyContent || bottle.replyReaction) {
        setHasReplied(true);
        if (bottle.replyReaction) setSelectedReaction(bottle.replyReaction);
        if (bottle.replyContent) setReplyText(bottle.replyContent);
      } else {
        setHasReplied(false);
        setReplyText('');
        setIsReplying(false);
      }
    }
  }, [isOpen, bottle]);

  if (!isOpen || !bottle) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !selectedReaction) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await replyBottle(bottle.exchangeId, replyText, selectedReaction);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa'],
      });
      soundManager.playChime();

      setHasReplied(true);
      setIsReplying(false);
      if (onReplySuccess) onReplySuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'お返事の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg animate-drift-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Parchment Box */}
        <div className="parchment parchment-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top Banner */}
          <div className="flex items-center justify-between border-b border-[#c8b58f]/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍾</span>
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#3d2f21] tracking-wide">
                  波打ち際に届いた手紙
                </h2>
                <span className="text-[11px] text-[#786149]">
                  {formatDate(bottle.createdAt)} に流されたボトル
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-900/10 border border-cyan-800/20 text-cyan-900 text-xs font-medium">
              <Waves className="w-3.5 h-3.5" />
              <span>漂着</span>
            </div>
          </div>

          {/* Letter Content */}
          <div className="my-5 p-5 sm:p-6 bg-[#f7f2e4] rounded-xl border border-[#d8caa6]/80 shadow-inner font-serif text-[#2c2217] leading-relaxed sm:text-base text-sm whitespace-pre-wrap min-h-[120px] max-h-[280px] overflow-y-auto">
            {bottle.content}
          </div>

          {/* Reply Section */}
          <div className="pt-2 border-t border-[#c8b58f]/60">
            {hasReplied ? (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[#3d2f21]">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>お返事・リアクションを海に返しました（1往復完了）</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="text-2xl">{selectedReaction}</span>
                  {replyText && (
                    <p className="text-xs text-[#523e2a] font-serif bg-white/70 p-2.5 rounded-lg border border-amber-200/60 flex-1">
                      「{replyText}」
                    </p>
                  )}
                </div>
              </div>
            ) : isReplying ? (
              <form onSubmit={handleSendReply} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-medium text-[#4a3a29]">
                    1度だけのお礼を返す（リアクション・メッセージ）:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReplying(false)}
                    className="text-xs text-[#786149] hover:underline"
                  >
                    キャンセル
                  </button>
                </div>

                {/* Reaction Selector */}
                <div className="flex items-center gap-2 justify-between bg-[#f1ebd9] p-2 rounded-xl border border-[#d8caa6]">
                  {REACTIONS.map((r) => (
                    <button
                      key={r.emoji}
                      type="button"
                      onClick={() => setSelectedReaction(r.emoji)}
                      title={r.label}
                      className={`text-xl p-1.5 rounded-lg transition-all ${
                        selectedReaction === r.emoji
                          ? 'bg-amber-200 scale-125 shadow-sm border border-amber-400'
                          : 'hover:bg-amber-100 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={100}
                    placeholder="温かいお礼や一言メッセージ（任意）"
                    className="w-full p-3 pr-16 rounded-xl bg-[#fdfbf6] border border-[#d8caa6] text-[#2c2217] placeholder-[#a49177] text-xs font-serif focus:outline-none focus:ring-2 focus:ring-amber-700/40"
                  />
                  <div className="absolute right-3 top-3 text-[10px] text-[#8c745b]">
                    {replyText.length}/100
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 text-xs font-serif font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-amber-900/20"
                >
                  {isSubmitting ? (
                    <span>波に乗せて送信中...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>お礼を小瓶に入れて海へ返す</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#6e563f] font-serif">
                  この手紙の贈り主にお礼を送りますか？
                </span>
                <button
                  onClick={() => setIsReplying(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 hover:from-amber-800 hover:to-amber-950 transition-all font-serif text-xs font-medium shadow-md hover:scale-105 active:scale-95"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                  <span>お礼を返す</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

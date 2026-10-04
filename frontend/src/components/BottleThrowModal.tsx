import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { throwBottle } from '../api';
import { soundManager } from '../utils/audio';
import type { ReceivedBottleItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (received: ReceivedBottleItem | undefined) => void;
}

export const BottleThrowModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('メッセージを入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Trigger throwing animation & sounds
      setIsAnimating(true);
      soundManager.playSplash();

      const response = await throwBottle(content);

      // Wait for the bottle to drift away before switching
      setTimeout(() => {
        setIsAnimating(false);
        setIsSubmitting(false);
        setContent('');
        soundManager.playChime();
        onSuccess(response.receivedBottle);
      }, 1600);
    } catch (err: unknown) {
      setIsAnimating(false);
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-lg transition-all duration-700 ${isAnimating ? 'animate-drift-away' : 'scale-100'}`}>
        
        {/* Close Button */}
        {!isSubmitting && (
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Parchment Box */}
        <div className="parchment parchment-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#c8b58f]/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#3d2f21] tracking-wide">
                ボトルに手紙を詰める
              </h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#7c6248] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>完全匿名</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#634e3a] mb-4 leading-relaxed">
            海へ流した手紙は、日本のどこかにいる誰かの元へ流れ着きます。
            同時に、あなたにも誰かが流したボトルが1通漂着します。
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100/90 border border-red-300 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                maxLength={800}
                rows={6}
                placeholder="夜の独り言、誰かに聞いてほしい話、今日あったこと、温かい言葉...&#10;素直な気持ちを自由に綴ってみましょう。"
                className="w-full p-4 rounded-xl bg-[#fdfbf6]/90 border border-[#d8caa6] text-[#2c2217] placeholder-[#a49177] focus:outline-none focus:ring-2 focus:ring-amber-700/40 font-serif leading-relaxed text-sm resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-[#8c745b]">
                {content.length} / 800字
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#806951] italic">
                ※個人情報は書かないようご注意ください
              </span>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-serif font-medium text-sm transition-all shadow-lg ${
                  isSubmitting || !content.trim()
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-50 hover:shadow-amber-900/30 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
                    <span>海へ流しています...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>海に流す</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

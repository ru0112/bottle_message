import React, { useState, useEffect } from 'react';
import { OceanBackground } from './components/OceanBackground';
import { BottleThrowModal } from './components/BottleThrowModal';
import { BottleReceiveModal } from './components/BottleReceiveModal';
import { BottleHistoryModal } from './components/BottleHistoryModal';
import { AudioToggle } from './components/AudioToggle';
import type { ReceivedBottleItem, StatsData } from './types';
import { fetchStats } from './api';
import { Send, BookOpen, Compass, Sparkles, MessageCircleHeart } from 'lucide-react';

export const App: React.FC = () => {
  const [isThrowOpen, setIsThrowOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [receivedBottle, setReceivedBottle] = useState<ReceivedBottleItem | null>(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleThrowSuccess = (received?: ReceivedBottleItem) => {
    setIsThrowOpen(false);
    loadStats();
    if (received) {
      setReceivedBottle(received);
      setIsReceiveOpen(true);
    }
  };

  const handleSelectReceivedFromHistory = (bottle: ReceivedBottleItem) => {
    setReceivedBottle(bottle);
    setIsReceiveOpen(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden text-slate-100 font-sans select-none">
      <OceanBackground />

      {/* Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-xl shadow-lg backdrop-blur-md">
            🍾
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
              海鳴りレター
              <span className="text-[10px] uppercase font-sans font-normal tracking-widest text-cyan-400/90 border border-cyan-500/30 px-2 py-0.5 rounded-full bg-cyan-950/40">
                Ocean Bottle
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-serif">見知らぬ誰かと心を通わせる、漂流SNS</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <AudioToggle />
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/70 border border-slate-700/60 backdrop-blur-md text-slate-300 hover:text-white hover:border-amber-500/50 transition-all shadow-lg text-xs"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">海の記録帳</span>
          </button>
        </div>
      </header>

      {/* Main Ocean Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 text-center max-w-3xl mx-auto">
        
        {/* Floating bottle interactive visual */}
        <div
          onClick={() => setIsThrowOpen(true)}
          className="cursor-pointer group relative mb-6 transition-transform duration-500 hover:scale-110 active:scale-95"
        >
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-sm flex items-center justify-center animate-gentle glow-bottle relative">
            
            {/* Ripple ring effect */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-25" />
            
            <div className="text-6xl sm:text-7xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform -rotate-12 group-hover:rotate-0 transition-transform">
              🍾
            </div>
          </div>
          
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[11px] text-cyan-300 font-medium whitespace-nowrap shadow-xl">
            タップして手紙を書く ✨
          </div>
        </div>

        {/* Catchphrase */}
        <div className="space-y-3 mb-8 max-w-xl">
          <h2 className="text-xl sm:text-3xl font-serif font-medium text-slate-100 tracking-wide leading-relaxed">
            手紙をひとつ、夜の海へ流してみませんか。
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-serif leading-relaxed px-4">
            ボトルを流すと、日本のどこかの誰かが流したボトルが1通あなたに届きます。<br className="hidden sm:inline" />
            名前も知らない相手との、一期一会の温かい言葉の交換。
          </p>
        </div>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setIsThrowOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-amber-50 hover:from-amber-500 hover:to-amber-700 font-serif font-medium text-sm tracking-wide shadow-[0_4px_25px_rgba(217,119,6,0.35)] hover:shadow-[0_6px_30px_rgba(217,119,6,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
          >
            <Send className="w-4 h-4" />
            <span>小瓶に手紙を詰めて流す</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-serif text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <MessageCircleHeart className="w-4 h-4 text-rose-400" />
            <span>届いたお礼を見る</span>
          </button>
        </div>

        {/* Live Sea Stats */}
        {stats && (
          <div className="mt-12 flex items-center gap-6 sm:gap-10 py-3 px-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 backdrop-blur-sm text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>海を漂うボトル: <strong className="text-slate-200 font-semibold">{stats.totalBottles}</strong> 通</span>
            </div>
            <div className="w-px h-3.5 bg-slate-800" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>交わされたお礼: <strong className="text-slate-200 font-semibold">{stats.totalReplies}</strong> 件</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-[11px] text-slate-500 font-serif">
        <p>海鳴りレター — 完全匿名のボトルメッセージSNS</p>
      </footer>

      {/* Modals */}
      <BottleThrowModal
        isOpen={isThrowOpen}
        onClose={() => setIsThrowOpen(false)}
        onSuccess={handleThrowSuccess}
      />

      <BottleReceiveModal
        bottle={receivedBottle}
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        onReplySuccess={() => loadStats()}
      />

      <BottleHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectReceived={handleSelectReceivedFromHistory}
      />
    </div>
  );
};

export default App;

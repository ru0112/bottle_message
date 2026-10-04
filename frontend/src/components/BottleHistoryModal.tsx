import React, { useState, useEffect } from 'react';
import { X, Send, Inbox, Heart, Waves, Calendar, RefreshCw } from 'lucide-react';
import type { MyBottleItem, ReceivedBottleItem } from '../types';
import { fetchMyBottles, fetchReceivedBottles } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectReceived: (bottle: ReceivedBottleItem) => void;
}

export const BottleHistoryModal: React.FC<Props> = ({ isOpen, onClose, onSelectReceived }) => {
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [myBottles, setMyBottles] = useState<MyBottleItem[]>([]);
  const [receivedBottles, setReceivedBottles] = useState<ReceivedBottleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sent, received] = await Promise.all([
        fetchMyBottles(),
        fetchReceivedBottles(),
      ]);
      setMyBottles(sent);
      setReceivedBottles(received);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌊</span>
            <h2 className="font-serif text-lg font-medium text-slate-100">
              海の記録帳
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="更新"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'sent'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>流した小瓶 ({myBottles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'received'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>拾った小瓶 ({receivedBottles.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">波の記録を読み込んでいます...</p>
            </div>
          ) : activeTab === 'sent' ? (
            myBottles.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <span className="text-3xl block mb-2">🍾</span>
                <p className="text-sm">まだ海に小瓶を流していません</p>
                <p className="text-xs text-slate-500 mt-1">手紙を書いて夜の海に流してみましょう</p>
              </div>
            ) : (
              myBottles.map((item) => (
                <div
                  key={item.bottle.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 sm:p-5 hover:border-amber-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(item.bottle.createdAt)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-[11px] text-amber-300 flex items-center gap-1">
                      <Waves className="w-3 h-3" />
                      漂流中（拾われた回数: {item.bottle.driftCount}回）
                    </span>
                  </div>

                  <p className="text-sm text-slate-200 font-serif leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                    {item.bottle.content}
                  </p>

                  {/* Replies from people who found it */}
                  {item.exchanges && item.exchanges.length > 0 ? (
                    <div className="pt-2 border-t border-slate-700/50 space-y-2">
                      <div className="text-xs text-amber-300/90 font-medium flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>届いたお礼・リアクション ({item.exchanges.length}件):</span>
                      </div>
                      <div className="space-y-2">
                        {item.exchanges.map((ex) => (
                          <div
                            key={ex.id}
                            className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-3 text-xs flex items-start gap-2.5"
                          >
                            <span className="text-xl shrink-0">{ex.replyReaction || '💌'}</span>
                            <div className="flex-1">
                              {ex.replyContent ? (
                                <p className="text-amber-100 font-serif leading-relaxed">
                                  「{ex.replyContent}」
                                </p>
                              ) : (
                                <p className="text-amber-200/60 italic">
                                  リアクションが届きました
                                </p>
                              )}
                              {ex.repliedAt && (
                                <span className="text-[10px] text-amber-400/50 block mt-1">
                                  {formatDate(ex.repliedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      ※ まだこのボトルへのお礼は届いていません（誰かが拾ってお礼を送るとここに届きます）
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            receivedBottles.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <span className="text-3xl block mb-2">🐚</span>
                <p className="text-sm">まだ拾った小瓶はありません</p>
                <p className="text-xs text-slate-500 mt-1">ボトルを海に流すと、誰かのボトルが漂着します</p>
              </div>
            ) : (
              receivedBottles.map((bottle) => (
                <div
                  key={bottle.exchangeId}
                  onClick={() => {
                    onSelectReceived(bottle);
                    onClose();
                  }}
                  className="bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 rounded-xl p-4 sm:p-5 transition-all cursor-pointer group space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      拾った日: {formatDate(bottle.receivedAt)}
                    </span>
                    {bottle.replyReaction || bottle.replyContent ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center gap-1">
                        <span>お礼済</span>
                        <span>{bottle.replyReaction}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/40 text-[11px] text-rose-300">
                        未返信
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-200 font-serif line-clamp-2 group-hover:text-cyan-200 transition-colors">
                    {bottle.content}
                  </p>

                  <div className="text-right text-xs text-cyan-400 group-hover:underline">
                    手紙をひらく →
                  </div>
                </div>
              ))
            )
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Compass, 
  Inbox, 
  SendHorizontal, 
  User, 
  RefreshCw,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = 'http://localhost:8000/api';

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const CATEGORIES = ["日常", "秘密", "悩み", "感謝", "願い", "夜のつぶやき"];

const REACTIONS = [
  { label: "波の祈り", emoji: "🌊" },
  { label: "心が温まった", emoji: "🌸" },
  { label: "届いたよ", emoji: "🕊️" },
  { label: "静寂を共に", emoji: "🕯️" },
  { label: "応援してる", emoji: "🌟" }
];

interface Bottle {
  id: number;
  nickname: string;
  prefecture: string;
  content: string;
  category: string;
  created_at: string;
  picked_count: number;
  user_reaction?: string | null;
}

interface SentBottle {
  id: number;
  content: string;
  category: string;
  prefecture: string;
  created_at: string;
  picked_count: number;
  reactions: string[];
}

interface ReceivedBottle {
  receipt_id: number;
  bottle_id: number;
  nickname: string;
  prefecture: string;
  content: string;
  category: string;
  received_at: string;
  reaction?: string | null;
}

interface Stats {
  total_bottles: number;
  total_deliveries: number;
  active_prefectures_count: number;
}

export default function App() {
  // ユーザープロファイル（ローカルストレージ保持）
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [prefecture, setPrefecture] = useState<string>('東京都');

  // タブ管理
  const [activeTab, setActiveTab] = useState<'throw' | 'received' | 'sent'>('throw');

  // 送信用フォーム
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('日常');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 漂着したボトルのモーダル
  const [arrivedBottle, setArrivedBottle] = useState<Bottle | null>(null);
  const [isBottleModalOpen, setIsBottleModalOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  // 履歴データ
  const [mySentBottles, setMySentBottles] = useState<SentBottle[]>([]);
  const [myReceivedBottles, setMyReceivedBottles] = useState<ReceivedBottle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // ユーザー設定モーダル
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 初期化
  useEffect(() => {
    let savedId = localStorage.getItem('bottle_sns_uid');
    if (!savedId) {
      savedId = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('bottle_sns_uid', savedId);
    }
    setUserId(savedId);

    const savedNickname = localStorage.getItem('bottle_sns_nick') || '名無しの漂流者';
    setNickname(savedNickname);

    const savedPref = localStorage.getItem('bottle_sns_pref') || '東京都';
    setPrefecture(savedPref);

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  };

  const fetchSentBottles = async (uid = userId) => {
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/bottles/my-sent?author_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setMySentBottles(data);
      }
    } catch (e) {
      console.error("Sent bottles fetch error:", e);
    }
  };

  const fetchReceivedBottles = async (uid = userId) => {
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/bottles/my-received?receiver_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setMyReceivedBottles(data);
      }
    } catch (e) {
      console.error("Received bottles fetch error:", e);
    }
  };

  const handleTabChange = (tab: 'throw' | 'received' | 'sent') => {
    setActiveTab(tab);
    if (tab === 'sent') fetchSentBottles();
    if (tab === 'received') fetchReceivedBottles();
    fetchStats();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bottle_sns_nick', nickname);
    localStorage.setItem('bottle_sns_pref', prefecture);
    setIsProfileOpen(false);
  };

  // メッセージを海に流す処理
  const handleThrowBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bottles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: userId,
          nickname: nickname.trim() || '名無しの漂流者',
          prefecture: prefecture,
          content: content.trim(),
          category: category
        })
      });

      if (!res.ok) throw new Error('通信エラーが発生しました');

      const data = await res.json();
      setContent('');

      // 波しぶきとお祝いエフェクト
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#48cae4', '#90e0ef', '#ffffff', '#ffd166']
      });

      // 受け取ったボトルがある場合、開封モーダルを表示
      if (data.received_bottle) {
        setArrivedBottle(data.received_bottle);
        setSelectedReaction(null);
        setTimeout(() => {
          setIsBottleModalOpen(true);
        }, 600);
      }
      fetchStats();
    } catch (err) {
      alert('ボトルを流すのに失敗しました。バックエンドの接続を確認してください。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 受け取ったボトルへのリアクション送信
  const handleSendReaction = async (reaction: string) => {
    if (!arrivedBottle || selectedReaction) return;

    try {
      await fetch(`${API_BASE}/bottles/${arrivedBottle.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: userId,
          reaction: reaction
        })
      });
      setSelectedReaction(reaction);
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.6 },
        colors: ['#ff85a2', '#fbb1bd', '#ffffff']
      });
    } catch (e) {
      console.error("Reaction error:", e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '80px' }}>
      {/* 海と星屑の背景 */}
      <div className="ocean-bg">
        <div className="stars"></div>
        <div className="waves"></div>
        <div className="waves wave2"></div>
      </div>

      {/* ヘッダー */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'rgba(7, 19, 38, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px', filter: 'drop-shadow(0 0 10px #48cae4)' }}>🌊</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: '#f0f6fc' }}>漂流瓶</h1>
              <p style={{ fontSize: '11px', color: '#8b9bb4' }}>日本の誰かへと繋がるボトルメールSNS</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 統計バッジ */}
            {stats && (
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 14px',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span title="現在海を漂うボトル数">📜 {stats.total_bottles} 通</span>
                <span title="手元に届いた奇跡の数">✨ {stats.total_deliveries} 巡り合い</span>
              </div>
            )}

            {/* プロフィール設定ボタン */}
            <button
              onClick={() => setIsProfileOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(72, 202, 228, 0.15)',
                border: '1px solid rgba(72, 202, 228, 0.3)',
                color: '#caf0f8',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              <User size={14} />
              <span>{nickname}</span>
              <span style={{ color: '#8b9bb4', fontSize: '11px' }}>({prefecture})</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px', position: 'relative', zIndex: 10 }}>
        
        {/* ナビゲーションタブ */}
        <div style={{
          display: 'flex',
          background: 'rgba(12, 27, 54, 0.8)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '32px',
          gap: '8px'
        }}>
          <button
            onClick={() => handleTabChange('throw')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
              background: activeTab === 'throw' ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'transparent',
              color: activeTab === 'throw' ? '#041512' : '#8b9bb4'
            }}
          >
            <SendHorizontal size={16} />
            <span>海へ流す</span>
          </button>

          <button
            onClick={() => handleTabChange('received')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
              background: activeTab === 'received' ? 'linear-gradient(135deg, #48cae4, #0077b6)' : 'transparent',
              color: activeTab === 'received' ? '#ffffff' : '#8b9bb4'
            }}
          >
            <Inbox size={16} />
            <span>拾ったボトル</span>
          </button>

          <button
            onClick={() => handleTabChange('sent')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s',
              background: activeTab === 'sent' ? 'linear-gradient(135deg, #845ec2, #d65db1)' : 'transparent',
              color: activeTab === 'sent' ? '#ffffff' : '#8b9bb4'
            }}
          >
            <Compass size={16} />
            <span>流した記録</span>
          </button>
        </div>

        {/* 1. ボトルを海に流すタブ */}
        {activeTab === 'throw' && (
          <div className="glass-panel" style={{ padding: '36px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div className="animate-float" style={{ fontSize: '48px', marginBottom: '12px' }}>
                🍾
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                想いを海に託す
              </h2>
              <p style={{ color: '#8b9bb4', fontSize: '13px', lineHeight: 1.6 }}>
                あなたがボトルを海に流すと、日本のどこかから<br />
                見知らぬ誰かのボトルが1通だけ、波打ち際に届きます。
              </p>
            </div>

            <form onSubmit={handleThrowBottle}>
              {/* カテゴリ選択 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#caf0f8', marginBottom: '8px', fontWeight: 600 }}>
                  ボトルの雰囲気
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: category === cat ? '1px solid #48cae4' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: category === cat ? 'rgba(72, 202, 228, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: category === cat ? '#90e0ef' : '#c3cfe2',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 手紙本文 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#caf0f8', marginBottom: '8px', fontWeight: 600 }}>
                  ボトルに詰めるメッセージ (最大1000文字)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="今夜の気持ち、誰にも言えない秘密、日常の小さな感動、遠くの誰かへのエールなど... 自由に書き留めてみてください。"
                  rows={6}
                  maxLength={1000}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(8, 21, 43, 0.7)',
                    border: '1px solid rgba(72, 202, 228, 0.25)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#f0f6fc',
                    fontSize: '15px',
                    lineHeight: '1.7',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#8b9bb4', marginTop: '4px' }}>
                  {content.length} / 1000文字
                </div>
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="pulse-glow"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isSubmitting || !content.trim() 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: isSubmitting || !content.trim() ? '#8b9bb4' : '#031c17',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: isSubmitting || !content.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>波の向こうへ流しています...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>海へ流す（誰かのボトルを受け取る）</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 2. 拾ったボトル（宝箱）タブ */}
        {activeTab === 'received' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>漂着したボトル</h2>
                <p style={{ color: '#8b9bb4', fontSize: '12px' }}>あなたが海から拾い上げたメッセージの一覧です</p>
              </div>
              <button
                onClick={() => fetchReceivedBottles()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#caf0f8',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <RefreshCw size={12} />
                <span>更新</span>
              </button>
            </div>

            {myReceivedBottles.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#8b9bb4' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌊</p>
                <p>まだ拾ったボトルはありません。</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>「海へ流す」からメッセージを流すと、誰かのボトルが届きます。</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myReceivedBottles.map((b) => (
                  <div key={b.receipt_id} className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'rgba(72, 202, 228, 0.2)',
                          color: '#48cae4',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {b.category}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#caf0f8' }}>
                          {b.nickname}
                        </span>
                        <span style={{ fontSize: '12px', color: '#8b9bb4' }}>
                          📍 {b.prefecture}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8b9bb4' }}>
                        {new Date(b.received_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '15px',
                      lineHeight: '1.8',
                      color: '#f0f6fc',
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {b.content}
                    </p>

                    {b.reaction && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#a5d6a7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>送ったリアクション:</span>
                        <span style={{ background: 'rgba(165, 214, 167, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                          {b.reaction}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. 流した記録タブ */}
        {activeTab === 'sent' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>流したボトルの行方</h2>
                <p style={{ color: '#8b9bb4', fontSize: '12px' }}>あなたが海に放ったメッセージの漂流状況です</p>
              </div>
              <button
                onClick={() => fetchSentBottles()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#caf0f8',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <RefreshCw size={12} />
                <span>更新</span>
              </button>
            </div>

            {mySentBottles.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#8b9bb4' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>⛵</p>
                <p>まだ流したボトルはありません。</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mySentBottles.map((b) => (
                  <div key={b.id} className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'rgba(214, 93, 177, 0.2)',
                          color: '#d65db1',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {b.category}
                        </span>
                        <span style={{ fontSize: '12px', color: '#8b9bb4' }}>
                          {new Date(b.created_at).toLocaleDateString('ja-JP')} に放流
                        </span>
                      </div>

                      {/* 漂流・受取ステータス */}
                      <span style={{
                        background: b.picked_count > 0 ? 'rgba(56, 239, 125, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: b.picked_count > 0 ? '#38ef7d' : '#8b9bb4',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {b.picked_count > 0 ? `⛵ ${b.picked_count} 人が拾い上げました` : '🌊 海を漂流中...'}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '15px',
                      lineHeight: '1.8',
                      color: '#f0f6fc',
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {b.content}
                    </p>

                    {b.reactions && b.reactions.length > 0 && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '12px', color: '#8b9bb4', marginRight: '8px' }}>届いたリアクション:</span>
                        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
                          {b.reactions.map((r, i) => (
                            <span key={i} style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 漂着したボトルを開封するモーダル */}
      {isBottleModalOpen && arrivedBottle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(3, 8, 19, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            animation: 'float 6s ease-in-out infinite'
          }}>
            {/* 手紙ペーパー風カード */}
            <div className="letter-paper" style={{
              borderRadius: '16px',
              padding: '36px 32px',
              position: 'relative'
            }}>
              {/* 閉じるボタン */}
              <button
                onClick={() => setIsBottleModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c5b52'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>📜</span>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#332924' }}>
                  見知らぬ誰かからの便り
                </h3>
                <p style={{ fontSize: '12px', color: '#7a685e', marginTop: '4px' }}>
                  日本のどこかの海から、あなたの手元へ流れ着きました。
                </p>
              </div>

              {/* 便りの情報バッジ */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px dashed #d1c0aa',
                paddingBottom: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#554238'
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{arrivedBottle.nickname}</span> より
                  <span style={{ marginLeft: '8px', color: '#887469' }}>📍 {arrivedBottle.prefecture}</span>
                </div>
                <div style={{
                  background: 'rgba(214, 189, 152, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {arrivedBottle.category}
                </div>
              </div>

              {/* 手紙本文 */}
              <div style={{
                fontSize: '16px',
                lineHeight: '2.0',
                color: '#281f1c',
                whiteSpace: 'pre-wrap',
                minHeight: '120px',
                padding: '8px 0'
              }}>
                {arrivedBottle.content}
              </div>

              {/* リアクション機能 */}
              <div style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px dashed #d1c0aa',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '12px', color: '#7a685e', marginBottom: '12px' }}>
                  {selectedReaction 
                    ? '✨ リアクションを海に放ちました。相手の記録に届きます。' 
                    : '言葉をくれた相手へ、波にのせて想いを返してみませんか？'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {REACTIONS.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => handleSendReaction(`${r.emoji} ${r.label}`)}
                      disabled={!!selectedReaction}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: selectedReaction === `${r.emoji} ${r.label}` 
                          ? '1px solid #11998e' 
                          : '1px solid #dcd1c2',
                        background: selectedReaction === `${r.emoji} ${r.label}` 
                          ? '#e0f4f0' 
                          : '#fff',
                        color: '#332924',
                        cursor: selectedReaction ? 'default' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 閉じるボタン */}
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                  onClick={() => setIsBottleModalOpen(false)}
                  style={{
                    background: '#3e312b',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 28px',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  ボトルをそっと海に収める
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー設定モーダル */}
      {isProfileOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>漂流者の設定</h3>
              <button onClick={() => setIsProfileOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b9bb4', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#caf0f8', marginBottom: '6px' }}>
                  ペンネーム
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={30}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#caf0f8', marginBottom: '6px' }}>
                  メッセージを流す地域 (都道府県)
                </label>
                <select
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(10, 24, 48, 0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p} style={{ background: '#0a1830', color: '#fff' }}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: '#8b9bb4',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                    color: '#021814',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import type { MyBottleItem, ReceivedBottleItem, ThrowBottleResponse, StatsData } from './types';

const USER_KEY_STORAGE = 'bottle_sns_user_key';

// Get or create anonymous session key
export function getOrCreateUserKey(): string {
  let key = localStorage.getItem(USER_KEY_STORAGE);
  if (!key) {
    key = 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem(USER_KEY_STORAGE, key);
  }
  return key;
}

const API_BASE = '/api';

export async function throwBottle(content: string): Promise<ThrowBottleResponse> {
  const senderKey = getOrCreateUserKey();
  const res = await fetch(`${API_BASE}/bottles/throw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, senderKey }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'ボトルを流すのに失敗しました');
  }

  return res.json();
}

export async function replyBottle(
  exchangeId: string,
  replyContent: string,
  reaction: string
): Promise<{ success: boolean; message: string }> {
  const receiverKey = getOrCreateUserKey();
  const res = await fetch(`${API_BASE}/bottles/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exchangeId,
      receiverKey,
      replyContent,
      reaction,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'お返事の送信に失敗しました');
  }

  return res.json();
}

export async function fetchMyBottles(): Promise<MyBottleItem[]> {
  const senderKey = getOrCreateUserKey();
  const res = await fetch(`${API_BASE}/bottles/my-bottles?senderKey=${encodeURIComponent(senderKey)}`);
  if (!res.ok) throw new Error('流したボトルの取得に失敗しました');
  return res.json();
}

export async function fetchReceivedBottles(): Promise<ReceivedBottleItem[]> {
  const receiverKey = getOrCreateUserKey();
  const res = await fetch(`${API_BASE}/bottles/received-history?receiverKey=${encodeURIComponent(receiverKey)}`);
  if (!res.ok) throw new Error('受け取ったボトルの取得に失敗しました');
  return res.json();
}

export async function fetchStats(): Promise<StatsData> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('統計情報の取得に失敗しました');
  return res.json();
}

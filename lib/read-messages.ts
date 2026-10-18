const READ_MESSAGE_IDS_KEY = "bottle-message-read-message-ids";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getReadMessageIds(): string[] {
  if (typeof window === "undefined") {
    throw new Error("既読メッセージIDはブラウザ上でのみ取得できます。");
  }

  const storedIds = window.localStorage.getItem(READ_MESSAGE_IDS_KEY);
  if (storedIds === null) {
    return [];
  }

  let parsedIds: unknown;
  try {
    parsedIds = JSON.parse(storedIds);
  } catch {
    throw new Error("既読メッセージIDの保存データを読み込めませんでした。");
  }

  if (
    !Array.isArray(parsedIds) ||
    !parsedIds.every(
      (id): id is string => typeof id === "string" && UUID_PATTERN.test(id),
    )
  ) {
    throw new Error("既読メッセージIDの保存データが不正です。");
  }

  return [...new Set(parsedIds)];
}

export function markMessageAsRead(messageId: string): void {
  if (!UUID_PATTERN.test(messageId)) {
    throw new Error("メッセージIDが不正です。");
  }

  const readMessageIds = getReadMessageIds();
  if (readMessageIds.includes(messageId)) {
    return;
  }

  readMessageIds.push(messageId);
  window.localStorage.setItem(
    READ_MESSAGE_IDS_KEY,
    JSON.stringify(readMessageIds),
  );
}

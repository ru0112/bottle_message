const ANONYMOUS_USER_ID_KEY = "bottle-message-anonymous-user-id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getAnonymousUserId(): string {
  if (typeof window === "undefined") {
    throw new Error("匿名IDはブラウザ上でのみ取得できます。");
  }

  const storedId = window.localStorage.getItem(ANONYMOUS_USER_ID_KEY);
  if (storedId && UUID_PATTERN.test(storedId)) {
    return storedId;
  }

  const anonymousUserId = window.crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_USER_ID_KEY, anonymousUserId);
  return anonymousUserId;
}

export type ThreadSpeaker = "you" | "other";

export function canPostReply(
  replyCount: number,
  lastSpeaker: ThreadSpeaker,
): boolean {
  return (
    Number.isInteger(replyCount) &&
    replyCount >= 0 &&
    replyCount < 3 &&
    lastSpeaker === "other"
  );
}

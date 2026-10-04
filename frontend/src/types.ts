export interface Bottle {
  id: string;
  content: string;
  senderKey: string;
  driftCount: number;
  createdAt: string;
}

export interface BottleExchange {
  id: string;
  bottleId: string;
  receiverKey: string;
  receivedAt: string;
  replyContent?: string;
  replyReaction?: string;
  repliedAt?: string;
}

export interface MyBottleItem {
  bottle: Bottle;
  exchanges: BottleExchange[];
}

export interface ReceivedBottleItem {
  exchangeId: string;
  bottleId: string;
  content: string;
  receivedAt: string;
  createdAt: string;
  replyContent?: string;
  replyReaction?: string;
  repliedAt?: string;
}

export interface ThrowBottleResponse {
  thrownBottle: Bottle;
  receivedBottle?: ReceivedBottleItem;
}

export interface StatsData {
  totalBottles: number;
  totalExchanges: number;
  totalReplies: number;
}

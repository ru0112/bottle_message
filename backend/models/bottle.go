package models

import "time"

// Bottle represents a letter inside a drifting bottle
type Bottle struct {
	ID         string    `json:"id"`
	Content    string    `json:"content"`
	SenderKey  string    `json:"senderKey"`
	DriftCount int       `json:"driftCount"`
	CreatedAt  time.Time `json:"createdAt"`
}

// BottleExchange records when a bottle is found and the 1-time reply/reaction
type BottleExchange struct {
	ID            string     `json:"id"`
	BottleID      string     `json:"bottleId"`
	ReceiverKey   string     `json:"receiverKey"`
	ReceivedAt    time.Time  `json:"receivedAt"`
	ReplyContent  *string    `json:"replyContent,omitempty"`
	ReplyReaction *string    `json:"replyReaction,omitempty"`
	RepliedAt     *time.Time `json:"repliedAt,omitempty"`
}

// BottleWithExchange includes bottle content and any reply that was given
type MyBottleResponse struct {
	Bottle    Bottle            `json:"bottle"`
	Exchanges []BottleExchange `json:"exchanges"`
}

// ReceivedBottleResponse represents a bottle picked up by the user
type ReceivedBottleResponse struct {
	ExchangeID    string     `json:"exchangeId"`
	BottleID      string     `json:"bottleId"`
	Content       string     `json:"content"`
	ReceivedAt    time.Time  `json:"receivedAt"`
	CreatedAt     time.Time  `json:"createdAt"`
	ReplyContent  *string    `json:"replyContent,omitempty"`
	ReplyReaction *string    `json:"replyReaction,omitempty"`
	RepliedAt     *time.Time `json:"repliedAt,omitempty"`
}

// ThrowBottleRequest is the payload when throwing a bottle
type ThrowBottleRequest struct {
	Content   string `json:"content"`
	SenderKey string `json:"senderKey"`
}

// ThrowBottleResponse is the result of throwing: user's bottle + newly received drifting bottle
type ThrowBottleResponse struct {
	ThrownBottle   Bottle                 `json:"thrownBottle"`
	ReceivedBottle *ReceivedBottleResponse `json:"receivedBottle,omitempty"`
}

// ReplyRequest is the payload for 1-time reply/reaction
type ReplyRequest struct {
	ExchangeID   string `json:"exchangeId"`
	ReceiverKey  string `json:"receiverKey"`
	ReplyContent string `json:"replyContent"`
	Reaction     string `json:"reaction"`
}

// StatsResponse represents overall bottle sea statistics
type StatsResponse struct {
	TotalBottles   int `json:"totalBottles"`
	TotalExchanges int `json:"totalExchanges"`
	TotalReplies   int `json:"totalReplies"`
}


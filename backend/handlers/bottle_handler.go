package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"bottle-message-api/database"
	"bottle-message-api/models"
	"github.com/google/uuid"
)

// ResponseWriter helper
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// ThrowBottleHandler handles POST /api/bottles/throw
func ThrowBottleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req models.ThrowBottleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	content := strings.TrimSpace(req.Content)
	if content == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Bottle message content cannot be empty"})
		return
	}

	if len([]rune(content)) > 1000 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Content exceeds 1000 characters limit"})
		return
	}

	senderKey := strings.TrimSpace(req.SenderKey)
	if senderKey == "" {
		senderKey = uuid.New().String()
	}

	// 1. Create and save new bottle
	newBottle := models.Bottle{
		ID:         uuid.New().String(),
		Content:    content,
		SenderKey:  senderKey,
		DriftCount: 0,
		CreatedAt:  time.Now(),
	}

	if err := database.SaveBottle(&newBottle); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to release bottle into the sea"})
		return
	}

	// 2. Find a drifting bottle from the sea for this user
	driftBottle, err := database.FindDriftingBottle(senderKey)
	var receivedResponse *models.ReceivedBottleResponse

	if err == nil && driftBottle != nil {
		exchangeID := uuid.New().String()
		now := time.Now()
		exchange := models.BottleExchange{
			ID:          exchangeID,
			BottleID:    driftBottle.ID,
			ReceiverKey: senderKey,
			ReceivedAt:  now,
		}

		if err := database.CreateExchange(&exchange); err == nil {
			receivedResponse = &models.ReceivedBottleResponse{
				ExchangeID: exchangeID,
				BottleID:   driftBottle.ID,
				Content:    driftBottle.Content,
				ReceivedAt: now,
				CreatedAt:  driftBottle.CreatedAt,
			}
		}
	}

	writeJSON(w, http.StatusOK, models.ThrowBottleResponse{
		ThrownBottle:   newBottle,
		ReceivedBottle: receivedResponse,
	})
}

// ReplyBottleHandler handles POST /api/bottles/reply
func ReplyBottleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req models.ReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	if req.ExchangeID == "" || req.ReceiverKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ExchangeID and ReceiverKey are required"})
		return
	}

	if strings.TrimSpace(req.ReplyContent) == "" && strings.TrimSpace(req.Reaction) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Reply content or reaction must be provided"})
		return
	}

	err := database.SaveReply(req.ExchangeID, req.ReceiverKey, req.ReplyContent, req.Reaction)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Reply sent into the ocean",
	})
}

// GetMyBottlesHandler handles GET /api/bottles/my-bottles?senderKey=...
func GetMyBottlesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	senderKey := r.URL.Query().Get("senderKey")
	if senderKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "senderKey query param is required"})
		return
	}

	bottles, err := database.GetMyBottles(senderKey)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve bottles"})
		return
	}

	if bottles == nil {
		bottles = []models.MyBottleResponse{}
	}

	writeJSON(w, http.StatusOK, bottles)
}

// GetReceivedBottlesHandler handles GET /api/bottles/received-history?receiverKey=...
func GetReceivedBottlesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	receiverKey := r.URL.Query().Get("receiverKey")
	if receiverKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "receiverKey query param is required"})
		return
	}

	bottles, err := database.GetReceivedBottles(receiverKey)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve received history"})
		return
	}

	if bottles == nil {
		bottles = []models.ReceivedBottleResponse{}
	}

	writeJSON(w, http.StatusOK, bottles)
}

// StatsHandler handles GET /api/stats
func StatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	stats, err := database.GetStats()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve stats"})
		return
	}

	writeJSON(w, http.StatusOK, stats)
}


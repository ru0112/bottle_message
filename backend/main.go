package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"bottle-message-api/database"
	"bottle-message-api/handlers"
)

// withCORS middleware handles Cross-Origin Resource Sharing
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	dbDir := "data"
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}
	dbPath := filepath.Join(dbDir, "bottle.db")

	db, err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/bottles/throw", handlers.ThrowBottleHandler)
	mux.HandleFunc("/api/bottles/reply", handlers.ReplyBottleHandler)
	mux.HandleFunc("/api/bottles/my-bottles", handlers.GetMyBottlesHandler)
	mux.HandleFunc("/api/bottles/received-history", handlers.GetReceivedBottlesHandler)
	mux.HandleFunc("/api/stats", handlers.StatsHandler)

	// Health check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok","service":"bottle-message-backend"}`)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handler := withCORS(mux)

	log.Printf("🌊 Bottle Message Backend Server running on http://localhost:%s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}


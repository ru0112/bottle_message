package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"bottle-message-api/models"
	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDB initializes SQLite database connection and runs migrations
func InitDB(dbPath string) (*sql.DB, error) {
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool for SQLite
	DB.SetMaxOpenConns(1)

	if err := createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	if err := seedInitialBottles(); err != nil {
		log.Printf("Warning: error checking/seeding initial bottles: %v", err)
	}

	return DB, nil
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS bottles (
			id TEXT PRIMARY KEY,
			content TEXT NOT NULL,
			sender_key TEXT NOT NULL,
			drift_count INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS bottle_exchanges (
			id TEXT PRIMARY KEY,
			bottle_id TEXT NOT NULL,
			receiver_key TEXT NOT NULL,
			received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			reply_content TEXT,
			reply_reaction TEXT,
			replied_at DATETIME,
			FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_bottles_sender ON bottles(sender_key);`,
		`CREATE INDEX IF NOT EXISTS idx_exchanges_receiver ON bottle_exchanges(receiver_key);`,
		`CREATE INDEX IF NOT EXISTS idx_exchanges_bottle ON bottle_exchanges(bottle_id);`,
	}

	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return err
		}
	}
	return nil
}

func seedInitialBottles() error {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM bottles").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Already seeded
	}

	seeds := []string{
		"夜風がとても気持ちいいですね。今日もお疲れ様でした。明日があなたにとって少しでも良い日になりますように。",
		"満員電車に揺られながら、ふと窓の外を見たら夕焼けがとても綺麗でした。誰かに伝えたくなって海に流します。",
		"誰にも言えない悩みや弱音、ここにそっと置いていきます。同じ空の下にいるあなたへ、深呼吸をひとつ届けます。",
		"今日は久しぶりに道端に咲く小さな花を見つけました。忙しい毎日だけど、少し立ち止まる時間も大切ですね。",
		"温かいココアを飲んでいます。寒い夜には温かいものを飲むだけで少し救われますね。どうかご自愛ください。",
		"何者にもなれなくて焦る夜もありますが、生きているだけで100点満点だと思います。ゆっくり進みましょう。",
		"ずっと言えなかった「ありがとう」の気持ち。届くはずのない相手だけど、この海のどこかへ流してみます。",
		"今夜は星が綺麗に見えます。見知らぬあなたにも、穏やかな夢が訪れますように。",
	}

	stmt, err := DB.Prepare("INSERT INTO bottles (id, content, sender_key, drift_count, created_at) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now().Add(-24 * time.Hour)
	for i, seed := range seeds {
		id := uuid.New().String()
		timeOffset := now.Add(time.Duration(i*3) * time.Hour)
		_, err := stmt.Exec(id, seed, "sea-system-seed", 0, timeOffset)
		if err != nil {
			return err
		}
	}

	log.Printf("Successfully seeded %d initial bottles into the ocean.", len(seeds))
	return nil
}

// Helper methods for handlers

func SaveBottle(bottle *models.Bottle) error {
	query := `INSERT INTO bottles (id, content, sender_key, drift_count, created_at) VALUES (?, ?, ?, ?, ?)`
	_, err := DB.Exec(query, bottle.ID, bottle.Content, bottle.SenderKey, bottle.DriftCount, bottle.CreatedAt)
	return err
}

// FindDriftingBottle picks a bottle from someone else or a seed bottle
func FindDriftingBottle(excludeSenderKey string) (*models.Bottle, error) {
	// Prioritize bottles that haven't been received by this user yet
	query := `
		SELECT b.id, b.content, b.sender_key, b.drift_count, b.created_at
		FROM bottles b
		WHERE b.sender_key != ?
		  AND b.id NOT IN (
			SELECT bottle_id FROM bottle_exchanges WHERE receiver_key = ?
		  )
		ORDER BY RANDOM()
		LIMIT 1
	`
	var b models.Bottle
	err := DB.QueryRow(query, excludeSenderKey, excludeSenderKey).Scan(&b.ID, &b.Content, &b.SenderKey, &b.DriftCount, &b.CreatedAt)
	if err == sql.ErrNoRows {
		// Fallback: pick any random bottle not sent by user (even if received before, if pool is small)
		fallbackQuery := `
			SELECT b.id, b.content, b.sender_key, b.drift_count, b.created_at
			FROM bottles b
			WHERE b.sender_key != ?
			ORDER BY RANDOM()
			LIMIT 1
		`
		err = DB.QueryRow(fallbackQuery, excludeSenderKey).Scan(&b.ID, &b.Content, &b.SenderKey, &b.DriftCount, &b.CreatedAt)
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	// Increment drift count
	_, _ = DB.Exec("UPDATE bottles SET drift_count = drift_count + 1 WHERE id = ?", b.ID)
	b.DriftCount++

	return &b, nil
}

func CreateExchange(exchange *models.BottleExchange) error {
	query := `INSERT INTO bottle_exchanges (id, bottle_id, receiver_key, received_at) VALUES (?, ?, ?, ?)`
	_, err := DB.Exec(query, exchange.ID, exchange.BottleID, exchange.ReceiverKey, exchange.ReceivedAt)
	return err
}

func SaveReply(exchangeID, receiverKey, replyContent, reaction string) error {
	now := time.Now()
	query := `
		UPDATE bottle_exchanges 
		SET reply_content = ?, reply_reaction = ?, replied_at = ?
		WHERE id = ? AND receiver_key = ? AND reply_content IS NULL
	`
	result, err := DB.Exec(query, replyContent, reaction, now, exchangeID, receiverKey)
	if err != nil {
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("exchange not found or already replied")
	}
	return nil
}

func GetMyBottles(senderKey string) ([]models.MyBottleResponse, error) {
	query := `
		SELECT id, content, sender_key, drift_count, created_at 
		FROM bottles 
		WHERE sender_key = ? 
		ORDER BY created_at DESC
	`
	rows, err := DB.Query(query, senderKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.MyBottleResponse
	for rows.Next() {
		var b models.Bottle
		if err := rows.Scan(&b.ID, &b.Content, &b.SenderKey, &b.DriftCount, &b.CreatedAt); err != nil {
			return nil, err
		}

		// Fetch exchanges/replies for this bottle
		exchangesQuery := `
			SELECT id, bottle_id, receiver_key, received_at, reply_content, reply_reaction, replied_at
			FROM bottle_exchanges
			WHERE bottle_id = ? AND (reply_content IS NOT NULL OR reply_reaction IS NOT NULL)
			ORDER BY replied_at DESC
		`
		exRows, err := DB.Query(exchangesQuery, b.ID)
		var exchanges []models.BottleExchange
		if err == nil {
			for exRows.Next() {
				var ex models.BottleExchange
				if err := exRows.Scan(&ex.ID, &ex.BottleID, &ex.ReceiverKey, &ex.ReceivedAt, &ex.ReplyContent, &ex.ReplyReaction, &ex.RepliedAt); err == nil {
					exchanges = append(exchanges, ex)
				}
			}
			exRows.Close()
		}

		result = append(result, models.MyBottleResponse{
			Bottle:    b,
			Exchanges: exchanges,
		})
	}
	return result, nil
}

func GetReceivedBottles(receiverKey string) ([]models.ReceivedBottleResponse, error) {
	query := `
		SELECT e.id, b.id, b.content, e.received_at, b.created_at, e.reply_content, e.reply_reaction, e.replied_at
		FROM bottle_exchanges e
		JOIN bottles b ON e.bottle_id = b.id
		WHERE e.receiver_key = ?
		ORDER BY e.received_at DESC
	`
	rows, err := DB.Query(query, receiverKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.ReceivedBottleResponse
	for rows.Next() {
		var item models.ReceivedBottleResponse
		if err := rows.Scan(&item.ExchangeID, &item.BottleID, &item.Content, &item.ReceivedAt, &item.CreatedAt, &item.ReplyContent, &item.ReplyReaction, &item.RepliedAt); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, nil
}

func GetStats() (models.StatsResponse, error) {
	var stats models.StatsResponse
	_ = DB.QueryRow("SELECT COUNT(*) FROM bottles").Scan(&stats.TotalBottles)
	_ = DB.QueryRow("SELECT COUNT(*) FROM bottle_exchanges").Scan(&stats.TotalExchanges)
	_ = DB.QueryRow("SELECT COUNT(*) FROM bottle_exchanges WHERE reply_content IS NOT NULL OR reply_reaction IS NOT NULL").Scan(&stats.TotalReplies)
	return stats, nil
}


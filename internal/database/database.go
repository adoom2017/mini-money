package database

import (
	"database/sql"
	"log"
	"time"

	"mini-money/internal/config"
	"mini-money/internal/models"

	_ "modernc.org/sqlite"
)

var db *sql.DB

// Init initializes the database connection and creates tables
func Init(cfg *config.Config) error {
	var err error
	db, err = sql.Open("sqlite", cfg.Database.Path)
	if err != nil {
		return err
	}

	return createTable()
}

// Close closes the database connection
func Close() {
	if db != nil {
		db.Close()
	}
}

// createTable creates the transactions table if it doesn't exist
func createTable() error {
	// Create users table
	userTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := db.Exec(userTableSQL)
	if err != nil {
		log.Printf("Error creating users table: %v", err)
		return err
	}

	// Create transactions table
	transactionTableSQL := `
	CREATE TABLE IF NOT EXISTS transactions (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		description TEXT,
		amount REAL,
		type TEXT,
		category_key TEXT,
		date DATETIME,
		FOREIGN KEY (user_id) REFERENCES users (id)
	);
	`
	_, err = db.Exec(transactionTableSQL)
	if err != nil {
		log.Printf("Error creating transactions table: %v", err)
		return err
	}
	return nil
}

// GetAllTransactions retrieves all transactions from database for a specific user
func GetAllTransactions(userID int64) ([]models.Transaction, error) {
	rows, err := db.Query("SELECT id, user_id, description, amount, type, category_key, date FROM transactions WHERE user_id = ? ORDER BY date DESC", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := []models.Transaction{}
	for rows.Next() {
		var t models.Transaction
		if err := rows.Scan(&t.ID, &t.UserID, &t.Description, &t.Amount, &t.Type, &t.CategoryKey, &t.Date); err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

// InsertTransaction inserts a new transaction into database
func InsertTransaction(t *models.Transaction) error {
	stmt, err := db.Prepare("INSERT INTO transactions(user_id, description, amount, type, category_key, date) VALUES(?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(t.UserID, t.Description, t.Amount, t.Type, t.CategoryKey, t.Date)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	t.ID = id
	return nil
}

// DeleteTransaction deletes a transaction by ID for a specific user
func DeleteTransaction(id string, userID int64) (int64, error) {
	stmt, err := db.Prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?")
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	result, err := stmt.Exec(id, userID)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// GetSummaryForPeriod calculates summary for a specific time period for a user
func GetSummaryForPeriod(userID int64, start, end time.Time) (models.Summary, error) {
	var summary models.Summary
	query := "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date < ?"

	err := db.QueryRow(query, userID, "income", start, end).Scan(&summary.TotalIncome)
	if err != nil {
		return summary, err
	}

	err = db.QueryRow(query, userID, "expense", start, end).Scan(&summary.TotalExpense)
	if err != nil {
		return summary, err
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}

// GetOverallSummary calculates summary for all transactions for a user
func GetOverallSummary(userID int64) (models.Summary, error) {
	var summary models.Summary

	err := db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'income'", userID).Scan(&summary.TotalIncome)
	if err != nil {
		return summary, err
	}

	err = db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'expense'", userID).Scan(&summary.TotalExpense)
	if err != nil {
		return summary, err
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}

// GetBreakdownForPeriod gets category breakdown for a specific period for a user
func GetBreakdownForPeriod(userID int64, transType string, start, end time.Time, total float64) ([]models.CategoryStat, error) {
	query := `
		SELECT category_key, SUM(amount) as total
		FROM transactions
		WHERE user_id = ? AND type = ? AND date >= ? AND date < ?
		GROUP BY category_key
		ORDER BY total DESC
	`
	rows, err := db.Query(query, userID, transType, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	breakdown := make([]models.CategoryStat, 0)
	for rows.Next() {
		var stat models.CategoryStat
		if err := rows.Scan(&stat.CategoryKey, &stat.Amount); err != nil {
			return nil, err
		}
		if total > 0 {
			stat.Percentage = (stat.Amount / total) * 100
		} else {
			stat.Percentage = 0
		}
		breakdown = append(breakdown, stat)
	}
	return breakdown, nil
}

// User-related database operations

// CreateUser creates a new user
func CreateUser(user *models.User) error {
	stmt, err := db.Prepare("INSERT INTO users(username, email, password, created_at, updated_at) VALUES(?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	res, err := stmt.Exec(user.Username, user.Email, user.Password, now, now)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = id
	user.CreatedAt = now
	user.UpdatedAt = now
	return nil
}

// GetUserByUsername retrieves a user by username
func GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, username, email, password, created_at, updated_at FROM users WHERE username = ?", username).
		Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, username, email, password, created_at, updated_at FROM users WHERE email = ?", email).
		Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(id int64) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, username, email, password, created_at, updated_at FROM users WHERE id = ?", id).
		Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

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
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS transactions (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		description TEXT,
		amount REAL,
		type TEXT,
		category_key TEXT,
		date DATETIME
	);
	`
	_, err := db.Exec(sqlStmt)
	if err != nil {
		log.Printf("Error creating table: %v", err)
		return err
	}
	return nil
}

// GetAllTransactions retrieves all transactions from database
func GetAllTransactions() ([]models.Transaction, error) {
	rows, err := db.Query("SELECT id, description, amount, type, category_key, date FROM transactions ORDER BY date DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := []models.Transaction{}
	for rows.Next() {
		var t models.Transaction
		if err := rows.Scan(&t.ID, &t.Description, &t.Amount, &t.Type, &t.CategoryKey, &t.Date); err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

// InsertTransaction inserts a new transaction into database
func InsertTransaction(t *models.Transaction) error {
	stmt, err := db.Prepare("INSERT INTO transactions(description, amount, type, category_key, date) VALUES(?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(t.Description, t.Amount, t.Type, t.CategoryKey, t.Date)
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

// DeleteTransaction deletes a transaction by ID
func DeleteTransaction(id string) (int64, error) {
	stmt, err := db.Prepare("DELETE FROM transactions WHERE id = ?")
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	result, err := stmt.Exec(id)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// GetSummaryForPeriod calculates summary for a specific time period
func GetSummaryForPeriod(start, end time.Time) (models.Summary, error) {
	var summary models.Summary
	query := "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ? AND date >= ? AND date < ?"

	err := db.QueryRow(query, "income", start, end).Scan(&summary.TotalIncome)
	if err != nil {
		return summary, err
	}

	err = db.QueryRow(query, "expense", start, end).Scan(&summary.TotalExpense)
	if err != nil {
		return summary, err
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}

// GetOverallSummary calculates summary for all transactions
func GetOverallSummary() (models.Summary, error) {
	var summary models.Summary

	err := db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income'").Scan(&summary.TotalIncome)
	if err != nil {
		return summary, err
	}

	err = db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense'").Scan(&summary.TotalExpense)
	if err != nil {
		return summary, err
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}

// GetBreakdownForPeriod gets category breakdown for a specific period
func GetBreakdownForPeriod(transType string, start, end time.Time, total float64) ([]models.CategoryStat, error) {
	query := `
		SELECT category_key, SUM(amount) as total
		FROM transactions
		WHERE type = ? AND date >= ? AND date < ?
		GROUP BY category_key
		ORDER BY total DESC
	`
	rows, err := db.Query(query, transType, start, end)
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

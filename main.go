package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

// Structs for data models
type Transaction struct {
	ID          int64     `json:"id"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	Type        string    `json:"type"`
	CategoryKey string    `json:"categoryKey"`
	Date        time.Time `json:"date"`
}

type Category struct {
	Key  string `json:"key"`
	Icon string `json:"icon"`
}

type Statistics struct {
	Summary          Summary        `json:"summary"`
	ExpenseBreakdown []CategoryStat `json:"expenseBreakdown"`
	IncomeBreakdown  []CategoryStat `json:"incomeBreakdown"`
}

type Summary struct {
	TotalIncome  float64 `json:"totalIncome"`	
	TotalExpense float64 `json:"totalExpense"`
	Balance      float64 `json:"balance"`
}

type CategoryStat struct {
	CategoryKey string  `json:"categoryKey"`
	Amount      float64 `json:"amount"`
	Percentage  float64 `json:"percentage"`
}

var db *sql.DB

// Predefined categories
var expenseCategories = []Category{
	{Key: "food", Icon: "🍔"}, {Key: "medical", Icon: "⚕️"}, {Key: "transport", Icon: "🚌"},
	{Key: "housing", Icon: "🏠"}, {Key: "snacks", Icon: "🍿"}, {Key: "learning", Icon: "🎓"},
	{Key: "communication", Icon: "📞"}, {Key: "social", Icon: "💬"}, {Key: "investment", Icon: "📈"},
	{Key: "shopping", Icon: "🛒"},
}
var incomeCategories = []Category{
	{Key: "salary", Icon: "💼"}, {Key: "part_time", Icon: "👨‍💻"}, {Key: "financial", Icon: "💰"},
	{Key: "red_packet", Icon: "🧧"}, {Key: "other", Icon: "🎁"},
}

func main() {
	var err error
	db, err = sql.Open("sqlite", "./finance.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	createTable()

	router := gin.Default()

	router.Static("/assets", "./frontend")

	api := router.Group("/api")
	{
		api.GET("/transactions", getTransactions)
		api.POST("/transactions", addTransaction)
		api.GET("/summary", getOverallSummary) // Renamed for clarity
		api.GET("/categories", getCategories)
		api.GET("/statistics", getStatistics)
	}

	router.NoRoute(func(c *gin.Context) {
		c.File("./frontend/index.html")
	})

	log.Println("Server starting on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}

func createTable() {
	// For this prototype, we drop and recreate the table on startup to ensure schema consistency.
	// This will clear all existing data.
	db.Exec("DROP TABLE IF EXISTS transactions;")
	sqlStmt := `
	CREATE TABLE transactions (
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
		log.Fatalf("%q: %s\n", err, sqlStmt)
	}
}

func addTransaction(c *gin.Context) {
	var newTransaction Transaction
	if err := c.ShouldBindJSON(&newTransaction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Store all times in UTC for consistency
	newTransaction.Date = time.Now().UTC()

	stmt, err := db.Prepare("INSERT INTO transactions(description, amount, type, category_key, date) VALUES(?, ?, ?, ?, ?)")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stmt.Close()

	// The description is now sent from the frontend directly.
	res, err := stmt.Exec(newTransaction.Description, newTransaction.Amount, newTransaction.Type, newTransaction.CategoryKey, newTransaction.Date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	newTransaction.ID = id

	c.JSON(http.StatusOK, newTransaction)
}

// getOverallSummary calculates the summary for ALL transactions.
func getOverallSummary(c *gin.Context) {
	var summary Summary
	row := db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income'")
	if err := row.Scan(&summary.TotalIncome); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	row = db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense'")
	if err := row.Scan(&summary.TotalExpense); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	summary.Balance = summary.TotalIncome - summary.TotalExpense
	c.JSON(http.StatusOK, summary)
}

// getStatistics calculates statistics for a specific year and month.
func getStatistics(c *gin.Context) {
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))

	var stats Statistics
	var err error

	startOfMonth, endOfMonth := getMonthBounds(year, month)

	stats.Summary, err = getSummaryForPeriod(startOfMonth, endOfMonth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get summary: " + err.Error()})
		return
	}

	stats.ExpenseBreakdown, err = getBreakdownForPeriod("expense", startOfMonth, endOfMonth, stats.Summary.TotalExpense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expense breakdown: " + err.Error()})
		return
	}

	stats.IncomeBreakdown, err = getBreakdownForPeriod("income", startOfMonth, endOfMonth, stats.Summary.TotalIncome)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get income breakdown: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func getMonthBounds(year, month int) (time.Time, time.Time) {
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)
	return start, end
}

func getSummaryForPeriod(start, end time.Time) (Summary, error) {
	var summary Summary
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

func getBreakdownForPeriod(transType string, start, end time.Time, total float64) ([]CategoryStat, error) {
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

	breakdown := make([]CategoryStat, 0) // Initialize as empty slice, not nil
	for rows.Next() {
		var stat CategoryStat
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

// --- Other handlers (getTransactions, getCategories) ---
func getTransactions(c *gin.Context) {
	rows, err := db.Query("SELECT id, description, amount, type, category_key, date FROM transactions ORDER BY date DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	transactions := []Transaction{}
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.Description, &t.Amount, &t.Type, &t.CategoryKey, &t.Date); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		transactions = append(transactions, t)
	}
	c.JSON(http.StatusOK, transactions)
}

func getCategories(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"expense": expenseCategories,
		"income":  incomeCategories,
	})
}

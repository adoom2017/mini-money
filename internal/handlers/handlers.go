package handlers

import (
	"net/http"
	"strconv"
	"time"

	"mini-money/internal/database"
	"mini-money/internal/models"

	"github.com/gin-gonic/gin"
)

// AddTransaction handles POST /api/transactions
func AddTransaction(c *gin.Context) {
	var newTransaction models.Transaction
	if err := c.ShouldBindJSON(&newTransaction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Store all times in UTC for consistency
	newTransaction.Date = time.Now().UTC()

	if err := database.InsertTransaction(&newTransaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, newTransaction)
}

// GetTransactions handles GET /api/transactions
func GetTransactions(c *gin.Context) {
	transactions, err := database.GetAllTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, transactions)
}

// DeleteTransaction handles DELETE /api/transactions/:id
func DeleteTransaction(c *gin.Context) {
	id := c.Param("id")

	rowsAffected, err := database.DeleteTransaction(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
}

// GetSummary handles GET /api/summary
func GetSummary(c *gin.Context) {
	summary, err := database.GetOverallSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

// GetCategories handles GET /api/categories
func GetCategories(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"expense": models.ExpenseCategories,
		"income":  models.IncomeCategories,
	})
}

// GetStatistics handles GET /api/statistics
func GetStatistics(c *gin.Context) {
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))

	var stats models.Statistics
	var err error

	startOfMonth, endOfMonth := getMonthBounds(year, month)

	stats.Summary, err = database.GetSummaryForPeriod(startOfMonth, endOfMonth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get summary: " + err.Error()})
		return
	}

	stats.ExpenseBreakdown, err = database.GetBreakdownForPeriod("expense", startOfMonth, endOfMonth, stats.Summary.TotalExpense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expense breakdown: " + err.Error()})
		return
	}

	stats.IncomeBreakdown, err = database.GetBreakdownForPeriod("income", startOfMonth, endOfMonth, stats.Summary.TotalIncome)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get income breakdown: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// getMonthBounds returns the start and end times for a given month
func getMonthBounds(year, month int) (time.Time, time.Time) {
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)
	return start, end
}

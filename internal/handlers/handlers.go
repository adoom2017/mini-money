package handlers

import (
	"net/http"
	"strconv"
	"time"

	"mini-money/internal/auth"
	"mini-money/internal/database"
	"mini-money/internal/middleware"
	"mini-money/internal/models"

	"github.com/gin-gonic/gin"
)

// AddTransaction handles POST /api/transactions
func AddTransaction(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var newTransaction models.Transaction
	if err := c.ShouldBindJSON(&newTransaction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set the user ID for the transaction
	newTransaction.UserID = userID
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
	userID := middleware.GetUserID(c)

	transactions, err := database.GetAllTransactions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, transactions)
}

// DeleteTransaction handles DELETE /api/transactions/:id
func DeleteTransaction(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id := c.Param("id")

	rowsAffected, err := database.DeleteTransaction(id, userID)
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
	userID := middleware.GetUserID(c)

	summary, err := database.GetOverallSummary(userID)
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
	userID := middleware.GetUserID(c)
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))

	var stats models.Statistics
	var err error

	startOfMonth, endOfMonth := getMonthBounds(year, month)

	stats.Summary, err = database.GetSummaryForPeriod(userID, startOfMonth, endOfMonth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get summary: " + err.Error()})
		return
	}

	stats.ExpenseBreakdown, err = database.GetBreakdownForPeriod(userID, "expense", startOfMonth, endOfMonth, stats.Summary.TotalExpense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expense breakdown: " + err.Error()})
		return
	}

	stats.IncomeBreakdown, err = database.GetBreakdownForPeriod(userID, "income", startOfMonth, endOfMonth, stats.Summary.TotalIncome)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get income breakdown: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Register handles POST /api/auth/register
func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	if _, err := database.GetUserByEmail(req.Email); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Check if username already exists
	if _, err := database.GetUserByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	}

	if err := database.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate token
	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	}

	c.JSON(http.StatusCreated, response)
}

// Login handles POST /api/auth/login
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user by email or username
	var user *models.User
	var err error

	if req.Email != "" {
		user, err = database.GetUserByEmail(req.Email)
	} else if req.Username != "" {
		user, err = database.GetUserByUsername(req.Username)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email or username is required"})
		return
	}

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !auth.CheckPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate token
	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	}

	c.JSON(http.StatusOK, response)
}

// getMonthBounds returns the start and end times for a given month
func getMonthBounds(year, month int) (time.Time, time.Time) {
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)
	return start, end
}

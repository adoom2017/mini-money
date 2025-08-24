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

	// Define a struct to handle the incoming JSON with string date
	var requestData struct {
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Type        string  `json:"type"`
		CategoryKey string  `json:"categoryKey"`
		Date        string  `json:"date"` // Accept date as string from frontend
	}

	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse the date from the frontend (format: YYYY-MM-DD)
	var transactionDate time.Time
	if requestData.Date != "" {
		// Parse the date and set time to current time
		parsedDate, err := time.Parse("2006-01-02", requestData.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
			return
		}
		// Set the time to current time but keep the selected date
		now := time.Now().UTC()
		transactionDate = time.Date(
			parsedDate.Year(), parsedDate.Month(), parsedDate.Day(),
			now.Hour(), now.Minute(), now.Second(), now.Nanosecond(),
			time.UTC,
		)
	} else {
		// If no date provided, use current time
		transactionDate = time.Now().UTC()
	}

	// Create the transaction with parsed data
	newTransaction := models.Transaction{
		UserID:      userID,
		Description: requestData.Description,
		Amount:      requestData.Amount,
		Type:        requestData.Type,
		CategoryKey: requestData.CategoryKey,
		Date:        transactionDate,
	}

	if err := database.InsertTransaction(&newTransaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, newTransaction)
}

// GetTransactions handles GET /api/transactions
func GetTransactions(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Get query parameters
	transactionType := c.Query("type")
	month := c.Query("month")
	search := c.Query("search")
	limit := c.Query("limit")
	date := c.Query("date")

	transactions, err := database.GetFilteredTransactions(userID, transactionType, month, search, limit, date)
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
			Avatar:   user.Avatar,
		},
	}

	c.JSON(http.StatusCreated, response)
}

// GetUserProfile handles GET /api/user/profile
func GetUserProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	user, err := database.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	response := models.UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Avatar:   user.Avatar,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserAvatar handles PUT /api/user/avatar
func UpdateUserAvatar(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.UpdateAvatarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update avatar in database
	if err := database.UpdateUserAvatar(userID, req.Avatar); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update avatar"})
		return
	}

	// Get updated user info
	user, err := database.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	response := models.UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Avatar:   user.Avatar,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserPassword handles PUT /api/user/password
func UpdateUserPassword(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user info to verify current password
	user, err := database.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	// Verify current password
	if !auth.CheckPassword(req.CurrentPassword, user.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password in database
	if err := database.UpdateUserPassword(userID, hashedPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// UpdateUserEmail handles PUT /api/user/email
func UpdateUserEmail(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.UpdateEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user info to verify password
	user, err := database.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	// Verify password
	if !auth.CheckPassword(req.Password, user.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is incorrect"})
		return
	}

	// Check if email is already in use by another user
	existingUser, err := database.GetUserByEmail(req.Email)
	if err == nil && existingUser.ID != userID {
		c.JSON(http.StatusConflict, gin.H{"error": "Email is already in use"})
		return
	}

	// Update email in database
	if err := database.UpdateUserEmail(userID, req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update email"})
		return
	}

	// Get updated user info
	updatedUser, err := database.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated user info"})
		return
	}

	response := models.UserResponse{
		ID:       updatedUser.ID,
		Username: updatedUser.Username,
		Email:    updatedUser.Email,
		Avatar:   updatedUser.Avatar,
	}

	c.JSON(http.StatusOK, response)
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
			Avatar:   user.Avatar,
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

// Asset-related handlers

// GetAssets handles GET /api/assets
func GetAssets(c *gin.Context) {
	userID := middleware.GetUserID(c)

	assets, err := database.GetAssetsWithRecordsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get assets: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, assets)
}

// CreateAsset handles POST /api/assets
func CreateAsset(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.CreateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	asset := &models.Asset{
		UserID: userID,
		Name:   req.Name,
	}

	if err := database.CreateAsset(asset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create asset: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, asset)
}

// DeleteAsset handles DELETE /api/assets/:id
func DeleteAsset(c *gin.Context) {
	userID := middleware.GetUserID(c)
	assetIDStr := c.Param("id")

	assetID, err := strconv.ParseInt(assetIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid asset ID"})
		return
	}

	// Verify asset ownership
	_, err = database.GetAssetByID(assetID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	if err := database.DeleteAsset(assetID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete asset: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset deleted successfully"})
}

// CreateAssetRecord handles POST /api/assets/:id/records
func CreateAssetRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	assetIDStr := c.Param("id")

	assetID, err := strconv.ParseInt(assetIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid asset ID"})
		return
	}

	// Verify asset ownership
	_, err = database.GetAssetByID(assetID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	var req models.CreateAssetRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record := &models.AssetRecord{
		AssetID: assetID,
		Date:    req.Date,
		Amount:  req.Amount,
	}

	if err := database.CreateAssetRecord(record); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create asset record: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// DeleteAssetRecord handles DELETE /api/assets/:id/records/:recordId
func DeleteAssetRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	assetIDStr := c.Param("id")
	recordIDStr := c.Param("recordId")

	assetID, err := strconv.ParseInt(assetIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid asset ID"})
		return
	}

	recordID, err := strconv.ParseInt(recordIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	// Verify asset ownership
	_, err = database.GetAssetByID(assetID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	if err := database.DeleteAssetRecord(recordID, assetID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete asset record: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset record deleted successfully"})
}

// UpdateAssetRecord handles PUT /api/assets/:id/records/:recordId
func UpdateAssetRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	assetIDStr := c.Param("id")
	recordIDStr := c.Param("recordId")

	assetID, err := strconv.ParseInt(assetIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid asset ID"})
		return
	}

	recordID, err := strconv.ParseInt(recordIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	// Verify asset ownership
	_, err = database.GetAssetByID(assetID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	var request models.CreateAssetRecordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record, err := database.UpdateAssetRecord(recordID, assetID, userID, request.Date, request.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update asset record: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

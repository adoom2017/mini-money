package models

import "time"

// User represents a user account
type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Avatar    string    `json:"avatar"` // 头像URL或base64数据
	Password  string    `json:"-"`      // 密码不会在 JSON 中返回
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// LoginRequest represents login request data
type LoginRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents registration request data
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// UpdateAvatarRequest represents avatar update request data
type UpdateAvatarRequest struct {
	Avatar string `json:"avatar" binding:"required"`
}

// UpdatePasswordRequest represents password update request data
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

// UpdateEmailRequest represents email update request data
type UpdateEmailRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UserResponse represents user data returned in API responses
type UserResponse struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
}

// Transaction represents a financial transaction
type Transaction struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"userId"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	Type        string    `json:"type"`
	CategoryKey string    `json:"categoryKey"`
	Date        time.Time `json:"date"`
}

// Category represents a transaction category
type Category struct {
	Key  string `json:"key"`
	Icon string `json:"icon"`
}

// Statistics represents monthly statistics data
type Statistics struct {
	Summary          Summary        `json:"summary"`
	ExpenseBreakdown []CategoryStat `json:"expenseBreakdown"`
	IncomeBreakdown  []CategoryStat `json:"incomeBreakdown"`
}

// Summary represents financial summary data
type Summary struct {
	TotalIncome  float64 `json:"totalIncome"`
	TotalExpense float64 `json:"totalExpense"`
	Balance      float64 `json:"balance"`
}

// CategoryStat represents statistics for a specific category
type CategoryStat struct {
	CategoryKey string  `json:"categoryKey"`
	Amount      float64 `json:"amount"`
	Percentage  float64 `json:"percentage"`
}

// Predefined categories
var ExpenseCategories = []Category{
	{Key: "food", Icon: "🍔"}, {Key: "medical", Icon: "⚕️"}, {Key: "transport", Icon: "🚌"},
	{Key: "housing", Icon: "🏠"}, {Key: "snacks", Icon: "🍿"}, {Key: "learning", Icon: "🎓"},
	{Key: "communication", Icon: "📞"}, {Key: "social", Icon: "💬"}, {Key: "investment", Icon: "📈"},
	{Key: "shopping", Icon: "🛒"}, {Key: "other", Icon: "📝"},
}

var IncomeCategories = []Category{
	{Key: "salary", Icon: "💼"}, {Key: "part_time", Icon: "👨‍💻"}, {Key: "financial", Icon: "💰"},
	{Key: "red_packet", Icon: "🧧"}, {Key: "other", Icon: "🎁"},
}

// Asset represents an asset account
type Asset struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	Name      string    `json:"name"`
	Category  string    `json:"category"` // 资产分类：card, cash, investment
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// AssetRecord represents a record of asset value at a specific date
type AssetRecord struct {
	ID        int64     `json:"id"`
	AssetID   int64     `json:"assetId"`
	Date      string    `json:"date"` // YYYY-MM-DD format
	Amount    float64   `json:"amount"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// AssetWithRecords represents an asset with its records
type AssetWithRecords struct {
	ID        int64         `json:"id"`
	UserID    int64         `json:"userId"`
	Name      string        `json:"name"`
	Category  string        `json:"category"` // 资产分类：card, cash, investment
	Records   []AssetRecord `json:"records"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
}

// CreateAssetRequest represents request to create a new asset
type CreateAssetRequest struct {
	Name     string `json:"name" binding:"required,min=1,max=100"`
	Category string `json:"category" binding:"required,oneof=card cash investment"`
}

// CreateAssetRecordRequest represents request to create a new asset record
type CreateAssetRecordRequest struct {
	Date   string  `json:"date" binding:"required"`
	Amount float64 `json:"amount" binding:"required,min=0"`
}

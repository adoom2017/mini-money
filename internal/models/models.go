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
	ID   int64  `json:"id"`
	Key  string `json:"key"`
	Name string `json:"name"`
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

// Asset represents an asset account
type Asset struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"userId"`
	Name       string    `json:"name"`
	Category   string    `json:"category"`   // 保持向后兼容，现在是分类名称
	CategoryID *int64    `json:"categoryId"` // 新的分类ID关联
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
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
	ID         int64         `json:"id"`
	UserID     int64         `json:"userId"`
	Name       string        `json:"name"`
	Category   string        `json:"category"`   // 分类名称
	CategoryID *int64        `json:"categoryId"` // 分类ID
	Records    []AssetRecord `json:"records"`
	CreatedAt  time.Time     `json:"createdAt"`
	UpdatedAt  time.Time     `json:"updatedAt"`
}

// CreateAssetRequest represents request to create a new asset
type CreateAssetRequest struct {
	Name       string `json:"name" binding:"required,min=1,max=100"`
	CategoryID int64  `json:"categoryId" binding:"required,min=1"`
}

// CreateAssetRecordRequest represents request to create a new asset record
type CreateAssetRecordRequest struct {
	Date   string  `json:"date" binding:"required"`
	Amount float64 `json:"amount" binding:"required,min=0"`
}

// AssetCategory represents an asset category
type AssetCategory struct {
	ID     int64  `json:"id"`
	UserID int64  `json:"userId"`
	Name   string `json:"name"`
	Icon   string `json:"icon"`
	Type   string `json:"type"` // "asset" or "liability"
}

// CreateAssetCategoryRequest represents request to create a new asset category
type CreateAssetCategoryRequest struct {
	Name string `json:"name" binding:"required,min=1,max=50"`
	Icon string `json:"icon" binding:"required"`
	Type string `json:"type" binding:"required,oneof=asset liability"`
}

// UpdateAssetCategoryRequest represents request to update an asset category
type UpdateAssetCategoryRequest struct {
	Name string `json:"name" binding:"required,min=1,max=50"`
	Icon string `json:"icon" binding:"required"`
	Type string `json:"type" binding:"required,oneof=asset liability"`
}

// AutoTransaction represents a recurring transaction rule
type AutoTransaction struct {
	ID                int64      `json:"id"`
	UserID            int64      `json:"userId"`
	Type              string     `json:"type"` // "income" or "expense"
	Amount            float64    `json:"amount"`
	CategoryKey       string     `json:"categoryKey"`
	Description       string     `json:"description"`
	Frequency         string     `json:"frequency"`  // "daily", "weekly", "monthly", "yearly"
	DayOfMonth        int        `json:"dayOfMonth"` // For monthly/yearly frequency (1-31)
	DayOfWeek         int        `json:"dayOfWeek"`  // For weekly frequency (0=Sunday, 1=Monday, etc.)
	NextExecutionDate time.Time  `json:"nextExecutionDate"`
	LastExecutionDate *time.Time `json:"lastExecutionDate"`
	IsActive          bool       `json:"isActive"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// CreateAutoTransactionRequest represents request to create an auto transaction
type CreateAutoTransactionRequest struct {
	Type        string  `json:"type" binding:"required,oneof=income expense"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	CategoryKey string  `json:"categoryKey" binding:"required"`
	Description string  `json:"description"`
	Frequency   string  `json:"frequency" binding:"required,oneof=daily weekly monthly yearly"`
	DayOfMonth  int     `json:"dayOfMonth,omitempty"` // For monthly/yearly
	DayOfWeek   int     `json:"dayOfWeek,omitempty"`  // For weekly
}

// UpdateAutoTransactionRequest represents request to update an auto transaction
type UpdateAutoTransactionRequest struct {
	Type        string  `json:"type" binding:"required,oneof=income expense"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	CategoryKey string  `json:"categoryKey" binding:"required"`
	Description string  `json:"description"`
	Frequency   string  `json:"frequency" binding:"required,oneof=daily weekly monthly yearly"`
	DayOfMonth  int     `json:"dayOfMonth,omitempty"` // For monthly/yearly
	DayOfWeek   int     `json:"dayOfWeek,omitempty"`  // For weekly
	IsActive    bool    `json:"isActive"`
}

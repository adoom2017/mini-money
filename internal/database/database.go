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
		avatar TEXT DEFAULT '',
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

	// Add avatar column to existing users table if it doesn't exist
	alterTableSQL := `ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '';`
	db.Exec(alterTableSQL) // Ignore error if column already exists

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

	// Create assets table
	assetTableSQL := `
	CREATE TABLE IF NOT EXISTS assets (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		category TEXT NOT NULL DEFAULT 'card',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id)
	);
	`
	_, err = db.Exec(assetTableSQL)
	if err != nil {
		log.Printf("Error creating assets table: %v", err)
		return err
	}

	// Create asset_records table
	assetRecordTableSQL := `
	CREATE TABLE IF NOT EXISTS asset_records (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		asset_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		amount REAL NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE,
		UNIQUE(asset_id, date)
	);
	`
	_, err = db.Exec(assetRecordTableSQL)
	if err != nil {
		log.Printf("Error creating asset_records table: %v", err)
		return err
	}

	// Add category column to existing assets table if it doesn't exist
	// This is for database migration - ignore error if column already exists
	_, _ = db.Exec("ALTER TABLE assets ADD COLUMN category TEXT DEFAULT 'card'")

	// Update existing assets with empty category to have default 'card' category
	_, err = db.Exec("UPDATE assets SET category = 'card' WHERE category = '' OR category IS NULL")
	if err != nil {
		log.Printf("Error updating empty asset categories: %v", err)
		// Don't return error as this is not critical for app functionality
	}

	// Create asset_categories table
	assetCategoryTableSQL := `
	CREATE TABLE IF NOT EXISTS asset_categories (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		icon TEXT NOT NULL,
		type TEXT NOT NULL CHECK (type IN ('asset', 'liability')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id),
		UNIQUE(user_id, name, type)
	);
	`
	_, err = db.Exec(assetCategoryTableSQL)
	if err != nil {
		log.Printf("Error creating asset_categories table: %v", err)
		return err
	}

	// Create transaction_categories table for income and expense categories
	transactionCategoryTableSQL := `
	CREATE TABLE IF NOT EXISTS transaction_categories (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		key TEXT NOT NULL,
		name TEXT NOT NULL,
		icon TEXT NOT NULL,
		type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
		is_default BOOLEAN DEFAULT FALSE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id),
		UNIQUE(user_id, key, type)
	);
	`
	_, err = db.Exec(transactionCategoryTableSQL)
	if err != nil {
		log.Printf("Error creating transaction_categories table: %v", err)
		return err
	}

	// Migrate assets table to use category_id instead of category string
	err = migrateAssetsCategoryToID()
	if err != nil {
		log.Printf("Error migrating assets category: %v", err)
		return err
	}

	// Create auto_transactions table
	createAutoTransactionsTable := `
	CREATE TABLE IF NOT EXISTS auto_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
		amount REAL NOT NULL,
		category_key TEXT NOT NULL,
		description TEXT,
		frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
		day_of_month INTEGER DEFAULT 1,
		day_of_week INTEGER DEFAULT 1,
		next_execution_date DATETIME NOT NULL,
		last_execution_date DATETIME,
		is_active INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id)
	);`

	if _, err := db.Exec(createAutoTransactionsTable); err != nil {
		log.Printf("Error creating auto_transactions table: %v", err)
		return err
	}

	return nil
}

// migrateAssetsCategoryToID migrates the assets table to use category_id instead of category string
func migrateAssetsCategoryToID() error {
	// Check if assets table has category_id column
	var columnExists bool
	err := db.QueryRow(`
		SELECT COUNT(*) > 0 
		FROM pragma_table_info('assets') 
		WHERE name = 'category_id'
	`).Scan(&columnExists)
	if err != nil {
		return err
	}

	// If category_id column doesn't exist, add it
	if !columnExists {
		// Add category_id column
		_, err = db.Exec("ALTER TABLE assets ADD COLUMN category_id INTEGER REFERENCES asset_categories(id)")
		if err != nil {
			return err
		}
		log.Println("Added category_id column to assets table")
	}

	return nil
}

// InitializeDefaultAssetCategories creates default asset categories for a new user
func InitializeDefaultAssetCategories(userID int64) error {
	defaultCategories := []struct {
		Name string
		Icon string
		Type string
	}{
		// 资产类别
		{"银行卡", "💳", "asset"},
		{"现金", "💵", "asset"},
		{"支付宝", "💰", "asset"},
		{"微信", "💳", "asset"},
		{"投资", "📈", "asset"},
		{"股票", "📊", "asset"},
		{"基金", "💹", "asset"},
		// 负债类别
		{"信用卡", "💳", "liability"},
		{"房贷", "🏠", "liability"},
		{"车贷", "🚗", "liability"},
		{"借款", "💰", "liability"},
	}

	for _, cat := range defaultCategories {
		// Check if category already exists
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM asset_categories WHERE user_id = ? AND name = ? AND type = ?",
			userID, cat.Name, cat.Type).Scan(&count)
		if err != nil {
			return err
		}

		// Only create if doesn't exist
		if count == 0 {
			_, err = CreateAssetCategory(userID, cat.Name, cat.Icon, cat.Type)
			if err != nil {
				log.Printf("Error creating default asset category %s: %v", cat.Name, err)
				// Continue with other categories even if one fails
			}
		}
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

// GetFilteredTransactions retrieves filtered transactions from database for a specific user
func GetFilteredTransactions(userID int64, transactionType, month, search, limit, date, startDate, endDate string) ([]models.Transaction, error) {
	query := "SELECT id, user_id, description, amount, type, category_key, date FROM transactions WHERE user_id = ?"
	args := []interface{}{userID}

	// Add type filter
	if transactionType != "" && transactionType != "all" {
		query += " AND type = ?"
		args = append(args, transactionType)
	}

	// Add date filter (priority: specific date > date range > month)
	if date != "" {
		// date format is "YYYY-MM-DD"
		// SQLite stores Go time.Time as full timestamp like "2025-07-21 13:07:14.189539231 +0000 UTC"
		// Use LIKE to match the date portion at the beginning
		query += " AND date LIKE ?"
		args = append(args, date+" %")
	} else if startDate != "" && endDate != "" {
		// date range filter for multi-month queries like "最近三个月"
		// startDate and endDate format is "YYYY-MM-DD"
		query += " AND date >= ? AND date <= ?"
		// Convert dates to proper format for comparison
		startDateStr := startDate + " 00:00:00"
		endDateStr := endDate + " 23:59:59"
		args = append(args, startDateStr, endDateStr)
	} else if month != "" && month != "all" {
		// month format is "YYYY-MM"
		// Use LIKE to match the beginning of the date string since Go stores dates as full timestamp
		query += " AND date LIKE ?"
		args = append(args, month+"-%")
	}

	// Add search filter
	if search != "" {
		query += " AND (description LIKE ? OR category_key LIKE ?)"
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern)
	}

	query += " ORDER BY date DESC"

	// Add limit if specified
	if limit != "" {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	rows, err := db.Query(query, args...)
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
	stmt, err := db.Prepare("INSERT INTO users(username, email, avatar, password, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	res, err := stmt.Exec(user.Username, user.Email, user.Avatar, user.Password, now, now)
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
	err := db.QueryRow("SELECT id, username, email, avatar, password, created_at, updated_at FROM users WHERE username = ?", username).
		Scan(&user.ID, &user.Username, &user.Email, &user.Avatar, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, username, email, avatar, password, created_at, updated_at FROM users WHERE email = ?", email).
		Scan(&user.ID, &user.Username, &user.Email, &user.Avatar, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(id int64) (*models.User, error) {
	var user models.User
	err := db.QueryRow("SELECT id, username, email, avatar, password, created_at, updated_at FROM users WHERE id = ?", id).
		Scan(&user.ID, &user.Username, &user.Email, &user.Avatar, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUserAvatar updates a user's avatar
func UpdateUserAvatar(userID int64, avatar string) error {
	stmt, err := db.Prepare("UPDATE users SET avatar = ?, updated_at = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(avatar, time.Now(), userID)
	return err
}

// UpdateUserPassword updates a user's password
func UpdateUserPassword(userID int64, newPassword string) error {
	stmt, err := db.Prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(newPassword, time.Now(), userID)
	return err
}

// UpdateUserEmail updates a user's email
func UpdateUserEmail(userID int64, email string) error {
	stmt, err := db.Prepare("UPDATE users SET email = ?, updated_at = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(email, time.Now(), userID)
	return err
}

// Asset-related database operations

// CreateAsset creates a new asset
func CreateAsset(asset *models.Asset) error {
	// If category_id is provided, get the category name and use that
	if asset.CategoryID != nil && *asset.CategoryID > 0 {
		// Get category name for backward compatibility
		var categoryName string
		err := db.QueryRow("SELECT name FROM asset_categories WHERE id = ? AND user_id = ?",
			*asset.CategoryID, asset.UserID).Scan(&categoryName)
		if err != nil {
			return err
		}
		asset.Category = categoryName
	}

	stmt, err := db.Prepare("INSERT INTO assets(user_id, name, category, category_id, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	res, err := stmt.Exec(asset.UserID, asset.Name, asset.Category, asset.CategoryID, now, now)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	asset.ID = id
	asset.CreatedAt = now
	asset.UpdatedAt = now
	return nil
}

// GetAssetsByUserID retrieves all assets for a specific user
func GetAssetsByUserID(userID int64) ([]models.Asset, error) {
	query := `
		SELECT a.id, a.user_id, a.name, 
			   COALESCE(ac.name, a.category) as category_name,
			   a.category_id,
			   a.created_at, a.updated_at 
		FROM assets a
		LEFT JOIN asset_categories ac ON a.category_id = ac.id
		WHERE a.user_id = ? 
		ORDER BY a.created_at DESC
	`
	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	assets := []models.Asset{}
	for rows.Next() {
		var asset models.Asset
		if err := rows.Scan(&asset.ID, &asset.UserID, &asset.Name, &asset.Category, &asset.CategoryID, &asset.CreatedAt, &asset.UpdatedAt); err != nil {
			return nil, err
		}
		assets = append(assets, asset)
	}
	return assets, nil
}

// GetAssetsWithRecordsByUserID retrieves all assets with their records for a specific user
func GetAssetsWithRecordsByUserID(userID int64) ([]models.AssetWithRecords, error) {
	// First get all assets
	assets, err := GetAssetsByUserID(userID)
	if err != nil {
		return nil, err
	}

	result := make([]models.AssetWithRecords, len(assets))
	for i, asset := range assets {
		// Get records for each asset
		records, err := GetAssetRecordsByAssetID(asset.ID)
		if err != nil {
			return nil, err
		}

		result[i] = models.AssetWithRecords{
			ID:         asset.ID,
			UserID:     asset.UserID,
			Name:       asset.Name,
			Category:   asset.Category,
			CategoryID: asset.CategoryID,
			Records:    records,
			CreatedAt:  asset.CreatedAt,
			UpdatedAt:  asset.UpdatedAt,
		}
	}

	return result, nil
}

// GetAssetByID retrieves an asset by ID and verifies user ownership
func GetAssetByID(assetID, userID int64) (*models.Asset, error) {
	var asset models.Asset
	err := db.QueryRow("SELECT id, user_id, name, created_at, updated_at FROM assets WHERE id = ? AND user_id = ?", assetID, userID).
		Scan(&asset.ID, &asset.UserID, &asset.Name, &asset.CreatedAt, &asset.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

// DeleteAsset deletes an asset and all its records
func DeleteAsset(assetID, userID int64) error {
	stmt, err := db.Prepare("DELETE FROM assets WHERE id = ? AND user_id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(assetID, userID)
	return err
}

// CreateAssetRecord creates a new asset record
func CreateAssetRecord(record *models.AssetRecord) error {
	stmt, err := db.Prepare("INSERT OR REPLACE INTO asset_records(asset_id, date, amount, created_at, updated_at) VALUES(?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now()
	res, err := stmt.Exec(record.AssetID, record.Date, record.Amount, now, now)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	record.ID = id
	record.CreatedAt = now
	record.UpdatedAt = now
	return nil
}

// GetAssetRecordsByAssetID retrieves all records for a specific asset
func GetAssetRecordsByAssetID(assetID int64) ([]models.AssetRecord, error) {
	rows, err := db.Query("SELECT id, asset_id, date, amount, created_at, updated_at FROM asset_records WHERE asset_id = ? ORDER BY date DESC", assetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.AssetRecord{}
	for rows.Next() {
		var record models.AssetRecord
		if err := rows.Scan(&record.ID, &record.AssetID, &record.Date, &record.Amount, &record.CreatedAt, &record.UpdatedAt); err != nil {
			return nil, err
		}
		records = append(records, record)
	}
	return records, nil
}

// DeleteAssetRecord deletes a specific asset record
func DeleteAssetRecord(recordID, assetID, userID int64) error {
	stmt, err := db.Prepare(`
		DELETE FROM asset_records 
		WHERE id = ? AND asset_id = ? AND asset_id IN (
			SELECT id FROM assets WHERE user_id = ?
		)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(recordID, assetID, userID)
	return err
}

// UpdateAssetRecord updates a specific asset record
func UpdateAssetRecord(recordID, assetID, userID int64, date string, amount float64) (*models.AssetRecord, error) {
	stmt, err := db.Prepare(`
		UPDATE asset_records 
		SET date = ?, amount = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND asset_id = ? AND asset_id IN (
			SELECT id FROM assets WHERE user_id = ?
		)
	`)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	_, err = stmt.Exec(date, amount, recordID, assetID, userID)
	if err != nil {
		return nil, err
	}

	// Return the updated record
	var record models.AssetRecord
	row := db.QueryRow(`
		SELECT id, asset_id, date, amount, created_at, updated_at 
		FROM asset_records 
		WHERE id = ?
	`, recordID)

	err = row.Scan(&record.ID, &record.AssetID, &record.Date, &record.Amount, &record.CreatedAt, &record.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// GetAssetCategories retrieves all asset categories for a specific user
func GetAssetCategories(userID int64) ([]models.AssetCategory, error) {
	rows, err := db.Query(`
		SELECT id, user_id, name, icon, type 
		FROM asset_categories 
		WHERE user_id = ? 
		ORDER BY type, name
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.AssetCategory
	for rows.Next() {
		var category models.AssetCategory
		err := rows.Scan(&category.ID, &category.UserID, &category.Name, &category.Icon, &category.Type)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, nil
}

// CreateAssetCategory creates a new asset category
func CreateAssetCategory(userID int64, name, icon, categoryType string) (*models.AssetCategory, error) {
	stmt, err := db.Prepare(`
		INSERT INTO asset_categories (user_id, name, icon, type) 
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	result, err := stmt.Exec(userID, name, icon, categoryType)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &models.AssetCategory{
		ID:     id,
		UserID: userID,
		Name:   name,
		Icon:   icon,
		Type:   categoryType,
	}, nil
}

// UpdateAssetCategory updates an existing asset category
func UpdateAssetCategory(categoryID, userID int64, name, icon, categoryType string) (*models.AssetCategory, error) {
	stmt, err := db.Prepare(`
		UPDATE asset_categories 
		SET name = ?, icon = ?, type = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND user_id = ?
	`)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	_, err = stmt.Exec(name, icon, categoryType, categoryID, userID)
	if err != nil {
		return nil, err
	}

	return &models.AssetCategory{
		ID:     categoryID,
		UserID: userID,
		Name:   name,
		Icon:   icon,
		Type:   categoryType,
	}, nil
}

// DeleteAssetCategory deletes an asset category
func DeleteAssetCategory(categoryID, userID int64) error {
	stmt, err := db.Prepare("DELETE FROM asset_categories WHERE id = ? AND user_id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(categoryID, userID)
	return err
}

// GetAssetCategoryByID retrieves a specific asset category by ID
func GetAssetCategoryByID(categoryID, userID int64) (*models.AssetCategory, error) {
	var category models.AssetCategory
	err := db.QueryRow(`
		SELECT id, user_id, name, icon, type 
		FROM asset_categories 
		WHERE id = ? AND user_id = ?
	`, categoryID, userID).Scan(&category.ID, &category.UserID, &category.Name, &category.Icon, &category.Type)

	if err != nil {
		return nil, err
	}
	return &category, nil
}

// InitializeDefaultTransactionCategories creates default transaction categories for a new user
func InitializeDefaultTransactionCategories(userID int64) error {
	// Default expense categories
	expenseCategories := []struct {
		Key  string
		Name string
		Icon string
	}{
		{"food", "餐饮", "🍽️"},
		{"shopping", "购物", "🛍️"},
		{"clothing", "服饰", "👗"},
		{"daily", "日用", "🏠"},
		{"digital", "数码", "📱"},
		{"beauty", "美妆", "💄"},
		{"skincare", "护肤", "🧴"},
		{"software", "应用软件", "💻"},
		{"housing", "住房", "🏡"},
		{"transport", "交通", "🚗"},
		{"entertainment", "娱乐", "🎮"},
		{"medical", "医疗", "🏥"},
		{"communication", "通讯", "📞"},
		{"car", "汽车", "🚙"},
		{"education", "学习", "📚"},
		{"office", "办公", "🏢"},
		{"sports", "运动", "⚽"},
		{"social", "社交", "👥"},
		{"gifts", "人情", "🎁"},
		{"childcare", "育儿", "👶"},
		{"pets", "宠物", "🐕"},
		{"travel", "旅行", "✈️"},
		{"vacation", "度假", "🏖️"},
		{"tobacco_alcohol", "烟酒", "🍺"},
		{"lottery", "彩票", "🎲"},
	}

	// Default income categories
	incomeCategories := []struct {
		Key  string
		Name string
		Icon string
	}{
		{"salary", "工资", "💰"},
		{"bonus", "奖金", "🎯"},
		{"overtime", "加班", "⏰"},
		{"benefits", "福利", "🎁"},
		{"fund", "公积金", "🏦"},
		{"gift_money", "红包", "🧧"},
		{"part_time", "兼职", "👔"},
		{"side_business", "副业", "💼"},
		{"tax_refund", "退税", "📄"},
		{"investment", "投资", "📈"},
		{"windfall", "意外收入", "💸"},
		{"other_income", "其他", "❓"},
	}

	// Insert expense categories
	for _, cat := range expenseCategories {
		_, err := db.Exec(`
			INSERT OR IGNORE INTO transaction_categories (user_id, key, name, icon, type, is_default) 
			VALUES (?, ?, ?, ?, 'expense', true)
		`, userID, cat.Key, cat.Name, cat.Icon)
		if err != nil {
			return err
		}
	}

	// Insert income categories
	for _, cat := range incomeCategories {
		_, err := db.Exec(`
			INSERT OR IGNORE INTO transaction_categories (user_id, key, name, icon, type, is_default) 
			VALUES (?, ?, ?, ?, 'income', true)
		`, userID, cat.Key, cat.Name, cat.Icon)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetTransactionCategories retrieves transaction categories for a user
func GetTransactionCategories(userID int64) (map[string][]models.Category, error) {
	rows, err := db.Query(`
		SELECT id, key, name, icon, type 
		FROM transaction_categories 
		WHERE user_id = ? 
		ORDER BY id
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string][]models.Category{
		"expense": {},
		"income":  {},
	}

	for rows.Next() {
		var category models.Category
		var categoryType string
		err := rows.Scan(&category.ID, &category.Key, &category.Name, &category.Icon, &categoryType)
		if err != nil {
			return nil, err
		}

		result[categoryType] = append(result[categoryType], category)
	}

	return result, nil
}

// CreateTransactionCategory creates a new transaction category
func CreateTransactionCategory(userID int64, key, name, icon, categoryType string) (*models.Category, error) {
	_, err := db.Exec(`
		INSERT INTO transaction_categories (user_id, key, name, icon, type, is_default) 
		VALUES (?, ?, ?, ?, ?, false)
	`, userID, key, name, icon, categoryType)
	if err != nil {
		return nil, err
	}

	return &models.Category{
		Key:  key,
		Name: name,
		Icon: icon,
	}, nil
}

// UpdateTransactionCategory updates an existing transaction category
func UpdateTransactionCategory(userID int64, key, name, icon, categoryType string) (*models.Category, error) {
	_, err := db.Exec(`
		UPDATE transaction_categories 
		SET name = ?, icon = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE user_id = ? AND key = ? AND type = ?
	`, name, icon, userID, key, categoryType)
	if err != nil {
		return nil, err
	}

	return &models.Category{
		Key:  key,
		Name: name,
		Icon: icon,
	}, nil
}

// DeleteTransactionCategory deletes a transaction category (only non-default ones)
func DeleteTransactionCategory(userID int64, key, categoryType string) error {
	_, err := db.Exec(`
		DELETE FROM transaction_categories 
		WHERE user_id = ? AND key = ? AND type = ? AND is_default = false
	`, userID, key, categoryType)
	return err
}

// GetAutoTransactions retrieves all auto transactions for a user
func GetAutoTransactions(userID int64) ([]models.AutoTransaction, error) {
	rows, err := db.Query(`
		SELECT id, user_id, type, amount, category_key, description, frequency, 
		       day_of_month, day_of_week, next_execution_date, last_execution_date,
		       is_active, created_at, updated_at
		FROM auto_transactions 
		WHERE user_id = ?
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return []models.AutoTransaction{}, err
	}
	defer rows.Close()

	// Initialize with empty slice to ensure we return [] instead of null
	autoTransactions := make([]models.AutoTransaction, 0)
	for rows.Next() {
		var at models.AutoTransaction
		var lastExecutionDate *string

		err := rows.Scan(
			&at.ID, &at.UserID, &at.Type, &at.Amount, &at.CategoryKey,
			&at.Description, &at.Frequency, &at.DayOfMonth, &at.DayOfWeek,
			&at.NextExecutionDate, &lastExecutionDate, &at.IsActive,
			&at.CreatedAt, &at.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable last_execution_date
		if lastExecutionDate != nil {
			parsedDate, err := time.Parse("2006-01-02 15:04:05", *lastExecutionDate)
			if err == nil {
				at.LastExecutionDate = &parsedDate
			}
		}

		autoTransactions = append(autoTransactions, at)
	}

	return autoTransactions, nil
}

// CreateAutoTransaction creates a new auto transaction
func CreateAutoTransaction(at models.AutoTransaction) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO auto_transactions (
			user_id, type, amount, category_key, description, frequency,
			day_of_month, day_of_week, next_execution_date, is_active,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, at.UserID, at.Type, at.Amount, at.CategoryKey, at.Description, at.Frequency,
		at.DayOfMonth, at.DayOfWeek, at.NextExecutionDate, at.IsActive,
		time.Now(), time.Now())

	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// UpdateAutoTransaction updates an existing auto transaction
func UpdateAutoTransaction(at models.AutoTransaction) error {
	_, err := db.Exec(`
		UPDATE auto_transactions SET
			type = ?, amount = ?, category_key = ?, description = ?,
			frequency = ?, day_of_month = ?, day_of_week = ?,
			next_execution_date = ?, is_active = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`, at.Type, at.Amount, at.CategoryKey, at.Description, at.Frequency,
		at.DayOfMonth, at.DayOfWeek, at.NextExecutionDate, at.IsActive,
		time.Now(), at.ID, at.UserID)

	return err
}

// DeleteAutoTransaction deletes an auto transaction
func DeleteAutoTransaction(userID, id int64) error {
	_, err := db.Exec(`
		DELETE FROM auto_transactions 
		WHERE id = ? AND user_id = ?
	`, id, userID)
	return err
}

// ToggleAutoTransaction toggles the active status of an auto transaction
func ToggleAutoTransaction(userID, id int64) error {
	_, err := db.Exec(`
		UPDATE auto_transactions SET
			is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
			updated_at = ?
		WHERE id = ? AND user_id = ?
	`, time.Now(), id, userID)
	return err
}

// GetDueAutoTransactions retrieves auto transactions that are due for execution
func GetDueAutoTransactions() ([]models.AutoTransaction, error) {
	rows, err := db.Query(`
		SELECT id, user_id, type, amount, category_key, description, frequency, 
		       day_of_month, day_of_week, next_execution_date, last_execution_date,
		       is_active, created_at, updated_at
		FROM auto_transactions 
		WHERE is_active = 1 AND next_execution_date <= ?
		ORDER BY next_execution_date ASC
	`, time.Now())
	if err != nil {
		return []models.AutoTransaction{}, err
	}
	defer rows.Close()

	// Initialize with empty slice to ensure we return [] instead of null
	autoTransactions := make([]models.AutoTransaction, 0)
	for rows.Next() {
		var at models.AutoTransaction
		var lastExecutionDate *string

		err := rows.Scan(
			&at.ID, &at.UserID, &at.Type, &at.Amount, &at.CategoryKey,
			&at.Description, &at.Frequency, &at.DayOfMonth, &at.DayOfWeek,
			&at.NextExecutionDate, &lastExecutionDate, &at.IsActive,
			&at.CreatedAt, &at.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle nullable last_execution_date
		if lastExecutionDate != nil {
			parsedDate, err := time.Parse("2006-01-02 15:04:05", *lastExecutionDate)
			if err == nil {
				at.LastExecutionDate = &parsedDate
			}
		}

		autoTransactions = append(autoTransactions, at)
	}

	return autoTransactions, nil
}

// UpdateAutoTransactionExecution updates the execution dates after processing
func UpdateAutoTransactionExecution(id int64, nextExecutionDate time.Time) error {
	_, err := db.Exec(`
		UPDATE auto_transactions SET
			last_execution_date = ?,
			next_execution_date = ?,
			updated_at = ?
		WHERE id = ?
	`, time.Now(), nextExecutionDate, time.Now(), id)
	return err
}

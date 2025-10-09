package scheduler

import (
	"log"
	"time"

	"mini-money/internal/database"
	"mini-money/internal/models"
)

// AutoBillingScheduler handles the execution of auto transactions
type AutoBillingScheduler struct {
	stopCh chan struct{}
}

// NewAutoBillingScheduler creates a new auto billing scheduler
func NewAutoBillingScheduler() *AutoBillingScheduler {
	return &AutoBillingScheduler{
		stopCh: make(chan struct{}),
	}
}

// Start begins the auto billing scheduler
func (s *AutoBillingScheduler) Start() {
	log.Println("Starting auto billing scheduler...")

	// Check every hour for due auto transactions
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run immediately on startup
	s.processAutoTransactions()

	for {
		select {
		case <-ticker.C:
			s.processAutoTransactions()
		case <-s.stopCh:
			log.Println("Auto billing scheduler stopped")
			return
		}
	}
}

// Stop stops the auto billing scheduler
func (s *AutoBillingScheduler) Stop() {
	close(s.stopCh)
}

// processAutoTransactions processes all due auto transactions
func (s *AutoBillingScheduler) processAutoTransactions() {
	log.Println("Checking for due auto transactions...")

	dueTransactions, err := database.GetDueAutoTransactions()
	if err != nil {
		log.Printf("Error getting due auto transactions: %v", err)
		return
	}

	for _, autoTx := range dueTransactions {
		if err := s.executeAutoTransaction(autoTx); err != nil {
			log.Printf("Error executing auto transaction %d: %v", autoTx.ID, err)
			continue
		}

		// Update next execution date
		nextDate := s.calculateNextExecutionDate(autoTx)
		if err := database.UpdateAutoTransactionExecution(autoTx.ID, nextDate); err != nil {
			log.Printf("Error updating auto transaction %d execution date: %v", autoTx.ID, err)
		}

		log.Printf("Successfully executed auto transaction %d for user %d", autoTx.ID, autoTx.UserID)
	}

	if len(dueTransactions) > 0 {
		log.Printf("Processed %d auto transactions", len(dueTransactions))
	}
}

// executeAutoTransaction creates a new transaction based on the auto transaction
func (s *AutoBillingScheduler) executeAutoTransaction(autoTx models.AutoTransaction) error {
	transaction := models.Transaction{
		UserID:      autoTx.UserID,
		Description: autoTx.Description,
		Amount:      autoTx.Amount,
		Type:        autoTx.Type,
		CategoryKey: autoTx.CategoryKey,
		Date:        time.Now(),
	}

	err := database.InsertTransaction(&transaction)
	return err
}

// calculateNextExecutionDate calculates the next execution date based on frequency
func (s *AutoBillingScheduler) calculateNextExecutionDate(autoTx models.AutoTransaction) time.Time {
	switch autoTx.Frequency {
	case "daily":
		return autoTx.NextExecutionDate.AddDate(0, 0, 1)
	case "weekly":
		return autoTx.NextExecutionDate.AddDate(0, 0, 7)
	case "monthly":
		return autoTx.NextExecutionDate.AddDate(0, 1, 0)
	case "yearly":
		return autoTx.NextExecutionDate.AddDate(1, 0, 0)
	default:
		return autoTx.NextExecutionDate.AddDate(0, 0, 1) // Default to daily
	}
}

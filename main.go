package main

import (
	"log"

	"mini-money/internal/config"
	"mini-money/internal/database"
	"mini-money/internal/routes"
)

func main() {
	// Get configuration
	cfg := config.GetDefaultConfig()

	// Initialize database
	if err := database.Init(cfg); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.Close()

	// Setup routes
	router := routes.SetupRoutes()

	// Start server
	log.Printf("Server starting on http://%s%s", cfg.Server.Host, cfg.Server.Port)
	if err := router.Run(cfg.Server.Port); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}

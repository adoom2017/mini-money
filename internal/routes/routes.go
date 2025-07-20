package routes

import (
	"mini-money/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes
func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// Serve static files
	router.Static("/assets", "./frontend")

	// API routes
	api := router.Group("/api")
	{
		api.GET("/transactions", handlers.GetTransactions)
		api.POST("/transactions", handlers.AddTransaction)
		api.DELETE("/transactions/:id", handlers.DeleteTransaction)
		api.GET("/summary", handlers.GetSummary)
		api.GET("/categories", handlers.GetCategories)
		api.GET("/statistics", handlers.GetStatistics)
	}

	// Serve frontend for all other routes
	router.NoRoute(func(c *gin.Context) {
		c.File("./frontend/index.html")
	})

	return router
}

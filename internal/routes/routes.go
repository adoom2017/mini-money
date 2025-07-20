package routes

import (
	"mini-money/internal/handlers"
	"mini-money/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes
func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// Serve static files
	router.Static("/assets", "./frontend")

	// Auth routes (public)
	auth := router.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// Public API routes
	router.GET("/api/categories", handlers.GetCategories)

	// Protected API routes
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/transactions", handlers.GetTransactions)
		api.POST("/transactions", handlers.AddTransaction)
		api.DELETE("/transactions/:id", handlers.DeleteTransaction)
		api.GET("/summary", handlers.GetSummary)
		api.GET("/statistics", handlers.GetStatistics)
	}

	// Serve frontend for all other routes
	router.NoRoute(func(c *gin.Context) {
		c.File("./frontend/index.html")
	})

	return router
}

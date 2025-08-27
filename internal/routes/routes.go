package routes

import (
	"mini-money/internal/handlers"
	"mini-money/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes
func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// Serve static files from Vite build output
	router.Static("/assets", "./frontend/assets")

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
		api.GET("/user/profile", handlers.GetUserProfile)
		api.PUT("/user/avatar", handlers.UpdateUserAvatar)
		api.PUT("/user/password", handlers.UpdateUserPassword)
		api.PUT("/user/email", handlers.UpdateUserEmail)
		api.GET("/transactions", handlers.GetTransactions)
		api.POST("/transactions", handlers.AddTransaction)
		api.DELETE("/transactions/:id", handlers.DeleteTransaction)
		api.GET("/summary", handlers.GetSummary)
		api.GET("/statistics", handlers.GetStatistics)
		// Asset routes
		api.GET("/assets", handlers.GetAssets)
		api.POST("/assets", handlers.CreateAsset)
		api.DELETE("/assets/:id", handlers.DeleteAsset)
		api.POST("/assets/:id/records", handlers.CreateAssetRecord)
		api.PUT("/assets/:id/records/:recordId", handlers.UpdateAssetRecord)
		api.DELETE("/assets/:id/records/:recordId", handlers.DeleteAssetRecord)
		// Asset category routes
		api.GET("/asset-categories", handlers.GetAssetCategories)
		api.POST("/asset-categories", handlers.CreateAssetCategory)
		api.POST("/asset-categories/initialize-defaults", handlers.InitializeDefaultCategories)
		api.PUT("/asset-categories/:id", handlers.UpdateAssetCategory)
		api.DELETE("/asset-categories/:id", handlers.DeleteAssetCategory)
	}

	// Serve frontend for all other routes
	router.NoRoute(func(c *gin.Context) {
		c.File("./frontend/index.html")
	})

	return router
}

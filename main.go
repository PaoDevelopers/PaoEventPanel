package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/keren/pao-event-panel/config"
	"github.com/keren/pao-event-panel/internal/database"
	"github.com/keren/pao-event-panel/internal/router"
)

func main() {
	config.Load()

	gin.SetMode(config.AppConfig.GinMode)

	if err := database.InitDB(config.AppConfig.DBDriver, config.AppConfig.DBDSN); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	database.Seed()

	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}

	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	r := gin.Default()
	r.MaxMultipartMemory = 5 << 20 // 5 MB

	router.Setup(r)

	// Serve frontend static files (production)
	if _, err := os.Stat("web/dist"); err == nil {
		r.Static("/assets", "./web/dist/assets")
		r.StaticFile("/favicon.ico", "./web/dist/favicon.ico")
		r.NoRoute(func(c *gin.Context) {
			c.File("./web/dist/index.html")
		})
	}

	log.Printf("Server starting on :%s", config.AppConfig.Port)
	if err := r.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

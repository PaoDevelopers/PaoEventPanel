package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DBDriver          string
	DBDSN             string
	JWTSecret         string
	SuperAdminPasskey string
	GinMode           string
}

var AppConfig *Config

func Load() {
	_ = godotenv.Load()

	AppConfig = &Config{
		Port:              getEnv("PORT", "8080"),
		DBDriver:          getEnv("DB_DRIVER", "sqlite"),
		DBDSN:             getEnv("DB_DSN", "data/pao_event.db"),
		JWTSecret:         getEnv("JWT_SECRET", "change-me-in-production"),
		SuperAdminPasskey: os.Getenv("SUPER_ADMIN_PASSKEY"),
		GinMode:           getEnv("GIN_MODE", "debug"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

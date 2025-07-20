package config

// Config holds application configuration
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port string `json:"port"`
	Host string `json:"host"`
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Path string `json:"path"`
}

// GetDefaultConfig returns default configuration
func GetDefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: ":8080",
			Host: "localhost",
		},
		Database: DatabaseConfig{
			Path: "./finance.db",
		},
	}
}

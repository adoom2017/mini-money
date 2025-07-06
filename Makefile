# Makefile for the Go Bookkeeping App (Cross-platform)

ifeq ($(OS),Windows_NT)
	SHELL := cmd.exe
	.SHELLFLAGS := /c

	# Windows specific settings
	BINARY_NAME=app-record.exe
	MKDIR_CMD=mkdir
	CP_CMD=xcopy /S /I /Y /Q
	RMDIR_CMD=rd /s /q
else
	# Linux specific settings
	BINARY_NAME=app-record
	MKDIR_CMD=mkdir -p
	CP_CMD=cp -r
	RMDIR_CMD=rm -rf
	RUN_CMD=./
endif

# Variables
BUILD_DIR=build
FRONTEND_DIR=frontend
EXECUTABLE=$(BUILD_DIR)/$(BINARY_NAME)

# Default target: 'all' will be executed if you just run 'make'
all: build

# Build the application
build:
	@echo "==> Creating build directory..."
	@if not exist "$(BUILD_DIR)" $(MKDIR_CMD) "$(BUILD_DIR)"
	@echo "==> Compiling Go application..."
	@go build -o "$(EXECUTABLE)" .
	@echo "==> Copying frontend assets..."
	@$(CP_CMD) "$(FRONTEND_DIR)" "$(BUILD_DIR)/$(FRONTEND_DIR)"
	@echo "Build complete. Executable is at $(EXECUTABLE)"

# Run the application
run: build
	@echo "==> Starting application..."
	"$(EXECUTABLE)"

# Clean up build artifacts
clean:
	@echo "==> Cleaning up build artifacts..."
	@$(RMDIR_CMD) "$(BUILD_DIR)"
	@echo "Cleanup complete."

# .PHONY declares targets that are not actual files.
.PHONY: all build run clean
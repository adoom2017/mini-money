# Mini Money - Copilot Instructions

## Repository Overview

**Mini Money (极简记账应用)** is a full-stack personal finance application with a Go backend and React frontend. The application provides transaction tracking, category management, data visualization, and asset management with user authentication.

### Technology Stack
- **Backend**: Go 1.24+ with Gin framework, SQLite database, JWT authentication
- **Frontend**: React 18 with Vite build tool, Bootstrap 5, Chart.js for visualization
- **Database**: SQLite with CGO-enabled driver (modernc.org/sqlite)
- **Deployment**: Docker with multi-stage builds, nginx proxy support

### Repository Size & Structure
- **Small codebase**: ~30 source files, well-organized monorepo
- **Backend**: `internal/` directory with clean architecture (handlers, models, database, auth, middleware)
- **Frontend**: Standard React project in `frontend/` directory
- **No existing tests**: Repository currently has no test infrastructure

## Build & Validation Instructions

### Environment Requirements
- **Go**: 1.19+ (tested with 1.24+)
- **Node.js**: 16+ (tested with 20.19.4)
- **CGO**: Required for SQLite driver compilation

### Backend Build Process
**Always run these commands in order:**
```bash
cd /home/runner/work/mini-money/mini-money
go mod tidy                    # Always run first to ensure dependencies
go build -o mini-money .       # Builds binary (takes ~30 seconds)
mkdir -p data                  # REQUIRED: Create data directory before running
./mini-money                   # Runs on localhost:8080
```

**Critical Requirements:**
- The `data/` directory **must exist** before running the application
- CGO is enabled by default and required for SQLite compilation
- Database file is created automatically at `./data/finance.db`

### Frontend Build Process
```bash
cd frontend
npm ci                         # Install exact dependency versions (takes ~10 seconds)
npm run build                  # Builds to frontend/dist/ (takes ~5 seconds)
npm run dev                    # Development server on localhost:3000 (optional)
```

**Notes:**
- Frontend build outputs to `frontend/dist/`
- The backend serves frontend static files from `/assets/*` route
- Development server includes API proxy to backend on port 8080

### Docker Build (Alternative)
```bash
docker build -t mini-money .   # Multi-stage build (~2 minutes)
docker run -p 8080:8080 -v $(pwd)/data:/app/data mini-money
```

### Validation Commands
```bash
# Test backend compilation
go build -o test-binary . && rm test-binary

# Test frontend compilation  
cd frontend && npm run build

# Check API endpoints (when server running)
curl http://localhost:8080/api/categories

# Verify database initialization
ls -la data/  # Should contain finance.db after first run
```

## Project Layout & Architecture

### Backend Architecture (`internal/`)
```
internal/
├── auth/auth.go           # JWT token generation/validation, password hashing
├── config/config.go       # Application configuration (server port, database path)
├── database/database.go   # SQLite operations, table creation, CRUD functions
├── handlers/handlers.go   # HTTP request handlers for all API endpoints
├── middleware/           # Authentication middleware for protected routes
├── models/models.go      # Data structures for User, Transaction, Asset, etc.
└── routes/routes.go      # Gin route definitions and middleware setup
```

### Frontend Architecture (`frontend/src/`)
```
src/
├── App.jsx               # Main React component with routing
├── main.jsx             # React application entry point
├── styles.css           # Global styles
├── components/          # Reusable React components
└── utils/
    └── translations.js  # Multi-language support (English/Chinese)
```

### Configuration Files
- `go.mod/go.sum`: Go dependency management
- `frontend/package.json`: Node.js dependencies and build scripts
- `frontend/vite.config.js`: Vite build configuration with API proxy
- `Dockerfile`: Multi-stage build (frontend → backend → runtime)
- `docker-compose.yml`: Full application stack with nginx
- `nginx.conf`: Reverse proxy configuration

### API Endpoints
**Authentication:** `/api/auth/login`, `/api/auth/register`  
**Transactions:** `/api/transactions` (GET, POST, DELETE)  
**Categories:** `/api/categories` (GET)  
**Statistics:** `/api/summary`, `/api/statistics`  
**Assets:** `/api/assets/*` (Full CRUD)  
**User Profile:** `/api/user/profile`, `/api/user/avatar`, `/api/user/password`

### Database Schema
- **users**: User accounts with authentication
- **transactions**: Financial transaction records with categories
- **assets**: Asset management with historical records
- **SQLite**: Single file database at `./data/finance.db`

## Key Development Guidelines

### Making Changes
1. **Always create `data/` directory** before testing backend changes
2. **Run `go mod tidy`** after modifying Go dependencies
3. **Use `npm ci`** instead of `npm install` for reproducible frontend builds
4. **Test both build processes** after making structural changes
5. **Backend serves frontend** - no separate deployment needed

### Common Issues & Solutions
- **"unable to open database file: out of memory"**: Create `data/` directory
- **CGO compilation errors**: Ensure build environment has gcc and sqlite-dev
- **Frontend proxy errors**: Ensure backend is running on port 8080
- **Git ignore**: `data/`, `*.db`, `frontend/dist/`, `frontend/node_modules/` are ignored

### File Locations for Common Tasks
- **Add API endpoint**: `internal/handlers/handlers.go` + `internal/routes/routes.go`
- **Database schema**: `internal/database/database.go` (createTable function)
- **Authentication logic**: `internal/auth/auth.go`
- **Frontend routing**: `frontend/src/App.jsx`
- **UI components**: `frontend/src/components/`

### Environment Variables
- `GIN_MODE=release`: Production mode for Gin framework
- Default server: `localhost:8080`
- Default database: `./data/finance.db`

## Trust These Instructions

These instructions are comprehensive and tested. Only search for additional information if:
1. Specific error messages are not covered above
2. You need to understand detailed implementation logic
3. The repository structure has changed significantly

**Focus on the build commands and directory requirements** - they are critical for success.
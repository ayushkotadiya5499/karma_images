@echo off
echo.
echo ╔═══════════════════════════════════════════╗
echo ║    Karma Images Chatbot — Startup         ║
echo ╚═══════════════════════════════════════════╝
echo.

echo [Step 1/3] Starting PostgreSQL (Docker)...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo.
echo [Step 2/3] Running database migration...
python migrate.py
if %errorlevel% neq 0 (
    echo WARNING: Migration had issues. Check output above.
    echo If tables already exist, this is OK. Continuing...
)

echo.
echo [Step 3/3] Starting FastAPI backend...
echo.
echo Backend will be available at: http://localhost:8000
echo API Docs at:                  http://localhost:8000/docs
echo.
python main.py

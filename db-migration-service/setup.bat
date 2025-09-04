@echo off
echo ==========================================
echo   Database Migration Service Setup
echo ==========================================
echo.

echo 1. Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 2. Creating .env file from template...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file and replace YOUR-PASSWORD with actual Supabase password
) else (
    echo ℹ️  .env file already exists
)

echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit .env file and set your actual database password
echo 2. Run: npm run test-connections
echo 3. Run: npm run migrate
echo.
pause

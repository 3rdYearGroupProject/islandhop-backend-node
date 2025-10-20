@echo off
echo ========================================
echo    IslandHop Backend Services Manager
echo ========================================
echo.
echo Please choose an option:
echo 1. Install dependencies and run all services
echo 2. Run all services without installing dependencies
echo 3. Install dependencies only (without running services)
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" (
    echo.
    echo Installing dependencies and starting all services...
    echo.
    call :install_and_run
) else if "%choice%"=="2" (
    echo.
    echo Starting all services without installing dependencies...
    echo.
    call :run_only
) else if "%choice%"=="3" (
    echo.
    echo Installing dependencies only...
    echo.
    call :install_only
) else (
    echo.
    echo Invalid choice. Please run the script again and choose 1, 2, or 3.
    pause
    exit /b
)

echo.
echo All services have been started in separate windows!
echo.
echo Services and their default ports:
echo - Active Trips Service: Port 5006
echo - Complete Trip Service: Port 5007
echo - Route Service: Port 3001
echo - Schedule Service: Port 5005
echo - Scoring Service: Port 4000
echo - Support Agent Service: Port 8061
echo - Verification Service: Port 8060
echo - Panic Alerts Service: Port 5000
echo - Email Service: Port varies
echo - User Service: Port 5001
echo - Guide Microservice: Port 5002
echo - Driver Microservice: Port 5003
echo - DB Migration Service: Port 5004
echo - API Gateway: Port 3000
echo - Payment Service: Port varies
echo - Pooling Confirm Service: Port 8074
echo - Finished Trips Service: Port 4015
echo - Admin Subservice: Port 8070
echo - Bank Transfer Service: Port 4021
echo - Data Migration Service: Port varies
echo - Location Sharing Service: Port 5008
echo.
echo Press any key to exit...
pause >nul
exit /b

:install_and_run
echo ========================================
echo Installing dependencies sequentially...
echo ========================================
echo.

echo [1/21] Installing dependencies for Active Trips Service...
cd active-trips
npm install
cd ..

echo [2/21] Installing dependencies for Complete Trip Service...
cd complete-trip-service
npm install
cd ..

echo [3/21] Installing dependencies for Route Service...
cd route-service
npm install
cd ..

echo [4/21] Installing dependencies for Schedule Service...
cd schedule-service
npm install
cd ..

echo [5/21] Installing dependencies for Scoring Service...
cd scoring-service
npm install
cd ..

echo [6/21] Installing dependencies for Support Agent Service...
cd support-agent-service
npm install
cd ..

echo [7/21] Installing dependencies for Verification Service...
cd verification-service
npm install
cd ..

echo [8/21] Installing dependencies for Panic Alerts Service...
cd panic-alerts-service
npm install
cd ..

echo [9/21] Installing dependencies for Email Service...
cd email-service
npm install
cd ..

echo [10/21] Installing dependencies for User Service...
cd user-service
npm install
cd ..

echo [11/21] Installing dependencies for Guide Microservice...
cd guide-microservice
npm install
cd ..

echo [12/21] Installing dependencies for Driver Microservice...
cd driver-microservice
npm install
cd ..

echo [13/21] Installing dependencies for DB Migration Service...
cd db-migration-service
npm install
cd ..

echo [14/21] Installing dependencies for API Gateway...
cd api-gateway
npm install
cd ..

echo [15/21] Installing dependencies for Payment Service...
cd payment-service
npm install
cd ..

echo [16/21] Installing dependencies for Pooling Confirm Service...
cd pooling-confirm
npm install
cd ..

echo [17/21] Installing dependencies for Finished Trips Service...
cd finished-trips-service
npm install
cd ..

echo [18/21] Installing dependencies for Admin Subservice...
cd admin-subservice
npm install
cd ..

echo [19/21] Installing dependencies for Bank Transfer Service...
cd bank-transfer
npm install
cd ..

echo [20/21] Installing dependencies for Data Migration Service...
cd data-migration-service
npm install
cd ..

echo [21/21] Installing dependencies for Location Sharing Service...
cd location-sharing-service
npm install
cd ..

echo.
echo ========================================
echo All dependencies installed successfully!
echo Now starting all services...
echo ========================================
echo.

call :run_only
goto :eof

:run_only
echo Starting Active Trips Service...
cd active-trips
start "Active Trips Service - Run Only" cmd /k "prompt ActiveTrips$G $P$G && npm run dev"
cd ..

echo Starting Complete Trip Service...
cd complete-trip-service
start "Complete Trip Service - Run Only" cmd /k "prompt CompleteTrip$G $P$G && npm run dev"
cd ..

echo Starting Route Service...
cd route-service
start "Route Service - Run Only" cmd /k "prompt RouteService$G $P$G && npm run dev"
cd ..

echo Starting Schedule Service...
cd schedule-service
start "Schedule Service - Run Only" cmd /k "prompt ScheduleService$G $P$G && npm run dev"
cd ..

echo Starting Scoring Service...
cd scoring-service
start "Scoring Service - Run Only" cmd /k "prompt ScoringService$G $P$G && npm run dev"
cd ..

echo Starting Support Agent Service...
cd support-agent-service
start "Support Agent Service - Run Only" cmd /k "prompt SupportAgent$G $P$G && npm run dev"
cd ..

echo Starting Verification Service...
cd verification-service
start "Verification Service - Run Only" cmd /k "prompt VerificationService$G $P$G && npm run dev"
cd ..

echo Starting Panic Alerts Service...
cd panic-alerts-service
start "Panic Alerts Service - Run Only" cmd /k "prompt PanicAlerts$G $P$G && npm run dev"
cd ..

echo Starting Email Service...
cd email-service
start "Email Service - Run Only" cmd /k "prompt EmailService$G $P$G && npm run dev"
cd ..

echo Starting User Service...
cd user-service
start "User Service - Run Only" cmd /k "prompt UserService$G $P$G && npm run dev"
cd ..

echo Starting Guide Microservice...
cd guide-microservice
start "Guide Microservice - Run Only" cmd /k "prompt GuideMicroservice$G $P$G && npm run dev"
cd ..

echo Starting Driver Microservice...
cd driver-microservice
start "Driver Microservice - Run Only" cmd /k "prompt DriverMicroservice$G $P$G && npm run dev"
cd ..

echo Starting DB Migration Service...
cd db-migration-service
start "DB Migration Service - Run Only" cmd /k "prompt DBMigrationService$G $P$G && npm run dev"
cd ..

echo Starting API Gateway...
cd api-gateway
start "API Gateway - Run Only" cmd /k "prompt APIGateway$G $P$G && npm run dev"
cd ..

echo Starting Payment Service...
cd payment-service
start "Payment Service - Run Only" cmd /k "prompt PaymentService$G $P$G && npm run dev"
cd ..

echo Starting Pooling Confirm Service...
cd pooling-confirm
start "Pooling Confirm Service - Run Only" cmd /k "prompt PoolingConfirm$G $P$G && npm run dev"
cd ..

echo Starting Finished Trips Service...
cd finished-trips-service
start "Finished Trips Service - Run Only" cmd /k "prompt FinishedTrips$G $P$G && npm run dev"
cd ..

echo Starting Admin Subservice...
cd admin-subservice
start "Admin Subservice - Run Only" cmd /k "prompt AdminSubservice$G $P$G && npm run dev"
cd ..

echo Starting Bank Transfer Service...
cd bank-transfer
start "Bank Transfer Service - Run Only" cmd /k "prompt BankTransfer$G $P$G && npm run dev"
cd ..

echo Starting Data Migration Service...
cd data-migration-service
start "Data Migration Service - Run Only" cmd /k "prompt DataMigration$G $P$G && npm run dev"
cd ..

echo Starting Location Sharing Service...
cd location-sharing-service
start "Location Sharing Service - Run Only" cmd /k "prompt LocationSharing$G $P$G && npm run dev"
cd ..

goto :eof

:install_only
echo ========================================
echo Installing dependencies sequentially...
echo ========================================
echo.

echo [1/21] Installing dependencies for Active Trips Service...
cd active-trips
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Active Trips Service
cd ..

echo [2/21] Installing dependencies for Complete Trip Service...
cd complete-trip-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Complete Trip Service
cd ..

echo [3/21] Installing dependencies for Route Service...
cd route-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Route Service
cd ..

echo [4/21] Installing dependencies for Schedule Service...
cd schedule-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Schedule Service
cd ..

echo [5/21] Installing dependencies for Scoring Service...
cd scoring-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Scoring Service
cd ..

echo [6/21] Installing dependencies for Support Agent Service...
cd support-agent-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Support Agent Service
cd ..

echo [7/21] Installing dependencies for Verification Service...
cd verification-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Verification Service
cd ..

echo [8/21] Installing dependencies for Panic Alerts Service...
cd panic-alerts-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Panic Alerts Service
cd ..

echo [9/21] Installing dependencies for Email Service...
cd email-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Email Service
cd ..

echo [10/21] Installing dependencies for User Service...
cd user-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for User Service
cd ..

echo [11/21] Installing dependencies for Guide Microservice...
cd guide-microservice
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Guide Microservice
cd ..

echo [12/21] Installing dependencies for Driver Microservice...
cd driver-microservice
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Driver Microservice
cd ..

echo [13/21] Installing dependencies for DB Migration Service...
cd db-migration-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for DB Migration Service
cd ..

echo [14/21] Installing dependencies for API Gateway...
cd api-gateway
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for API Gateway
cd ..

echo [15/21] Installing dependencies for Payment Service...
cd payment-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Payment Service
cd ..

echo [16/21] Installing dependencies for Pooling Confirm Service...
cd pooling-confirm
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Pooling Confirm Service
cd ..

echo [17/21] Installing dependencies for Finished Trips Service...
cd finished-trips-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Finished Trips Service
cd ..

echo [18/21] Installing dependencies for Admin Subservice...
cd admin-subservice
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Admin Subservice
cd ..

echo [19/21] Installing dependencies for Bank Transfer Service...
cd bank-transfer
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Bank Transfer Service
cd ..

echo [20/21] Installing dependencies for Data Migration Service...
cd data-migration-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Data Migration Service
cd ..

echo [21/21] Installing dependencies for Location Sharing Service...
cd location-sharing-service
npm install
if %errorlevel% neq 0 echo ERROR: Failed to install dependencies for Location Sharing Service
cd ..

echo.
echo ========================================
echo Dependencies installation completed!
echo ========================================
echo.
echo You can now run option 2 to start all services.
goto :eof
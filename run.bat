@echo off
echo ========================================
echo    IslandHop Backend Services Manager
echo ========================================
echo.
echo Please choose an option:
echo 1. Install dependencies and run all services
echo 2. Run all services without installing dependencies
echo.
set /p choice="Enter your choice (1 or 2): "

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
) else (
    echo.
    echo Invalid choice. Please run the script again and choose 1 or 2.
    pause
    exit /b
)

echo.
echo All services have been started in separate windows!
echo.
echo Services and their default ports:
echo - Active Trips Service: Port 5006
echo - Complete Trip Service: Port 5007
echo - Route Service: Port 3000
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
echo - API Gateway: Port 8000
echo - Payment Service: Port varies
echo - Pooling Confirm Service: Port varies
echo - Finished Trips Service: Port 4015
echo - Admin Subservice: Port varies
echo - Bank Transfer Service: Port varies
echo - Data Migration Service: Port varies
echo.
echo Press any key to exit...
pause >nul
exit /b

:install_and_run
echo Starting Active Trips Service with install...
cd active-trips
start "Active Trips Service - Install & Run" cmd /k "prompt ActiveTrips$G $P$G && npm install && npm run dev"
cd ..

echo Starting Complete Trip Service with install...
cd complete-trip-service
start "Complete Trip Service - Install & Run" cmd /k "prompt CompleteTrip$G $P$G && npm install && npm run dev"
cd ..

echo Starting Route Service with install...
cd route-service
start "Route Service - Install & Run" cmd /k "prompt RouteService$G $P$G && npm install && npm run dev"
cd ..

echo Starting Schedule Service with install...
cd schedule-service
start "Schedule Service - Install & Run" cmd /k "prompt ScheduleService$G $P$G && npm install && npm run dev"
cd ..

echo Starting Scoring Service with install...
cd scoring-service
start "Scoring Service - Install & Run" cmd /k "prompt ScoringService$G $P$G && npm install && npm run dev"
cd ..

echo Starting Support Agent Service with install...
cd support-agent-service
start "Support Agent Service - Install & Run" cmd /k "prompt SupportAgent$G $P$G && npm install && npm run dev"
cd ..

echo Starting Verification Service with install...
cd verification-service
start "Verification Service - Install & Run" cmd /k "prompt VerificationService$G $P$G && npm install && npm run dev"
cd ..

echo Starting Panic Alerts Service with install...
cd panic-alerts-service
start "Panic Alerts Service - Install & Run" cmd /k "prompt PanicAlerts$G $P$G && npm install && npm run dev"
cd ..

echo Starting Email Service with install...
cd email-service
start "Email Service - Install & Run" cmd /k "prompt EmailService$G $P$G && npm install && npm run dev"
cd ..

echo Starting User Service with install...
cd user-service
start "User Service - Install & Run" cmd /k "prompt UserService$G $P$G && npm install && npm run dev"
cd ..

echo Starting Guide Microservice with install...
cd guide-microservice
start "Guide Microservice - Install & Run" cmd /k "prompt GuideMicroservice$G $P$G && npm install && npm run dev"
cd ..

echo Starting Driver Microservice with install...
cd driver-microservice
start "Driver Microservice - Install & Run" cmd /k "prompt DriverMicroservice$G $P$G && npm install && npm run dev"
cd ..

echo Starting DB Migration Service with install...
cd db-migration-service
start "DB Migration Service - Install & Run" cmd /k "prompt DBMigrationService$G $P$G && npm install && npm run dev"
cd ..

echo Starting API Gateway with install...
cd api-gateway
start "API Gateway - Install & Run" cmd /k "prompt APIGateway$G $P$G && npm install && npm run dev"
cd ..

echo Starting Payment Service with install...
cd payment-service
start "Payment Service - Install & Run" cmd /k "prompt PaymentService$G $P$G && npm install && npm run dev"
cd ..

echo Starting Pooling Confirm Service with install...
cd pooling-confirm
start "Pooling Confirm Service - Install & Run" cmd /k "prompt PoolingConfirm$G $P$G && npm install && npm run dev"
cd ..

echo Starting Finished Trips Service with install...
cd finished-trips-service
start "Finished Trips Service - Install & Run" cmd /k "prompt FinishedTrips$G $P$G && npm install && npm run dev"
cd ..

echo Starting Admin Subservice with install...
cd admin-subservice
start "Admin Subservice - Install & Run" cmd /k "prompt AdminSubservice$G $P$G && npm install && npm run dev"
cd ..

echo Starting Bank Transfer Service with install...
cd bank-transfer
start "Bank Transfer Service - Install & Run" cmd /k "prompt BankTransfer$G $P$G && npm install && npm run dev"
cd ..

echo Starting Data Migration Service with install...
cd data-migration-service
start "Data Migration Service - Install & Run" cmd /k "prompt DataMigration$G $P$G && npm install && npm run dev"
cd ..

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

goto :eof
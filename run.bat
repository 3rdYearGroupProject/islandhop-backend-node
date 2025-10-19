@echo off
echo ========================================
echo    IslandHop Backend Services Manager
echo ========================================
echo.
echo Please choose an option:
echo 1. Install dependencies and run all services
echo 2. Run all services without installing dependencies
echo 3. Build all services (optimized production build)
echo 4. Run production builds
echo.
set /p choice="Enter your choice (1, 2, 3, or 4): "

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
    echo Building all services for production...
    echo.
    call :build_all
) else if "%choice%"=="4" (
    echo.
    echo Running production builds...
    echo.
    call :run_production
) else (
    echo.
    echo Invalid choice. Please run the script again and choose 1, 2, 3, or 4.
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

:build_all
echo Building Active Trips Service...
cd active-trips
start "Active Trips Service - Build" cmd /k "prompt ActiveTrips$G $P$G && npm install && npm run build"
cd ..

echo Building Complete Trip Service...
cd complete-trip-service
start "Complete Trip Service - Build" cmd /k "prompt CompleteTrip$G $P$G && npm install && npm run build"
cd ..

echo Building Route Service...
cd route-service
start "Route Service - Build" cmd /k "prompt RouteService$G $P$G && npm install && npm run build"
cd ..

echo Building Schedule Service...
cd schedule-service
start "Schedule Service - Build" cmd /k "prompt ScheduleService$G $P$G && npm install && npm run build"
cd ..

echo Building Scoring Service...
cd scoring-service
start "Scoring Service - Build" cmd /k "prompt ScoringService$G $P$G && npm install && npm run build"
cd ..

echo Building Support Agent Service...
cd support-agent-service
start "Support Agent Service - Build" cmd /k "prompt SupportAgent$G $P$G && npm install && npm run build"
cd ..

echo Building Verification Service...
cd verification-service
start "Verification Service - Build" cmd /k "prompt VerificationService$G $P$G && npm install && npm run build"
cd ..

echo Building Panic Alerts Service...
cd panic-alerts-service
start "Panic Alerts Service - Build" cmd /k "prompt PanicAlerts$G $P$G && npm install && npm run build"
cd ..

echo Building Email Service...
cd email-service
start "Email Service - Build" cmd /k "prompt EmailService$G $P$G && npm install && npm run build"
cd ..

echo Building User Service...
cd user-service
start "User Service - Build" cmd /k "prompt UserService$G $P$G && npm install && npm run build"
cd ..

echo Building Guide Microservice...
cd guide-microservice
start "Guide Microservice - Build" cmd /k "prompt GuideMicroservice$G $P$G && npm install && npm run build"
cd ..

echo Building Driver Microservice...
cd driver-microservice
start "Driver Microservice - Build" cmd /k "prompt DriverMicroservice$G $P$G && npm install && npm run build"
cd ..

echo Building DB Migration Service...
cd db-migration-service
start "DB Migration Service - Build" cmd /k "prompt DBMigrationService$G $P$G && npm install && npm run build"
cd ..

echo Building API Gateway...
cd api-gateway
start "API Gateway - Build" cmd /k "prompt APIGateway$G $P$G && npm install && npm run build"
cd ..

echo Building Payment Service...
cd payment-service
start "Payment Service - Build" cmd /k "prompt PaymentService$G $P$G && npm install && npm run build"
cd ..

echo Building Pooling Confirm Service...
cd pooling-confirm
start "Pooling Confirm Service - Build" cmd /k "prompt PoolingConfirm$G $P$G && npm install && npm run build"
cd ..

echo Building Finished Trips Service...
cd finished-trips-service
start "Finished Trips Service - Build" cmd /k "prompt FinishedTrips$G $P$G && npm install && npm run build"
cd ..

echo Building Admin Subservice...
cd admin-subservice
start "Admin Subservice - Build" cmd /k "prompt AdminSubservice$G $P$G && npm install && npm run build"
cd ..

echo Building Bank Transfer Service...
cd bank-transfer
start "Bank Transfer Service - Build" cmd /k "prompt BankTransfer$G $P$G && npm install && npm run build"
cd ..

echo Building Data Migration Service...
cd data-migration-service
start "Data Migration Service - Build" cmd /k "prompt DataMigration$G $P$G && npm install && npm run build"
cd ..

goto :eof

:run_production
echo Starting Active Trips Service (Production)...
cd active-trips
start "Active Trips Service - Production" cmd /k "prompt ActiveTrips$G $P$G && npm start"
cd ..

echo Starting Complete Trip Service (Production)...
cd complete-trip-service
start "Complete Trip Service - Production" cmd /k "prompt CompleteTrip$G $P$G && npm start"
cd ..

echo Starting Route Service (Production)...
cd route-service
start "Route Service - Production" cmd /k "prompt RouteService$G $P$G && npm start"
cd ..

echo Starting Schedule Service (Production)...
cd schedule-service
start "Schedule Service - Production" cmd /k "prompt ScheduleService$G $P$G && npm start"
cd ..

echo Starting Scoring Service (Production)...
cd scoring-service
start "Scoring Service - Production" cmd /k "prompt ScoringService$G $P$G && npm start"
cd ..

echo Starting Support Agent Service (Production)...
cd support-agent-service
start "Support Agent Service - Production" cmd /k "prompt SupportAgent$G $P$G && npm start"
cd ..

echo Starting Verification Service (Production)...
cd verification-service
start "Verification Service - Production" cmd /k "prompt VerificationService$G $P$G && npm start"
cd ..

echo Starting Panic Alerts Service (Production)...
cd panic-alerts-service
start "Panic Alerts Service - Production" cmd /k "prompt PanicAlerts$G $P$G && npm start"
cd ..

echo Starting Email Service (Production)...
cd email-service
start "Email Service - Production" cmd /k "prompt EmailService$G $P$G && npm start"
cd ..

echo Starting User Service (Production)...
cd user-service
start "User Service - Production" cmd /k "prompt UserService$G $P$G && npm start"
cd ..

echo Starting Guide Microservice (Production)...
cd guide-microservice
start "Guide Microservice - Production" cmd /k "prompt GuideMicroservice$G $P$G && npm start"
cd ..

echo Starting Driver Microservice (Production)...
cd driver-microservice
start "Driver Microservice - Production" cmd /k "prompt DriverMicroservice$G $P$G && npm start"
cd ..

echo Starting DB Migration Service (Production)...
cd db-migration-service
start "DB Migration Service - Production" cmd /k "prompt DBMigrationService$G $P$G && npm start"
cd ..

echo Starting API Gateway (Production)...
cd api-gateway
start "API Gateway - Production" cmd /k "prompt APIGateway$G $P$G && npm start"
cd ..

echo Starting Payment Service (Production)...
cd payment-service
start "Payment Service - Production" cmd /k "prompt PaymentService$G $P$G && npm start"
cd ..

echo Starting Pooling Confirm Service (Production)...
cd pooling-confirm
start "Pooling Confirm Service - Production" cmd /k "prompt PoolingConfirm$G $P$G && npm start"
cd ..

echo Starting Finished Trips Service (Production)...
cd finished-trips-service
start "Finished Trips Service - Production" cmd /k "prompt FinishedTrips$G $P$G && npm start"
cd ..

echo Starting Admin Subservice (Production)...
cd admin-subservice
start "Admin Subservice - Production" cmd /k "prompt AdminSubservice$G $P$G && npm start"
cd ..

echo Starting Bank Transfer Service (Production)...
cd bank-transfer
start "Bank Transfer Service - Production" cmd /k "prompt BankTransfer$G $P$G && npm start"
cd ..

echo Starting Data Migration Service (Production)...
cd data-migration-service
start "Data Migration Service - Production" cmd /k "prompt DataMigration$G $P$G && npm start"
cd ..

goto :eof
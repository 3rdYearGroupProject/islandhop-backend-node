@echo off
echo ========================================
echo Installing dependencies for all services
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
echo All dependencies have been installed successfully.
echo You can now use the main run.bat file with option 2 to start all services.
echo.
pause
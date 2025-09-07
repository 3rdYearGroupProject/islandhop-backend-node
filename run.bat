@echo off
echo Starting all IslandHop backend services...
echo.

echo Installing dependencies and starting Active Trips Service...
cd active-trips
start "Active Trips Service - Install & Run" cmd /k "prompt ActiveTrips$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Complete Trip Service...
cd complete-trip-service
start "Complete Trip Service - Install & Run" cmd /k "prompt CompleteTrip$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Route Service...
cd route-service
start "Route Service - Install & Run" cmd /k "prompt RouteService$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Schedule Service...
cd schedule-service
start "Schedule Service - Install & Run" cmd /k "prompt ScheduleService$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Scoring Service...
cd scoring-service
start "Scoring Service - Install & Run" cmd /k "prompt ScoringService$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Support Agent Service...
cd support-agent-service
start "Support Agent Service - Install & Run" cmd /k "prompt SupportAgent$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Verification Service...
cd verification-service
start "Verification Service - Install & Run" cmd /k "prompt VerificationService$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Panic Alerts Service...
cd panic-alerts-service
start "Panic Alerts Service - Install & Run" cmd /k "prompt PanicAlerts$G $P$G && npm install && npm run dev"
cd ..

echo Installing dependencies and starting Email Service...
cd email-service
start "Email Service - Install & Run" cmd /k "prompt EmailService$G $P$G && npm install && npm run dev"
cd ..

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
echo.
echo Press any key to exit...
pause >nul
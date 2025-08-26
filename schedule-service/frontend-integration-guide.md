# Frontend Integration Guide - Schedule Service

This guide provides comprehensive examples for integrating with the Schedule Service API endpoints using JavaScript and React. The service runs on `http://localhost:5005`.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [API Service Class](#api-service-class)
3. [React Hook Examples](#react-hook-examples)
4. [Component Examples](#component-examples)
5. [Error Handling](#error-handling)
6. [TypeScript Definitions](#typescript-definitions)

## Setup and Configuration

### Install Dependencies

```bash
npm install axios
```

### Environment Variables

Create a `.env` file in your frontend project:

```env
REACT_APP_SCHEDULE_SERVICE_URL=http://localhost:5005
```

## API Service Class

Create a service class to handle all API calls:

```javascript
// services/scheduleService.js
import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_SCHEDULE_SERVICE_URL || "http://localhost:5005";

class ScheduleService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(
          `Making ${config.method.toUpperCase()} request to: ${config.url}`
        );
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error.response?.data || error);
      }
    );
  }

  // Health check
  async healthCheck() {
    return await this.api.get("/schedule/health");
  }

  // Mark days as unavailable
  async markUnavailable(userType, email, dates) {
    return await this.api.post(`/schedule/${userType}/mark-unavailable`, {
      email,
      dates,
    });
  }

  // Mark days as available (unmark)
  async unmarkAvailable(userType, email, dates) {
    return await this.api.post(`/schedule/${userType}/unmark-available`, {
      email,
      dates,
    });
  }

  // Lock days (with optional trip ID)
  async lockDays(userType, email, dates, tripId = null) {
    const payload = { email, dates };
    if (tripId) {
      payload.tripId = tripId;
    }
    return await this.api.post(`/schedule/${userType}/lock`, payload);
  }

  // Get available days for a month
  async getAvailableDays(userType, email, month) {
    return await this.api.get(`/schedule/${userType}/available`, {
      params: { email, month },
    });
  }
}

export default new ScheduleService();
```

## React Hook Examples

### Custom Hook for Schedule Management

```javascript
// hooks/useSchedule.js
import { useState, useEffect, useCallback } from "react";
import scheduleService from "../services/scheduleService";

export const useSchedule = (userType, email) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get schedule for a specific month
  const getSchedule = useCallback(
    async (month) => {
      if (!userType || !email || !month) return;

      setLoading(true);
      setError(null);

      try {
        const response = await scheduleService.getAvailableDays(
          userType,
          email,
          month
        );
        setSchedule(response.data);
      } catch (err) {
        setError(err.message || "Failed to fetch schedule");
      } finally {
        setLoading(false);
      }
    },
    [userType, email]
  );

  // Mark days as unavailable
  const markUnavailable = async (dates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await scheduleService.markUnavailable(
        userType,
        email,
        dates
      );
      return response;
    } catch (err) {
      setError(err.message || "Failed to mark days unavailable");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mark days as available
  const markAvailable = async (dates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await scheduleService.unmarkAvailable(
        userType,
        email,
        dates
      );
      return response;
    } catch (err) {
      setError(err.message || "Failed to mark days available");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lock days
  const lockDays = async (dates, tripId = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await scheduleService.lockDays(
        userType,
        email,
        dates,
        tripId
      );
      return response;
    } catch (err) {
      setError(err.message || "Failed to lock days");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    schedule,
    loading,
    error,
    getSchedule,
    markUnavailable,
    markAvailable,
    lockDays,
    setError,
  };
};
```

### Health Check Hook

```javascript
// hooks/useHealthCheck.js
import { useState, useEffect } from "react";
import scheduleService from "../services/scheduleService";

export const useHealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await scheduleService.healthCheck();
        setIsHealthy(true);
        setHealthData(response);
      } catch (error) {
        setIsHealthy(false);
        console.error("Health check failed:", error);
      } finally {
        setChecking(false);
      }
    };

    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, healthData, checking };
};
```

## Component Examples

### Calendar Component

```jsx
// components/ScheduleCalendar.jsx
import React, { useState, useEffect } from "react";
import { useSchedule } from "../hooks/useSchedule";

const ScheduleCalendar = ({ userType, email, initialMonth }) => {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || "2025-09");
  const [selectedDates, setSelectedDates] = useState([]);
  const {
    schedule,
    loading,
    error,
    getSchedule,
    markUnavailable,
    markAvailable,
    lockDays,
  } = useSchedule(userType, email);

  useEffect(() => {
    getSchedule(selectedMonth);
  }, [selectedMonth, getSchedule]);

  const handleDateSelect = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleMarkUnavailable = async () => {
    if (selectedDates.length === 0) return;

    try {
      await markUnavailable(selectedDates);
      await getSchedule(selectedMonth); // Refresh
      setSelectedDates([]);
      alert("Days marked as unavailable successfully!");
    } catch (error) {
      alert("Failed to mark days unavailable: " + error.message);
    }
  };

  const handleMarkAvailable = async () => {
    if (selectedDates.length === 0) return;

    try {
      await markAvailable(selectedDates);
      await getSchedule(selectedMonth); // Refresh
      setSelectedDates([]);
      alert("Days marked as available successfully!");
    } catch (error) {
      alert("Failed to mark days available: " + error.message);
    }
  };

  const handleLockDays = async () => {
    if (selectedDates.length === 0) return;

    const tripId = prompt("Enter Trip ID (optional):");

    try {
      await lockDays(selectedDates, tripId || null);
      await getSchedule(selectedMonth); // Refresh
      setSelectedDates([]);
      alert("Days locked successfully!");
    } catch (error) {
      alert("Failed to lock days: " + error.message);
    }
  };

  if (loading && !schedule) return <div>Loading schedule...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="schedule-calendar">
      <div className="calendar-header">
        <h2>
          Schedule for {userType}: {email}
        </h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>

      {schedule && (
        <>
          <div className="calendar-summary">
            <p>Total Days: {schedule.summary.totalDays}</p>
            <p>Available: {schedule.summary.available}</p>
            <p>Unavailable: {schedule.summary.unavailable}</p>
            <p>Locked: {schedule.summary.locked}</p>
          </div>

          <div className="calendar-grid">
            {schedule.schedule.map((day) => (
              <div
                key={day.date}
                className={`calendar-day ${day.status} ${
                  selectedDates.includes(day.date) ? "selected" : ""
                }`}
                onClick={() => handleDateSelect(day.date)}
              >
                <div className="day-number">{new Date(day.date).getDate()}</div>
                <div className="day-status">{day.status}</div>
                {day.tripId && (
                  <div className="trip-id">Trip: {day.tripId}</div>
                )}
              </div>
            ))}
          </div>

          <div className="calendar-actions">
            <button
              onClick={handleMarkUnavailable}
              disabled={selectedDates.length === 0 || loading}
            >
              Mark Unavailable
            </button>
            <button
              onClick={handleMarkAvailable}
              disabled={selectedDates.length === 0 || loading}
            >
              Mark Available
            </button>
            <button
              onClick={handleLockDays}
              disabled={selectedDates.length === 0 || loading}
            >
              Lock Days
            </button>
          </div>

          {selectedDates.length > 0 && (
            <div className="selected-dates">
              Selected dates: {selectedDates.join(", ")}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScheduleCalendar;
```

### Health Status Component

```jsx
// components/HealthStatus.jsx
import React from "react";
import { useHealthCheck } from "../hooks/useHealthCheck";

const HealthStatus = () => {
  const { isHealthy, healthData, checking } = useHealthCheck();

  if (checking) return <div>Checking service health...</div>;

  return (
    <div className={`health-status ${isHealthy ? "healthy" : "unhealthy"}`}>
      <div className="status-indicator">
        {isHealthy ? "🟢" : "🔴"} Schedule Service:{" "}
        {isHealthy ? "Online" : "Offline"}
      </div>
      {healthData && (
        <div className="health-details">
          <small>Version: {healthData.version}</small>
        </div>
      )}
    </div>
  );
};

export default HealthStatus;
```

### Quick Actions Component

```jsx
// components/QuickActions.jsx
import React, { useState } from "react";
import scheduleService from "../services/scheduleService";

const QuickActions = ({ userType, email, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const quickMarkUnavailable = async (daysFromNow) => {
    setLoading(true);
    setMessage("");

    try {
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysFromNow);

      const dateStr = targetDate.toISOString().split("T")[0];

      const response = await scheduleService.markUnavailable(userType, email, [
        dateStr,
      ]);
      setMessage(`Successfully marked ${dateStr} as unavailable`);
      onUpdate && onUpdate();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const quickLockWeek = async () => {
    setLoading(true);
    setMessage("");

    try {
      const today = new Date();
      const dates = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split("T")[0]);
      }

      const tripId = `WEEK_${Date.now()}`;
      const response = await scheduleService.lockDays(
        userType,
        email,
        dates,
        tripId
      );
      setMessage(`Successfully locked next 7 days with trip ID: ${tripId}`);
      onUpdate && onUpdate();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>

      <div className="action-buttons">
        <button onClick={() => quickMarkUnavailable(0)} disabled={loading}>
          Mark Today Unavailable
        </button>

        <button onClick={() => quickMarkUnavailable(1)} disabled={loading}>
          Mark Tomorrow Unavailable
        </button>

        <button onClick={quickLockWeek} disabled={loading}>
          Lock Next Week
        </button>
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("Error") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default QuickActions;
```

## Error Handling

### Error Utility Functions

```javascript
// utils/errorHandling.js
export const handleApiError = (error, defaultMessage = "An error occurred") => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || defaultMessage;
  } else if (error.request) {
    // Request was made but no response received
    return "Service is currently unavailable. Please try again later.";
  } else {
    // Something else happened
    return error.message || defaultMessage;
  }
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date) && !isNaN(new Date(date).getTime());
};

export const isValidMonth = (month) => {
  const monthRegex = /^\d{4}-\d{2}$/;
  return monthRegex.test(month);
};
```

## TypeScript Definitions

```typescript
// types/schedule.ts
export interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  status: "available" | "unavailable" | "locked";
  tripId?: string | null;
}

export interface ScheduleSummary {
  totalDays: number;
  available: number;
  unavailable: number;
  locked: number;
}

export interface ScheduleData {
  email: string;
  userType: "driver" | "guide";
  month: string;
  schedule: ScheduleDay[];
  availableDays: string[];
  summary: ScheduleSummary;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  results?: any[];
  summary?: any;
}

export interface ScheduleResult {
  date: string;
  success: boolean;
  message: string;
  tripId?: string;
}

export interface HealthData {
  success: boolean;
  message: string;
  timestamp: string;
  service: string;
  version: string;
}
```

## CSS Styles Example

```css
/* styles/schedule.css */
.schedule-calendar {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 20px;
}

.calendar-day {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.calendar-day.available {
  background-color: #e8f5e8;
}

.calendar-day.unavailable {
  background-color: #ffe8e8;
}

.calendar-day.locked {
  background-color: #e8e8ff;
}

.calendar-day.selected {
  border: 2px solid #007bff;
}

.calendar-day:hover {
  opacity: 0.8;
}

.day-number {
  font-weight: bold;
}

.day-status {
  font-size: 0.8em;
  text-transform: capitalize;
}

.trip-id {
  font-size: 0.7em;
  color: #666;
}

.calendar-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.calendar-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}

.calendar-actions button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.health-status.healthy {
  color: green;
}

.health-status.unhealthy {
  color: red;
}

.message.success {
  color: green;
  padding: 10px;
  background-color: #e8f5e8;
  border-radius: 4px;
}

.message.error {
  color: red;
  padding: 10px;
  background-color: #ffe8e8;
  border-radius: 4px;
}
```

## Usage Examples

### Basic App Setup

```jsx
// App.js
import React from "react";
import ScheduleCalendar from "./components/ScheduleCalendar";
import HealthStatus from "./components/HealthStatus";
import QuickActions from "./components/QuickActions";
import "./styles/schedule.css";

function App() {
  const userType = "driver"; // or 'guide'
  const email = "driver@example.com";

  return (
    <div className="App">
      <header>
        <h1>Schedule Management System</h1>
        <HealthStatus />
      </header>

      <main>
        <QuickActions
          userType={userType}
          email={email}
          onUpdate={() => window.location.reload()}
        />

        <ScheduleCalendar
          userType={userType}
          email={email}
          initialMonth="2025-09"
        />
      </main>
    </div>
  );
}

export default App;
```

This guide provides a complete integration solution for frontend applications to interact with the Schedule Service API. All examples include proper error handling, loading states, and user feedback mechanisms.

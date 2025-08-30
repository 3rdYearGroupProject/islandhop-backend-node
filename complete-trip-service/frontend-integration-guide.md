# Frontend Integration Guide - Complete Trip Service

This guide provides comprehensive examples for integrating with the Complete Trip Service API endpoints.

## Base Configuration

```javascript
const API_BASE_URL = "http://localhost:5007/api/trips";
const HEALTH_CHECK_URL = "http://localhost:5007/health";

// Common headers for API requests
const commonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
```

## API Integration Examples

### 1. Health Check

```javascript
// Check if the service is running
const checkServiceHealth = async () => {
  try {
    const response = await fetch("http://localhost:5007/health");
    const data = await response.json();

    if (data.success) {
      console.log("Service is healthy:", data.message);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Service health check failed:", error);
    return false;
  }
};
```

### 2. Trip Management

#### Start Trip

```javascript
const startTrip = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/start-trip`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({ tripId }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Trip started successfully:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Error starting trip:", error);
    throw error;
  }
};

// Usage
startTrip("68adfeac01e20ecea620ef27")
  .then((trip) => {
    // Update UI to show trip has started
    updateTripStatus("started");
  })
  .catch((error) => {
    // Show error message to user
    showErrorMessage("Failed to start trip: " + error.message);
  });
```

#### Confirm Trip Start

```javascript
const confirmTripStart = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/confirm-start`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({ tripId }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Trip start confirmed:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Error confirming trip start:", error);
    throw error;
  }
};
```

#### End Trip

```javascript
const endTrip = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/end-trip`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({ tripId }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Trip ended successfully:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Error ending trip:", error);
    throw error;
  }
};
```

### 3. Daily Trip Management

#### Start Day

```javascript
const startDay = async (tripId, dayNumber, meterReading) => {
  try {
    const response = await fetch(`${API_BASE_URL}/start-day-${dayNumber}`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        tripId,
        metervalue: meterReading,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`Day ${dayNumber} started:`, data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error(`Error starting day ${dayNumber}:`, error);
    throw error;
  }
};

// Usage with form data
const handleStartDay = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const tripId = formData.get("tripId");
  const dayNumber = parseInt(formData.get("dayNumber"));
  const meterReading = parseFloat(formData.get("meterReading"));

  try {
    await startDay(tripId, dayNumber, meterReading);
    // Update UI to reflect day has started
    document.getElementById(`day-${dayNumber}-status`).textContent = "Started";
  } catch (error) {
    alert("Error starting day: " + error.message);
  }
};
```

#### End Day

```javascript
const endDay = async (
  tripId,
  dayNumber,
  endMeterReading,
  deductAmount = 0,
  note = ""
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/end-day-${dayNumber}`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        tripId,
        metervalue: endMeterReading,
        deductvalue: deductAmount,
        note,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`Day ${dayNumber} ended:`, data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error(`Error ending day ${dayNumber}:`, error);
    throw error;
  }
};
```

#### Confirm Day Actions

```javascript
const confirmDayStart = async (tripId, dayNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/confirm-day-${dayNumber}-start`,
      {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({ tripId }),
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error(`Error confirming day ${dayNumber} start:`, error);
    throw error;
  }
};

const confirmDayEnd = async (tripId, dayNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/confirm-day-${dayNumber}-end`,
      {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({ tripId }),
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error(`Error confirming day ${dayNumber} end:`, error);
    throw error;
  }
};
```

### 4. Information Retrieval

#### Get Day Information

```javascript
const getDayInfo = async (tripId, dayNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/day-${dayNumber}-info?tripId=${tripId}`
    );
    const data = await response.json();

    if (data.success) {
      console.log(`Day ${dayNumber} info:`, data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error(`Error getting day ${dayNumber} info:`, error);
    throw error;
  }
};

// Usage for displaying day information
const displayDayInfo = async (tripId, dayNumber) => {
  try {
    const dayInfo = await getDayInfo(tripId, dayNumber);

    // Update UI with day information
    const dayContainer = document.getElementById(`day-${dayNumber}-container`);
    dayContainer.innerHTML = `
      <h3>Day ${dayInfo.day} - ${dayInfo.city}</h3>
      <p>Start Time: ${
        dayInfo.start ? new Date(dayInfo.start).toLocaleString() : "Not started"
      }</p>
      <p>End Time: ${
        dayInfo.end ? new Date(dayInfo.end).toLocaleString() : "Not ended"
      }</p>
      <p>Start Meter: ${dayInfo.start_meter_read}</p>
      <p>End Meter: ${dayInfo.end_meter_read}</p>
      <p>Deduction: ${dayInfo.deduct_amount}</p>
      <p>Note: ${dayInfo.additional_note}</p>
      <p>Status: ${dayInfo.day_complete ? "Completed" : "In Progress"}</p>
    `;
  } catch (error) {
    console.error("Error displaying day info:", error);
  }
};
```

#### Get Total Distance

```javascript
const getTotalDistance = async (tripId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/total-distance?tripId=${tripId}`
    );
    const data = await response.json();

    if (data.success) {
      console.log("Total distance calculation:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Error getting total distance:", error);
    throw error;
  }
};

// Usage for displaying total distance
const displayTotalDistance = async (tripId) => {
  try {
    const distanceData = await getTotalDistance(tripId);

    document.getElementById("total-distance").innerHTML = `
      <h3>Trip Distance Summary</h3>
      <p>Total Distance: ${distanceData.totalDistance} km</p>
      <p>First Day Start: ${distanceData.firstDayStartMeter} km</p>
      <p>Last Day End: ${distanceData.lastDayEndMeter} km</p>
      <p>Total Deductions: ${distanceData.totalDeductions} km</p>
    `;
  } catch (error) {
    console.error("Error displaying total distance:", error);
  }
};
```

### 5. Review System

#### Submit Driver Review

```javascript
const submitDriverReview = async (tripId, rating, reviewText) => {
  try {
    const response = await fetch(`${API_BASE_URL}/driver-review`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        tripId,
        rate: rating,
        review: reviewText,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Driver review submitted:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Error submitting driver review:", error);
    throw error;
  }
};

// Usage with form handling
const handleDriverReviewSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const tripId = formData.get("tripId");
  const rating = parseInt(formData.get("rating"));
  const reviewText = formData.get("review");

  try {
    await submitDriverReview(tripId, rating, reviewText);
    alert("Driver review submitted successfully!");
    e.target.reset();
  } catch (error) {
    alert("Error submitting driver review: " + error.message);
  }
};
```

#### Submit Guide Review

```javascript
const submitGuideReview = async (tripId, rating, reviewText) => {
  try {
    const response = await fetch(`${API_BASE_URL}/guide-review`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        tripId,
        rate: rating,
        review: reviewText,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Guide review submitted:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Error submitting guide review:", error);
    throw error;
  }
};
```

## React Integration Examples

### React Component for Day Management

```jsx
import React, { useState, useEffect } from "react";

const DayManager = ({ tripId, dayNumber }) => {
  const [dayInfo, setDayInfo] = useState(null);
  const [meterReading, setMeterReading] = useState("");
  const [deductAmount, setDeductAmount] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDayInfo();
  }, [tripId, dayNumber]);

  const loadDayInfo = async () => {
    try {
      const info = await getDayInfo(tripId, dayNumber);
      setDayInfo(info);
    } catch (error) {
      console.error("Error loading day info:", error);
    }
  };

  const handleStartDay = async () => {
    setLoading(true);
    try {
      await startDay(tripId, dayNumber, parseFloat(meterReading));
      await loadDayInfo();
      setMeterReading("");
    } catch (error) {
      alert("Error starting day: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDay = async () => {
    setLoading(true);
    try {
      await endDay(
        tripId,
        dayNumber,
        parseFloat(meterReading),
        deductAmount,
        note
      );
      await loadDayInfo();
      setMeterReading("");
      setDeductAmount(0);
      setNote("");
    } catch (error) {
      alert("Error ending day: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="day-manager">
      <h3>
        Day {dayNumber} {dayInfo?.city && `- ${dayInfo.city}`}
      </h3>

      {dayInfo && (
        <div className="day-status">
          <p>Status: {dayInfo.day_complete ? "Completed" : "In Progress"}</p>
          <p>
            Start:{" "}
            {dayInfo.start
              ? new Date(dayInfo.start).toLocaleString()
              : "Not started"}
          </p>
          <p>
            End:{" "}
            {dayInfo.end ? new Date(dayInfo.end).toLocaleString() : "Not ended"}
          </p>
        </div>
      )}

      {!dayInfo?.start && (
        <div className="start-day">
          <input
            type="number"
            placeholder="Starting meter reading"
            value={meterReading}
            onChange={(e) => setMeterReading(e.target.value)}
          />
          <button onClick={handleStartDay} disabled={loading || !meterReading}>
            Start Day
          </button>
        </div>
      )}

      {dayInfo?.start && !dayInfo?.end && (
        <div className="end-day">
          <input
            type="number"
            placeholder="Ending meter reading"
            value={meterReading}
            onChange={(e) => setMeterReading(e.target.value)}
          />
          <input
            type="number"
            placeholder="Deduction amount (optional)"
            value={deductAmount}
            onChange={(e) => setDeductAmount(parseFloat(e.target.value) || 0)}
          />
          <textarea
            placeholder="Additional notes (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={handleEndDay} disabled={loading || !meterReading}>
            End Day
          </button>
        </div>
      )}
    </div>
  );
};

export default DayManager;
```

## Error Handling Best Practices

### Centralized Error Handler

```javascript
const handleApiError = (error, context = "") => {
  console.error(`API Error ${context}:`, error);

  // Check if it's a network error
  if (!navigator.onLine) {
    showUserMessage("No internet connection. Please check your network.");
    return;
  }

  // Check for specific HTTP status codes
  if (error.status === 404) {
    showUserMessage("Resource not found. Please check the trip ID.");
  } else if (error.status === 400) {
    showUserMessage("Invalid request. Please check your input.");
  } else if (error.status >= 500) {
    showUserMessage("Server error. Please try again later.");
  } else {
    showUserMessage("An unexpected error occurred. Please try again.");
  }
};

const showUserMessage = (message) => {
  // Implementation depends on your UI framework
  // Example for vanilla JavaScript:
  const messageDiv = document.getElementById("user-messages");
  messageDiv.innerHTML = `<div class="error-message">${message}</div>`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageDiv.innerHTML = "";
  }, 5000);
};
```

## Request/Response Format Examples

### Successful Response Format

```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Trip Start Response Example

```json
{
  "success": true,
  "data": {
    "_id": "68adfeac01e20ecea620ef27",
    "userId": "J0INIUkpCDNpUHCUkY0xmyPwoEe2",
    "tripName": "testtrip1",
    "started": 1,
    "startconfirmed": 0,
    "ended": 0,
    "endconfirmed": 0,
    "dailyPlans": [
      {
        "day": 1,
        "city": "Kandy",
        "start": null,
        "end": null,
        "start_confirmed": 0,
        "end_confirmed": 0,
        "start_meter_read": 0,
        "end_meter_read": 0,
        "deduct_amount": 0,
        "day_complete": 0,
        "additional_note": ""
      }
    ]
  }
}
```

## Security Considerations

1. **Input Validation**: Always validate input on the frontend before sending to the API
2. **Error Handling**: Don't expose sensitive error information to users
3. **Rate Limiting**: Implement client-side rate limiting for API calls
4. **Authentication**: Add authentication headers when authentication is implemented

## Performance Tips

1. **Debouncing**: Debounce user input to avoid excessive API calls
2. **Caching**: Cache day information to reduce redundant API calls
3. **Loading States**: Always show loading indicators during API calls
4. **Optimistic Updates**: Update UI optimistically, then sync with server

This integration guide provides a complete foundation for working with the Complete Trip Service API in any frontend framework.

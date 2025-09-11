# Enhanced Pooling Confirm Service - Payment Logic Implementation

## 🎯 **Enhanced Payment Model: 50% Upfront + 50% Final**

The service now implements a robust **two-phase payment system** specifically designed for tourism:

### **Phase 1: Upfront Payment (50%)**
- ✅ **Triggered**: After all members confirm participation
- ✅ **Amount**: 50% of total trip cost per person
- ✅ **Deadline**: 48 hours after confirmation (configurable)
- ✅ **Purpose**: Secure booking and commitment

### **Phase 2: Final Payment (50%)**
- ✅ **Triggered**: 7-14 days before trip starts (configurable)
- ✅ **Amount**: Remaining 50% of trip cost
- ✅ **Deadline**: Customizable days before trip
- ✅ **Purpose**: Final preparation and balance settlement

## 🏗 **Business Logic Implementation**

### **Payment Workflow**
```
Trip Confirmed → Upfront Payment Phase → Final Payment Phase → Trip Ready
     ↓               ↓                       ↓                    ↓
All members     50% payment due        Remaining 50% due     Trip can start
confirmed       (48 hours)            (7 days before)
```

### **Partial Payment Handling**
When not all members pay upfront within deadline:

#### **Scenario 1: 75%+ Members Paid**
```javascript
if (paidMembers >= originalMembers * 0.75 && paidMembers >= minMembers) {
  // Activate 24-hour decision period
  // Paid members vote: Continue vs Cancel
  // If continue: Trip proceeds with current members
  // If cancel: Full refunds to all
}
```

#### **Scenario 2: Below Minimum Threshold**
```javascript
if (paidMembers < minMembers) {
  // Automatic cancellation
  // 100% refunds to all paid members
  // Notification sent to all members
}
```

### **Individual Cancellation Policy**
- ✅ **Before Payment Deadline**: 100% refund
- ✅ **After Others Paid**: 15% penalty (85% refund)
- ✅ **Block Cancellation**: If would go below minimum members
- ✅ **Emergency Cancellation**: Majority vote + 72h notice

## 📊 **New Comprehensive Trip Details Endpoint**

### **GET /api/v1/pooling-confirm/:confirmedTripId/details**

This powerful endpoint provides complete trip overview including:

#### **Member Information**
```json
{
  "members": [
    {
      "userId": "user123",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "isCreator": true,
      "hasConfirmed": true,
      "confirmedAt": "2024-12-01T10:00:00Z",
      "paymentStatus": {
        "overall": "partial",
        "totalPaid": 5000,
        "totalDue": 10000,
        "upfront": {
          "amount": 5000,
          "status": "paid",
          "paidAt": "2024-12-01T12:00:00Z",
          "paymentId": "pay_123"
        },
        "final": {
          "amount": 5000,
          "status": "pending",
          "paidAt": null,
          "paymentId": null
        }
      }
    }
  ]
}
```

#### **Payment Statistics**
```json
{
  "paymentInfo": {
    "statistics": {
      "upfront": {
        "paid": 3,
        "pending": 1,
        "failed": 0,
        "totalCollected": 15000
      },
      "final": {
        "paid": 0,
        "pending": 4,
        "failed": 0,
        "totalCollected": 0
      },
      "overall": {
        "fullyPaid": 0,
        "partiallyPaid": 3,
        "notPaid": 1,
        "totalExpected": 40000,
        "totalCollected": 15000
      }
    }
  }
}
```

#### **Timeline Management**
```json
{
  "timeline": {
    "confirmationDeadline": "2024-11-15T10:00:00Z",
    "upfrontPaymentDeadline": "2024-11-17T10:00:00Z",
    "finalPaymentDeadline": "2024-11-24T00:00:00Z",
    "tripStartDate": "2024-12-01T06:00:00Z",
    "daysUntilTrip": 15,
    "daysUntilFinalPayment": 8,
    "isUpfrontPaymentExpired": false,
    "isFinalPaymentExpired": false,
    "isTripStarted": false
  }
}
```

#### **Status Flags**
```json
{
  "flags": {
    "allMembersConfirmed": true,
    "allUpfrontPaid": false,
    "allFinalPaid": false,
    "hasEnoughMembers": true,
    "canStartTrip": false,
    "isReadyForFinalPayment": true
  }
}
```

## 🔄 **Enhanced Status Flow**

```
pending_confirmation
    ↓ (all members confirm)
confirmed
    ↓ (upfront payment phase starts)
payment_pending
    ↓ (75%+ pay OR decision made)
upfront_payment_completed
    ↓ (final payment phase starts)
final_payment_pending
    ↓ (all final payments received)
payment_completed
    ↓ (trip ready to start)
trip_ready
    ↓ (trip date arrives)
trip_started
    ↓ (trip ends)
completed

// Cancellation paths
cancelled_insufficient_members
cancelled_by_vote
cancelled_individual_penalty
```

## 🎮 **API Usage Examples**

### **1. Initiate Confirmation with Enhanced Payment**
```bash
POST /api/v1/pooling-confirm/initiate
{
  "groupId": "group123",
  "userId": "creator456",
  "tripStartDate": "2024-12-01T00:00:00Z",
  "tripEndDate": "2024-12-05T00:00:00Z",
  "pricePerPerson": 20000,
  "upfrontPaymentHours": 48,     # 48 hours for upfront payment
  "finalPaymentDaysBefore": 7,    # 7 days before trip for final payment
  "currency": "LKR"
}
```

### **2. Get Comprehensive Trip Details**
```bash
GET /api/v1/pooling-confirm/67890/details?userId=user123

Response:
{
  "success": true,
  "data": {
    "confirmedTripId": "67890",
    "tripName": "Sri Lanka Adventure",
    "status": "payment_pending",
    "members": [...],           # Detailed member info with payment status
    "paymentInfo": {...},       # Payment statistics and phases
    "timeline": {...},          # All important dates and deadlines
    "flags": {...},             # Status indicators
    "creator": {...},           # Creator information
    "recentActions": [...]      # Last 10 actions/events
  }
}
```

## 🔧 **Configuration Options**

### **Environment Variables**
```env
# Payment Phase Configuration
DEFAULT_UPFRONT_PAYMENT_HOURS=48
DEFAULT_FINAL_PAYMENT_DAYS_BEFORE=7
MINIMUM_MEMBER_PERCENTAGE=75
INDIVIDUAL_CANCELLATION_PENALTY=15

# Decision Period
DECISION_PERIOD_HOURS=24
EMERGENCY_CANCELLATION_NOTICE_HOURS=72

# Payment Integration
PAYMENT_GATEWAY=payhere
PAYMENT_CURRENCY=LKR
```

### **Business Rules Configuration**
```javascript
const paymentRules = {
  upfrontPayment: {
    percentage: 50,
    deadlineHours: 48,
    reminderHours: [24, 6, 1]
  },
  finalPayment: {
    percentage: 50,
    daysBefore: 7,
    reminderDays: [14, 7, 3, 1]
  },
  cancellationPolicy: {
    beforePaymentDeadline: 100,  // 100% refund
    afterOthersPaid: 85,         // 85% refund (15% penalty)
    emergencyCancel: 85          // 85% refund for emergency
  },
  decisionPeriod: {
    triggerThreshold: 0.75,      // 75% must pay to trigger decision
    durationHours: 24,
    requiresVote: true
  }
}
```

## 🚨 **Error Handling & Edge Cases**

### **Payment Deadline Scenarios**
- ✅ **Partial Payment**: Automated decision period activation
- ✅ **No Payments**: Automatic cancellation with notifications
- ✅ **Payment Failures**: Retry mechanisms and failure tracking
- ✅ **Refund Processing**: Automated refund workflows

### **Member Dropout Handling**
- ✅ **Early Dropout**: Full refund policy
- ✅ **Late Dropout**: Penalty-based refund
- ✅ **Below Minimum**: Trip cancellation protection
- ✅ **Emergency Situations**: Flexible cancellation with vote

## 📈 **Frontend Integration Points**

### **Trip Dashboard Components**
1. **Payment Status Cards** - Visual payment progress per member
2. **Timeline Component** - Deadlines and milestones
3. **Member Actions** - Confirm/Pay/Cancel buttons with status
4. **Statistics Overview** - Financial and participation metrics
5. **Decision Voting UI** - When partial payment triggers decision period

### **Notification Triggers**
- ✅ Confirmation reminders
- ✅ Payment deadline approaching
- ✅ Payment successful/failed
- ✅ Decision period activated
- ✅ Trip status changes
- ✅ Cancellation notifications

This enhanced system provides robust financial management for group travel with clear policies, automated workflows, and comprehensive tracking! 🎉

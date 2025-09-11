# Bank Transfer Service - API Testing Guide

## Postman Collection Import

The `BankTransferService.postman_collection.json` file contains a comprehensive collection of API tests for the Bank Transfer microservice.

### How to Import

1. Open Postman
2. Click "Import" button
3. Select "Upload Files"
4. Choose the `BankTransferService.postman_collection.json` file
5. Click "Import"

### Environment Variables

The collection uses the following variables that are pre-configured:

- `base_url`: http://localhost:4021 (change if running on different port)
- `test_email`: test@example.com
- `driver_email`: driver@islandhop.com
- `guide_email`: guide@islandhop.com
- `test_trip_id`: TRIP123

You can modify these in the collection variables or create a Postman environment.

## Test Scenarios Included

### 1. Health Check & Service Info

- **Service Health Check**: Verify service is running
- **Service Info**: Get available endpoints and service details

### 2. Bank Details Management

- **Add Bank Details**: Create new bank account information
- **Add Bank Details - Driver**: Sample driver bank details
- **Add Bank Details - Guide**: Sample guide bank details
- **Get Bank Details by Email**: Retrieve existing bank details
- **Update Bank Details**: Modify existing bank information

### 3. Payment Management

- **Update Driver Payment with Evidence**: Upload payment evidence for driver
- **Update Guide Payment with Evidence**: Upload payment evidence for guide
- **Get Driver Payment Details**: Retrieve driver payment information
- **Get Guide Payment Details**: Retrieve guide payment information
- **Get All Driver Payments**: List all driver payments
- **Get All Guide Payments**: List all guide payments

### 4. Error Testing

- **Missing Fields**: Test validation errors
- **Duplicate Email**: Test duplicate entry handling
- **Non-existent Records**: Test 404 responses
- **Invalid Parameters**: Test parameter validation
- **Missing File Upload**: Test file upload requirements
- **Invalid Endpoints**: Test 404 for wrong URLs

### 5. File Access

- **Access Uploaded Evidence**: Test static file serving

## Testing Workflow

### Prerequisites

Before testing, ensure you have sample data in the payment collections. You can create test documents directly in MongoDB:

```javascript
// For payment-service/drivers collection
{
  "_id": ObjectId(),
  "tripId": "TRIP123",
  "driverEmail": "driver@islandhop.com",
  "cost": 2500,
  "paid": 0,
  "evidence": null,
  "createdAt": new Date(),
  "updatedAt": new Date(),
  "__v": 0
}

// For payment-service/guides collection
{
  "_id": ObjectId(),
  "tripId": "TRIP456",
  "driverEmail": "guide@islandhop.com",
  "cost": 1800,
  "paid": 0,
  "evidence": null,
  "createdAt": new Date(),
  "updatedAt": new Date(),
  "__v": 0
}
```

### Recommended Testing Order

1. **Start with Health Check**

   - Run "Service Health Check" to verify service is running
   - Run "Service Info" to see available endpoints

2. **Test Bank Details Management**

   - Add bank details for different users
   - Retrieve bank details to verify storage
   - Update bank details to test modification
   - Test error scenarios (missing fields, duplicates)

3. **Test Payment Management**

   - Upload payment evidence with valid image files
   - Verify payment status updates (paid = 1)
   - Test retrieval of payment details
   - Test with invalid parameters

4. **Test File Access**
   - After uploading evidence, test file access using the returned file path

### File Upload Testing

For payment evidence upload endpoints:

1. Prepare test image files (JPEG, PNG, GIF format)
2. Use the form-data body type in Postman
3. Select file for the "evidence" field
4. Ensure file size is under 5MB
5. Verify the response includes the file path

### Expected Response Formats

#### Successful Responses

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common Test Assertions

The collection includes automatic tests that verify:

- Response time under 5 seconds
- Proper JSON content type
- Success field in responses
- Error structure for failed requests

### Variables for Dynamic Testing

Update these variables based on your test data:

- Change `test_trip_id` to match existing trip IDs in your database
- Update email addresses to match your test scenarios
- Modify `base_url` if running on different port or host

### Database State Verification

After running tests, verify database changes:

1. Check `users_bank_details` collection for new/updated bank details
2. Verify `payment-service/drivers` and `payment-service/guides` collections for payment updates
3. Check file system `uploads/` directory for uploaded evidence files

### Troubleshooting

**Service Connection Issues:**

- Verify service is running on port 4021
- Check MongoDB connection
- Review service logs for errors

**File Upload Issues:**

- Ensure file format is supported (JPEG, PNG, GIF)
- Check file size is under 5MB limit
- Verify uploads directory has write permissions

**Database Issues:**

- Verify MongoDB connection string
- Check database permissions
- Ensure collections exist with proper structure

**Authentication Issues:**

- Currently no authentication required
- CORS is enabled for all origins

## Sample Test Data

### Bank Details Sample

```json
{
  "email": "testuser@example.com",
  "accountHolderName": "Test User",
  "bankName": "Sample Bank Ltd",
  "accountNumber": "1234567890123",
  "branchCode": "001",
  "branchName": "Main Branch"
}
```

### Payment Record Sample (MongoDB Insert)

```javascript
db.getCollection("payment-service/drivers").insertOne({
  tripId: "TRIP789",
  driverEmail: "newdriver@example.com",
  cost: 3000,
  paid: 0,
  evidence: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0,
});
```

This comprehensive testing setup will help you thoroughly validate all aspects of the Bank Transfer microservice functionality.

# Bank Transfer Microservice

A Node.js microservice for handling bank details and payment evidence management for the Island Hop platform.

## Features

- **Bank Details Management**: Store and manage user bank account information
- **Payment Evidence Handling**: Upload and store payment evidence with image support
- **RESTful API**: Clean REST endpoints for all operations
- **File Upload Support**: Multer integration for image uploads
- **MongoDB Integration**: Mongoose ODM with proper schema validation
- **Error Handling**: Comprehensive error handling and validation
- **CORS Enabled**: Cross-origin resource sharing support

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer
- **CORS**: cors middleware

## Installation

1. Clone the repository
2. Navigate to the bank-transfer directory
3. Install dependencies:

```bash
npm install
```

4. Start the service:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Configuration

- **Port**: 4021
- **MongoDB Connection**: mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/
- **File Upload Directory**: ./uploads
- **Maximum File Size**: 5MB

## API Endpoints

### Health Check

- **GET** `/health` - Service health check

### Bank Details Management

#### Add Bank Details

- **POST** `/bank/add`
- **Content-Type**: application/json
- **Body**:

```json
{
  "email": "user@example.com",
  "accountHolderName": "John Doe",
  "bankName": "Sample Bank",
  "accountNumber": "1234567890",
  "branchCode": "001",
  "branchName": "Main Branch"
}
```

#### Update Bank Details

- **PUT** `/bank/update/:email`
- **Content-Type**: application/json
- **Body**: (any combination of fields to update)

```json
{
  "accountHolderName": "Updated Name",
  "bankName": "Updated Bank",
  "accountNumber": "0987654321",
  "branchCode": "002",
  "branchName": "Updated Branch"
}
```

#### Get Bank Details

- **GET** `/bank/:email`
- **Response**:

```json
{
  "success": true,
  "message": "Bank details retrieved successfully",
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "accountHolderName": "John Doe",
    "bankName": "Sample Bank",
    "accountNumber": "1234567890",
    "branchCode": "001",
    "branchName": "Main Branch",
    "createdAt": "2023-09-09T...",
    "updatedAt": "2023-09-09T..."
  }
}
```

### Payment Management

#### Update Payment Status with Evidence

- **POST** `/payment/update/:role/:tripId`
- **Content-Type**: multipart/form-data
- **Form Data**:
  - `evidence`: Image file (JPEG, JPG, PNG, GIF)
- **Parameters**:
  - `role`: "drivers" or "guides"
  - `tripId`: Trip identifier

#### Get Payment Details

- **GET** `/payment/:role/:tripId`
- **Parameters**:
  - `role`: "drivers" or "guides"
  - `tripId`: Trip identifier

#### Get All Payments by Role

- **GET** `/payment/:role`
- **Parameters**:
  - `role`: "drivers" or "guides"

## Database Schema

### users_bank_details Collection

```javascript
{
  email: String (unique, required),
  accountHolderName: String (required),
  bankName: String (required),
  accountNumber: String (required),
  branchCode: String (required),
  branchName: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### payment-service/drivers & payment-service/guides Collections

```javascript
{
  tripId: String (required),
  driverEmail: String (required),
  cost: Number (default: 0),
  paid: Number (default: 0),
  evidence: String (file path),
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

## File Upload Specifications

- **Allowed Types**: JPEG, JPG, PNG, GIF
- **Maximum Size**: 5MB
- **Storage Location**: ./uploads directory
- **Naming Convention**: evidence-[timestamp]-[random].ext

## Error Handling

The service includes comprehensive error handling for:

- Validation errors
- Duplicate entries
- File upload errors
- Database connection issues
- Invalid parameters
- Missing resources

## Example Usage

### Adding Bank Details

```bash
curl -X POST http://localhost:4021/bank/add \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "accountHolderName": "John Doe",
    "bankName": "National Bank",
    "accountNumber": "1234567890",
    "branchCode": "001",
    "branchName": "Main Branch"
  }'
```

### Updating Payment with Evidence

```bash
curl -X POST http://localhost:4021/payment/update/drivers/TRIP123 \
  -F "evidence=@/path/to/payment-evidence.jpg"
```

## Project Structure

```
bank-transfer/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── bankController.js     # Bank operations logic
│   └── paymentController.js  # Payment operations logic
├── middleware/
│   └── upload.js            # Multer configuration
├── models/
│   ├── BankDetails.js       # Bank details schema
│   └── Payment.js           # Payment schema
├── routes/
│   ├── bankRoutes.js        # Bank API routes
│   └── paymentRoutes.js     # Payment API routes
├── uploads/                 # File storage directory
├── package.json             # Dependencies and scripts
├── server.js               # Application entry point
└── README.md               # This file
```

## Security Considerations

- Input validation on all endpoints
- File type restrictions for uploads
- File size limitations
- Proper error handling without exposing sensitive information
- CORS configuration

## Development

For development:

1. Install nodemon: `npm install -g nodemon`
2. Run: `npm run dev`

The service will restart automatically on file changes.

## Production Deployment

1. Set NODE_ENV=production
2. Configure proper CORS origins
3. Set up proper logging
4. Configure MongoDB connection with appropriate security
5. Set up file storage with proper permissions
6. Configure reverse proxy if needed

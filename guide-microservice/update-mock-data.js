const mongoose = require('mongoose');
const Guide = require('./models/Guide');

const mockGuideData = {
  "_id": "68bc892d63edcd9c24166c69",
  "firebaseUID": "gUiDe123AbC456DeF789",
  "email": "guide@islandhop.lk", // Changed to match existing guide
  "personalInfo": {
    "firstName": "Priyantha",
    "lastName": "Silva",
    "phone": "+94 77 234 5678",
    "dateOfBirth": "1982-07-22",
    "address": "456 Temple Road, Kandy",
    "emergencyContact": {
      "name": "Nimalka Silva",
      "phone": "+94 77 876 5432"
    },
    "profilePicture": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "memberSince": "2021-06-10T00:00:00Z",
    "bio": "Professional tour guide with 15 years of experience in Sri Lankan heritage and cultural tours. Fluent in English, Sinhala, Tamil, and basic German.",
    "languages": [
      "English",
      "Sinhala", 
      "Tamil",
      "German"
    ],
    "specializations": [
      "Cultural Heritage",
      "Temple Tours",
      "Wildlife",
      "Adventure", 
      "Food Tours"
    ],
    "certifications": [
      {
        "name": "SLTDA Certified Tourist Guide",
        "issueDate": "2020-03-15",
        "expiryDate": "2025-03-15"
      },
      {
        "name": "First Aid Certification",
        "issueDate": "2024-01-20",
        "expiryDate": "2026-01-20"
      }
    ]
  },
  "stats": {
    "rating": 4.8,
    "totalTours": 856,
    "completedTours": 823,
    "activeTours": 2,
    "pendingTours": 4,
    "cancelledTours": 33,
    "totalReviews": 687,
    "totalEarnings": 1287650.5,
    "todayEarnings": 1875.5,
    "weeklyEarnings": 18750.5,
    "monthlyEarnings": 74207.75,
    "quarterlyEarnings": 218502.25,
    "completionRate": 96.1,
    "responseRate": 99.1,
    "averagePerTour": 1504.81,
    "totalHours": 3456,
    "totalCustomers": 2847,
    "repeatCustomers": 234,
    "averageGroupSize": 3.3
  },
  "analytics": {
    "performance": {
      "averageRating": 4.8,
      "completionRate": 96.1,
      "earningsChange": 15.8,
      "toursChange": 12.3,
      "hoursChange": -2.1,
      "customersChange": 18.5
    },
    "topTours": [
      {
        "tour": "Kandy Cultural Heritage Tour",
        "bookings": 32,
        "earnings": 480000,
        "avgRating": 4.9
      },
      {
        "tour": "Ella Adventure Trek",
        "bookings": 28,
        "earnings": 504000,
        "avgRating": 4.8
      },
      {
        "tour": "Sigiriya Historical Tour",
        "bookings": 22,
        "earnings": 440000,
        "avgRating": 4.9
      },
      {
        "tour": "Colombo Food Discovery",
        "bookings": 18,
        "earnings": 171000,
        "avgRating": 4.6
      },
      {
        "tour": "Galle Fort Walking Tour",
        "bookings": 15,
        "earnings": 225000,
        "avgRating": 4.7
      }
    ],
    "busyHours": [
      {
        "hour": "6-7 AM",
        "tours": 3,
        "percentage": 15
      },
      {
        "hour": "7-8 AM",
        "tours": 5,
        "percentage": 25
      },
      {
        "hour": "8-9 AM",
        "tours": 8,
        "percentage": 40
      },
      {
        "hour": "9-10 AM",
        "tours": 6,
        "percentage": 30
      },
      {
        "hour": "2-3 PM",
        "tours": 4,
        "percentage": 20
      },
      {
        "hour": "3-4 PM",
        "tours": 7,
        "percentage": 35
      }
    ],
    "weeklyEarnings": [
      {
        "day": "Mon",
        "earnings": 2855.5,
        "tours": 2
      },
      {
        "day": "Tue", 
        "earnings": 3202.25,
        "tours": 2
      },
      {
        "day": "Wed",
        "earnings": 1957.75,
        "tours": 1
      },
      {
        "day": "Thu",
        "earnings": 4555.5,
        "tours": 3
      },
      {
        "day": "Fri",
        "earnings": 2892.25,
        "tours": 2
      },
      {
        "day": "Sat",
        "earnings": 2025.5,
        "tours": 1
      },
      {
        "day": "Sun",
        "earnings": 1267.75,
        "tours": 1
      }
    ],
    "customerInsights": {
      "demographics": [
        {
          "country": "United States",
          "bookings": 28,
          "percentage": 31
        },
        {
          "country": "United Kingdom",
          "bookings": 18,
          "percentage": 20
        },
        {
          "country": "Australia",
          "bookings": 15,
          "percentage": 17
        },
        {
          "country": "Germany",
          "bookings": 12,
          "percentage": 13
        },
        {
          "country": "Canada",
          "bookings": 10,
          "percentage": 11
        },
        {
          "country": "Others",
          "bookings": 6,
          "percentage": 8
        }
      ]
    }
  },
  "tours": {
    "active": [
      {
        "id": "TG001",
        "tourPackage": "Kandy Cultural Heritage Tour",
        "tourist": "Emily Johnson",
        "touristAvatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=687&auto=format&fit=crop",
        "groupSize": 4,
        "startLocation": "Kandy Central",
        "endLocation": "Temple of the Tooth",
        "date": "2025-09-07",
        "startTime": "09:00",
        "endTime": "15:00",
        "duration": "6h 00m",
        "fee": 15000,
        "status": "confirmed",
        "touristRating": 4.9,
        "touristPhone": "+1 555 123 4567",
        "specialRequests": [
          "Vegetarian lunch",
          "Photography focus"
        ],
        "paymentStatus": "paid",
        "createdAt": "2025-09-05T14:20:00Z"
      },
      {
        "id": "TG002",
        "tourPackage": "Ella Adventure Trek", 
        "tourist": "Marco Rodriguez",
        "touristAvatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=687&auto=format&fit=crop",
        "groupSize": 2,
        "startLocation": "Ella Town",
        "endLocation": "Little Adams Peak",
        "date": "2025-09-08",
        "startTime": "06:00",
        "endTime": "14:00",
        "duration": "8h 00m",
        "fee": 18000,
        "status": "confirmed",
        "touristRating": 4.7,
        "touristPhone": "+34 666 123 456",
        "specialRequests": [
          "Early morning start",
          "Photography equipment"
        ],
        "paymentStatus": "paid",
        "createdAt": "2025-09-04T16:45:00Z"
      }
    ],
    "pending": [
      {
        "id": "TG003",
        "tourPackage": "Colombo Food Discovery",
        "tourist": "Sarah Chen",
        "groupSize": 3,
        "date": "2025-09-09",
        "startTime": "10:00",
        "estimatedFee": 9500,
        "requestTime": "2025-09-06T11:30:00Z",
        "touristRating": 4.8,
        "specialRequests": [
          "Vegetarian options",
          "Allergy considerations"
        ],
        "paymentStatus": "pending"
      },
      {
        "id": "TG004",
        "tourPackage": "Sigiriya Historical Tour",
        "tourist": "James Wilson",
        "groupSize": 6,
        "date": "2025-09-10",
        "startTime": "07:30",
        "estimatedFee": 20000,
        "requestTime": "2025-09-06T09:15:00Z",
        "touristRating": 4.9,
        "specialRequests": [
          "Historical focus",
          "Multiple languages"
        ],
        "paymentStatus": "pending"
      }
    ],
    "history": [
      {
        "id": "TG005",
        "tourPackage": "Galle Fort Walking Tour",
        "tourist": "David Kumar",
        "groupSize": 5,
        "startLocation": "Galle Railway Station",
        "endLocation": "Galle Lighthouse",
        "date": "2025-09-04",
        "startTime": "14:00",
        "endTime": "18:00",
        "duration": "4h 00m",
        "fee": 12000,
        "rating": 5,
        "status": "completed",
        "paymentMethod": "card",
        "tip": 1200,
        "notes": "Sunset tour, excellent photography"
      },
      {
        "id": "TG006",
        "tourPackage": "Kandy Cultural Heritage Tour",
        "tourist": "Lisa Thompson",
        "groupSize": 2,
        "date": "2025-09-03",
        "startTime": "09:00",
        "endTime": "15:00",
        "duration": "6h 00m",
        "fee": 15000,
        "rating": 4,
        "status": "completed",
        "paymentMethod": "cash",
        "tip": 1500,
        "notes": "Cultural focus, temple visits"
      }
    ]
  },
  "earnings": {
    "transactions": [
      {
        "tourId": "TG005",
        "tourPackage": "Galle Fort Walking Tour",
        "tourist": "David Kumar",
        "route": "Galle Fort → Lighthouse",
        "amount": 12000,
        "tip": 1200,
        "totalAmount": 13200,
        "paymentMethod": "card",
        "status": "completed",
        "date": "2025-09-04T18:00:00Z"
      },
      {
        "tourId": "TG006",
        "tourPackage": "Kandy Cultural Heritage Tour",
        "tourist": "Lisa Thompson",
        "route": "Kandy Central → Temple of the Tooth",
        "amount": 15000,
        "tip": 1500,
        "totalAmount": 16500,
        "paymentMethod": "cash",
        "status": "completed",
        "date": "2025-09-03T15:00:00Z"
      }
    ]
  },
  "preferences": {
    "pricing": {
      "baseHourlyRate": 2500
    }
  },
  "serviceAreas": {
    "primaryRegions": ["Kandy", "Colombo", "Galle", "Nuwara Eliya"]
  },
  "tourPackages": [
    {
      "basePrice": 15000
    }
  ],
  "status": "active"
};

// Database connection and update function
async function updateMockData() {
  try {
    const mongoURI = 'mongodb+srv://touristdbapp:NDlvfXXjnmKoB8g0@cluster0.cjhgokv.mongodb.net/For_Guides?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Update or insert the guide data
    const result = await Guide.findOneAndUpdate(
      { email: 'guide@islandhop.lk' },
      mockGuideData,
      { upsert: true, new: true }
    );
    
    console.log('✅ Mock data updated successfully!');
    console.log('📊 Updated guide:', result.email);
    console.log('📈 Stats:', {
      totalEarnings: result.stats?.totalEarnings,
      totalTours: result.stats?.totalTours,
      totalHours: result.stats?.totalHours,
      totalCustomers: result.stats?.totalCustomers,
      earningsChange: result.analytics?.performance?.earningsChange
    });
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    
  } catch (error) {
    console.error('❌ Error updating mock data:', error.message);
    process.exit(1);
  }
}

// Run the update
updateMockData();

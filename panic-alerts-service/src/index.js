import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import touristRouter from './routes/touristRoutes.js';
import lostItemsRouter from './routes/lostItemsRoutes.js';
import {connectDatabases} from './db.js';

dotenv.config();
const app = express();

app.use(cors(
  {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
  }
));
app.use(express.json());

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database connections and store them globally
let dbConnections = null;

async function initializeApp() {
  try {
    dbConnections = await connectDatabases();
    console.log('✅ Database connections established');
    
    // Make database connections available globally
    app.locals.dbConnections = dbConnections;
    
    app.use('/tourist', touristRouter);
    app.use('/lost-items', lostItemsRouter);
  } catch (error) {
    console.error('❌ Failed to initialize database connections:', error);
    process.exit(1);
  }
}

initializeApp();

app.get('/', (req, res) => {
  res.json({
    message: 'Panic Alerts Service is running',
    status: 'healthy',
    port: process.env.PORT || 8062,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /lost-items/getLostItems',
      'PATCH /lost-items/updateProgressNotes/:id',
      'POST /tourist/addLostItem'
    ]
  });
});

const PORT = process.env.PORT || 8062;
app.listen(PORT, () => {
  console.log(`✅ Panic Alerts Service running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://localhost:${PORT}`);
  console.log(`🔗 Lost Items API: http://localhost:${PORT}/lost-items/`);
});

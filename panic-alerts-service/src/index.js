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
  res.send('Service is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`);
});

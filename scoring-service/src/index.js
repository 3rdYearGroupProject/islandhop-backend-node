require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { connectPostgres } = require('./config/postgres');
const { connectMongo } = require('./config/mongo');
const driverRoutes = require('./routes/driverRoutes');
const guideRoutes = require('./routes/guideRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', driverRoutes);
app.use('/api', guideRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    console.log('[SERVER] Starting Scoring Service...');
    console.log('[SERVER] Connecting to databases...');
    
    await connectPostgres();
    await connectMongo();
    
    console.log('[SERVER] All database connections established');
    console.log('[SERVER] Starting HTTP server on port', PORT);
    
    app.listen(PORT, () => {
      console.log('[SERVER] Scoring Service successfully started on port', PORT);
      logger.info(`Scoring Service running on port ${PORT}`);
    });
  } catch (err) {
    console.log('[SERVER] Startup failed:', err.message);
    logger.error('Startup error:', err);
    process.exit(1);
  }
}

startServer();

import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import touristRouter from './routes/touristRoutes.js';

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

app.use('/tourist', touristRouter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error', err));

app.get('/', (req, res) => {
  res.send('Service is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`);
});

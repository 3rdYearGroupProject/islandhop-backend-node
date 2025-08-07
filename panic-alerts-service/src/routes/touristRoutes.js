// touristRoutes.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  console.log('✅ GET /tourists route was accessed!');
  res.send('Hello from Tourist Routes!');
});

export default router;
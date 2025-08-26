const express = require('express');
const router = express.Router();
const { requestGuide, requestGuideExcept } = require('../controllers/guideController');

console.log('[GUIDE ROUTES] Guide routes module loaded');

router.post('/request-guide', (req, res, next) => {
  console.log('[GUIDE ROUTES] POST /request-guide endpoint hit');
  requestGuide(req, res, next);
});

router.post('/request-guide-except', (req, res, next) => {
  console.log('[GUIDE ROUTES] POST /request-guide-except endpoint hit');
  requestGuideExcept(req, res, next);
});

console.log('[GUIDE ROUTES] Guide routes configured');

module.exports = router;

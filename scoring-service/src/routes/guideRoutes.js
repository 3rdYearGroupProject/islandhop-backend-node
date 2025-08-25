const express = require('express');
const router = express.Router();
const { requestGuide } = require('../controllers/guideController');

router.post('/request-guide', requestGuide);

module.exports = router;

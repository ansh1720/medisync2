const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Get health news
router.get('/', newsController.getNews);

// Get health alerts
router.get('/alerts', newsController.getAlerts);

module.exports = router;

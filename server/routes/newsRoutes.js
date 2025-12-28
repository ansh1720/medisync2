const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Get health news
router.get('/', newsController.getNews);

module.exports = router;

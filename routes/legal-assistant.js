const express = require('express');
const router = express.Router();
const legalAssistantController = require('../controllers/legal-assistant');

router.post('/', legalAssistantController.handleLegalAssistant);

module.exports = router;

const express = require('express');
const controller = require('../controllers/canaisController');

const router = express.Router();

router.post('/enviarWhatsApp', controller.enviarWhatsApp);
router.get('/listarWhatsApp', controller.listarWhatsApp);

module.exports = router;

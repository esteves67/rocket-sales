const express = require('express');
const controller = require('../controllers/canaisController');
const { auth, authDealer } = require('../util/auth');

const router = express.Router();

router.post('/enviarEmail', auth, authDealer, controller.enviarEmail);
router.post('/uploadAnexoEmail', controller.uploadAnexoEmail);
router.post('/enviarWhatsApp', auth, authDealer, controller.enviarWhatsApp);

router.get('/listarMensagens', auth, authDealer, controller.listarMensagens);

router.get('/listarCanais', auth, authDealer, controller.listarCanais);

module.exports = router;

const express = require('express');
const multer = require('multer');
const controller = require('../controllers/canaisController');
const { auth, authDealer } = require('../util/auth');

const upload = multer({ dest: process.env.STORAGE });
const router = express.Router();


router.get('/listarCanais', auth, authDealer, controller.listarCanais);

router.post('/enviarEmail', auth, authDealer, controller.enviarEmail);
router.post('/enviarWhatsapp', auth, authDealer, controller.enviarWhatsApp);

router.get('/listarMensagens', auth, authDealer, controller.listarMensagens);

router.post('/mailgun', upload.any(), controller.mailgun);
router.post('/chat-api', controller.chatapi);

router.post('/upload', auth, authDealer, upload.any(), controller.upload);
router.get('/file/:filename', controller.file);

module.exports = router;

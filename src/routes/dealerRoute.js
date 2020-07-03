const express = require('express');
const { auth, authDealer } = require('../util/auth');
const controller = require('../controllers/dealerController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.get('/listar', auth, controller.listar);
router.post('/definirPrincipal', auth, authDealer, controller.definirPrincipal);
router.post('/convidarUsuario', auth, authDealer, controller.convidarUsuario);

module.exports = router;

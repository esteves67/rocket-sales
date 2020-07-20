const express = require('express');
const { auth, authDealer, authAdmin } = require('../util/auth');
const controller = require('../controllers/dealerController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.post('/editar', auth, authDealer, authAdmin, controller.editar);

router.get('/listar', auth, controller.listar);

router.get('/dealer', auth, authDealer, controller.dealer);

router.post('/definirPrincipal', auth, authDealer, controller.definirPrincipal);

router.post('/convidarUsuario', auth, authDealer, authAdmin, controller.convidarUsuario);
router.get('/listarConvites', auth, authDealer, authAdmin, controller.listarConvites);

module.exports = router;

const express = require('express');
const { auth, authDealer, authPermissao } = require('../util/auth');
const controller = require('../controllers/dealerController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.post('/editar', auth, authDealer, authPermissao('AlterarDadosLoja'), controller.editar);

router.get('/listar', auth, controller.listar);

router.get('/dealer', auth, authDealer, controller.dealer);

router.get('/mudarLoja', auth, authDealer, controller.mudarLoja);

router.post('/definirPrincipal', auth, authDealer, controller.definirPrincipal);

router.post('/convidarUsuario', auth, authDealer, authPermissao('ConvidarUsuarios'), controller.convidarUsuario);
router.get('/listarConvites', auth, authDealer, authPermissao('ConvidarUsuarios'), controller.listarConvites);

module.exports = router;

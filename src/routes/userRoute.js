const express = require('express');
const controller = require('../controllers/userController');
const auth = require('../util/auth');

const router = express.Router();

router.post('/cadastro', controller.cadastro);
router.get('/autenticacao', controller.autenticacao);
router.get('/convites', auth, controller.listarConvites);
router.post('/convite', auth, controller.aceitarConvite);
router.get('/resetarSenha', controller.enviarEmailResetarSenha);
router.get('/resetarSenha/:token', controller.verificarTokenResetarSenha);
router.post('/resetarSenha', controller.resetarSenha);

module.exports = router;

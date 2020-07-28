const express = require('express');
const controller = require('../controllers/userController');
const { auth, authDealer, authPermissao } = require('../util/auth');

const router = express.Router();

router.get('/autenticacao', controller.autenticacao);

router.get('/usuario', auth, controller.usuario);

router.post('/cadastro', controller.cadastro);
router.post('/editar', auth, controller.editar);
router.post('/editarSenha', auth, controller.editarSenha);
router.post('/alterarPermissao', auth, authDealer, authPermissao('AlterarPermissaoUsuarios'), controller.alterarPermissao);

router.get('/convites', auth, controller.listarConvites);
router.post('/convite', auth, controller.aceitarConvite);

router.get('/listarVendedores', auth, authDealer, controller.listarVendedores);

router.get('/resetarSenha', controller.enviarEmailResetarSenha);
router.get('/verificarTokenResetarSenha', controller.verificarTokenResetarSenha);
router.post('/resetarSenha', controller.resetarSenha);

module.exports = router;

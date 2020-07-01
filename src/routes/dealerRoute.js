const express = require('express');
const auth = require('../util/auth');
const controller = require('../controllers/dealerController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.get('/listar', auth, controller.listar);
router.post('/definirPrincipal', auth, controller.definirPrincipal);
router.post('/convidarUsuario', auth, controller.convidarUsuario);

module.exports = router;

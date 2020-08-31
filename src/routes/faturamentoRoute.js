const express = require('express');
const { auth } = require('../util/auth');
const controller = require('../controllers/faturamentoController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.post('/editar', auth, controller.editar);
router.get('/listar', auth, controller.listar);
router.get('/conta', auth, controller.conta);

module.exports = router;

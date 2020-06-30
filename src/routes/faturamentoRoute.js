const express = require('express');
const auth = require('../util/auth');
const controller = require('../controllers/faturamentoController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.get('/listar', auth, controller.listar);

module.exports = router;

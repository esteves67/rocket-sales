const express = require('express');
const { auth, authDealer } = require('../util/auth');
const controller = require('../controllers/origemController');

const router = express.Router();

router.get('/listar', auth, authDealer, controller.listar);

module.exports = router;

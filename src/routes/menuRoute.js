const express = require('express');
const { auth, authDealer } = require('../util/auth');
const controller = require('../controllers/menuController');

const router = express.Router();

router.get('/modulos', auth, authDealer, controller.listarModulos);

module.exports = router;

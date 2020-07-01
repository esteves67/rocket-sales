const express = require('express');
const auth = require('../util/auth');
const controller = require('../controllers/menuController');

const router = express.Router();

router.get('/modulos', auth, controller.listarModulos);
router.get('/menus', auth, controller.listarMenus);

module.exports = router;

const express = require('express');
const auth = require('../util/auth');
const controller = require('../controllers/showroomController');

const router = express.Router();

router.post('/cadastro', auth, controller.cadastro);
router.post('/atualizar', auth, controller.atualizar);
router.post('/registraSaida', auth, controller.registraSaida);
router.post('/registraTestDrive', auth, controller.registraTestDrive);
router.post('/registraNegativaTestDrive', auth, controller.registraNegativaTestDrive);
router.get('/listar', auth, controller.listar);

module.exports = router;

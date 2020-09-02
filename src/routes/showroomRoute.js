const express = require('express');
const { auth, authDealer, authBase64 } = require('../util/auth');
const controller = require('../controllers/showroomController');

const router = express.Router();

router.post('/cadastro', auth, authDealer, controller.cadastro);
router.post('/cadastro2', authBase64, controller.cadastro);
router.post('/atualizar', auth, authDealer, controller.atualizar);
router.post('/registraSaida', auth, authDealer, controller.registraSaida);
router.post('/registraTestDrive', auth, authDealer, controller.registraTestDrive);
router.post('/registraNegativaTestDrive', auth, authDealer, controller.registraNegativaTestDrive);
router.get('/listar', auth, authDealer, controller.listar);
router.post('/alterarStatus', auth, authDealer, controller.alterarStatus);
router.get('/selecionarLead', auth, authDealer, controller.selecionarLead);
router.get('/listarLog', auth, authDealer, controller.listarLog);
router.get('/localizar', auth, authDealer, controller.localizar);


router.post('/avaliacaousado/alterar', auth, authDealer, controller.avaliacaousado_alterar);
router.post('/avaliacaousado/deletarfoto', auth, authDealer, controller.avaliacaousado_deletarfoto);
router.get('/avaliacaousado/selecionar', auth, authDealer, controller.avaliacaousado_selecionar);

module.exports = router;

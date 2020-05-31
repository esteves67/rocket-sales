const express = require('express');
const jwt = require('jsonwebtoken');
const controller = require('../controllers/userController');

const router = express.Router();

// eslint-disable-next-line consistent-return
function auth(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'Token não informado.' });

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ auth: false, message: 'Token inválido.' });

    req.userId = decoded.user;
    req.userEmail = decoded.email;
    next();
  });
}

router.post('/signup', controller.signup); // * cadastrar usuário
router.get('/auth', controller.auth); // * autenticar usuário
router.get('/passwordReset', controller.sendMailPasswordReset); // * iniciar processo de resetar a senha
router.get('/passwordReset/:token', controller.checkTokenPasswordReset); // * link que o usuário recebe por e-mail para resetar a senha
router.post('/passwordReset', controller.passwordReset); // * resetar a senha
router.get('/convite', auth, controller.convite);
router.post('/aceitarConvite', auth, controller.aceitarConvite);

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const controller = require('../controllers/dealerController');

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'Token não informado.' });

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ auth: false, message: 'Token inválido.' });

    req.userId = decoded.user;
    next();
  });
}

router.post('/create', auth, controller.create);
router.get('/getAll', auth, controller.getAll);
router.post('/principal', auth, controller.principal);

module.exports = router;

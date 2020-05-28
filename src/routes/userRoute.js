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
    next();
  });
}

router.get('/login', controller.login);
router.get('/forgot', controller.forgot);
router.post('/', controller.post);
// * router.put("/:id", controller.put);
// * router.delete("/:id", controller.delete);

module.exports = router;

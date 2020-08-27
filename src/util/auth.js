const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// eslint-disable-next-line consistent-return
function auth(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'Token não informado.' });

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ auth: false, message: 'Token inválido.' });

    req.userId = decoded.user;
    req.userEmail = decoded.email;
    req.userNome = decoded.nome;

    next();
  });
}

const authDealer = async (req, res, next) => {
  const { dealer } = req.body;
  if (dealer !== undefined) {
    const connection0 = await mysql.createConnection(dbConfig);
    const [
      user,
    ] = await connection0.query(
      'SELECT * FROM dealerUsers inner join permissoes on permissoes.id = dealerUsers.permissao inner join dealer on dealerUsers.dealer = dealer.id WHERE dealer = ? and user = ?',
      [req.body.dealer, req.userId]
    );
    await connection0.end();

    if (user.length === 0) {
      return res
        .status(401)
        .send({ auth: false, message: 'Usuário não tem permissão para acessar esse dealer.' });
    }

    req.userPermissao = user[0].permissao;
    req.allow = {};
    req.allow.ConvidarUsuarios = user[0].allow_ConvidarUsuarios;
    req.allow.AlterarDadosLoja = user[0].allow_AlterarDadosLoja;
    req.allow.AlterarPermissaoUsuarios = user[0].allow_AlterarPermissaoUsuarios;
    req.allow.AlterarVendedor = user[0].allow_AlterarVendedor;
  }

  next();
};

const authAdmin = async (req, res, next) => {
  if (req.userPermissao !== 4) {
    return res
      .status(401)
      .send({ auth: false, message: 'Usuário não tem permissão para acessar esse recurso.' });
  }
  next();
};

const authPermissao = (permissao) => (req, res, next) => {
  if (req.allow[permissao] !== 1) {
    return res
      .status(401)
      .send({ auth: false, message: 'Usuário não tem permissão para acessar esse recurso.' });
  }
  next();
};

module.exports = { auth, authDealer, authAdmin, authPermissao };

const mysql = require('mysql2/promise');
const validator = require('validator');
const tratamentoErros = require('../util/tratamentoErros');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.cadastro = async (req, res) => {
  try {
    const dealer = req.body;

    if (
      dealer.nome === undefined ||
      dealer.fabricante === undefined ||
      dealer.plano === undefined ||
      dealer.contaFaturamento === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!dealer.nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O nome do dealer não foi informado.',
      });
    }

    if (!dealer.fabricante.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O fabricante não foi informado.',
      });
    }

    try {
      const connection0 = await mysql.createConnection(dbConfig);
      const [result0] = await connection0.query(
        'SELECT * FROM faturamento WHERE id = ? and user = ?',
        dealer.contaFaturamento,
        req.userId
      );
      await connection0.end();

      // * verifico se a conta de faturamento existe e é pertencente a esse usuário.
      if (result0.length === 0) {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'A conta de faturamento não está disponível.',
        });
      }

      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.query('INSERT INTO dealer SET ?', dealer);
      await connection.end();

      const connection2 = await mysql.createConnection(dbConfig);
      const [result2] = await connection2.query(
        'INSERT INTO dealerUsers (user, dealer, permissao) values (?, ?, ?)',
        [
          req.userId,
          result.insertId,
          4, // * administrador
        ]
      );
      await connection2.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Dealer incluído com sucesso.',
        dealerAtivo: {
          dealer: result2.insertId,
          dealerNome: dealer.nome,
          permissao: 4,
        },
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir o dealer.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.listar = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [
      dealers,
    ] = await connection.query(
      'SELECT dealer.id, dealer.nome FROM dealerUsers INNER JOIN dealer ON dealerUsers.dealer = dealer.id WHERE user = ?',
      [req.userId]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      dealers,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.definirPrincipal = async (req, res) => {
  try {
    const { dealer } = req.body;

    if (dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    try {
      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'UPDATE dealerUsers SET principal = IF(dealer = ?, 1, 0) WHERE user = ?',
        [dealer, req.userId]
      );
      await connection3.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Dealer principal definido.',
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir o dealer.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.convidarUsuario = async (req, res) => {
  try {
    const convite = req.body;

    if (
      convite.email === undefined ||
      convite.permissao === undefined ||
      convite.dealer === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!validator.isEmail(convite.email)) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'E-mail inválido.',
      });
    }

    try {
      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'INSERT INTO dealerConvites (dealer, convidante, email, permissao) VALUES (?, ?, ?, ?)',
        [convite.dealer, req.userId, convite.email, convite.permissao]
      );
      await connection3.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Usuário convidado com sucesso.',
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao convidar o usuário.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao convidar o usuário.',
    });
  }
};

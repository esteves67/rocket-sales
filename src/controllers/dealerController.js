const mysql = require('mysql2/promise');
const validator = require('validator');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.create = async (req, res) => {
  try {
    const dealer = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
    if (
      dealer.nome === undefined ||
      dealer.fabricante === undefined ||
      dealer.plano === undefined ||
      dealer.contaFaturamento === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Requisição inválida.',
      });
    }

    // * validação
    if (!dealer.nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'nome',
        motivo: 'vazio',
        mensagem: 'O nome não foi informado.',
      });
    }

    // * validação
    if (!dealer.fabricante.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'fabricante',
        motivo: 'vazio',
        mensagem: 'O fabricante não foi informado.',
      });
    }

    try {
      const connection2 = await mysql.createConnection(dbConfig);
      const [result2] = await connection2.query('INSERT INTO dealer SET ?', dealer);
      await connection2.end();

      const connection3 = await mysql.createConnection(dbConfig);
      const [result3] = await connection3.query(
        'INSERT INTO dealerUsers (user, dealer, permissao) values (?, ?, ?)',
        [
          req.userId,
          result2.insertId,
          4, // * administrador
        ]
      );
      await connection3.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Dealer incluído com sucesso.',
        dealer: result2.insertId,
      });
    } catch (err) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao inserir o dealer.',
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.getAll = async (req, res) => {
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
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.principal = async (req, res) => {
  try {
    const { dealer } = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
    if (dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
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
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao inserir o dealer.',
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.convidar = async (req, res) => {
  try {
    const convite = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
    if (
      convite.email === undefined ||
      convite.permissao === undefined ||
      convite.dealer === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Requisição inválida.',
      });
    }

    // * validação
    if (!validator.isEmail(convite.email)) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'E-mail inválido.',
      });
    }

    try {
      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'INSERT INTO dealerConvites (dealer, admin, email, permissao) VALUES (?, ?, ?, ?)',
        [convite.dealer, req.userId, convite.email, convite.permissao]
      );
      await connection3.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Usuário convidado com sucesso.',
      });
    } catch (err) {
      console.log(err);
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao convidar o usuário.',
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao convidar o usuário.',
    });
  }
};

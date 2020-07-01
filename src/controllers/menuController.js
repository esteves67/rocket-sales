const mysql = require('mysql2/promise');
const tratamentoErros = require('../util/tratamentoErros');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.listarModulos = async (req, res) => {
  try {
    const { dealer } = req.body;

    if (dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      modulos,
    ] = await connection.query(
      'select showroom, perseguidor, prospeccao from dealer inner join planos on dealer.plano = planos.id where dealer.id = ?',
      [dealer]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      modulos,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter os dados das contas de faturamento.',
    });
  }
};

exports.listarMenus = async (req, res) => {
  try {
    const { modulo, dealer } = req.body;

    if (modulo === undefined || dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      menus,
    ] = await connection.query(
      'select modulo, nome, rota from dealerusers inner join menuspermissoes on dealerusers.permissao = menuspermissoes.permissao inner join menusmodulos on menuspermissoes.menu = menusmodulos.id where user = ? and modulo = ? and dealer = ?',
      [req.userId, modulo, dealer]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      menus,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter os dados das contas de faturamento.',
    });
  }
};

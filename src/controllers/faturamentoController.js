const mysql = require('mysql2/promise');
const { validate, format } = require('cnpj');
const tratamentoErros = require('../util/tratamentoErros');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.cadastro = async (req, res) => {
  try {
    const faturamento = req.body;

    if (
      faturamento.cnpj === undefined ||
      faturamento.inscricaoEstadual === undefined ||
      faturamento.razaoSocial === undefined ||
      faturamento.endereco === undefined ||
      faturamento.cep === undefined ||
      faturamento.cidade === undefined ||
      faturamento.estado === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    faturamento.cnpj = format(faturamento.cnpj);

    if (!validate(faturamento.cnpj)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O CNPJ não é válido.',
      });
    }

    if (!faturamento.razaoSocial.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A razão social não foi informada.',
      });
    }

    if (!faturamento.inscricaoEstadual.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A inscrição estadual não foi informada.',
      });
    }
    if (!faturamento.endereco.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O endereço não foi informado.',
      });
    }

    if (!faturamento.cep.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O cep não foi informado.',
      });
    }

    if (!faturamento.cidade.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A cidade não foi informada.',
      });
    }

    if (!faturamento.estado.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O estado não foi informado.',
      });
    }

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [
        result,
      ] = await connection.query(
        'INSERT INTO faturamento (user, cnpj, inscricaoEstadual, razaoSocial, endereco, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          req.userId,
          faturamento.cnpj,
          faturamento.inscricaoEstadual,
          faturamento.razaoSocial,
          faturamento.endereco,
          faturamento.cidade,
          faturamento.estado,
          faturamento.cep,
        ]
      );
      await connection.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Conta de faturamento incluída com sucesso.',
        contaFaturamento: result.insertId,
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir a conta de faturamento.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir a conta de faturamento.',
    });
  }
};

exports.listar = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [
      contas,
    ] = await connection.query('SELECT cnpj, id, razaoSocial FROM faturamento WHERE (user = ?)', [
      req.userId,
    ]);
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      contas,
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

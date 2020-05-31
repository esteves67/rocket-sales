const mysql = require('mysql2/promise');
const { validate, format } = require('cnpj');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.create = async (req, res) => {
  try {
    const faturamento = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
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
        mensagem: 'Requisição inválida.',
      });
    }

    faturamento.cnpj = format(faturamento.cnpj);

    // * validação
    if (!validate(faturamento.cnpj)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'cnpj',
        motivo: 'vazio',
        mensagem: 'O cnpj não é válido.',
      });
    }
    // * validação
    if (!faturamento.razaoSocial.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'razaoSocial',
        motivo: 'vazio',
        mensagem: 'A razão social não foi informada.',
      });
    }

    // * validação
    if (!faturamento.inscricaoEstadual.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'inscricaoEstadual',
        motivo: 'vazio',
        mensagem: 'A inscrição estadual não foi informada.',
      });
    }

    // * validação
    if (!faturamento.endereco.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'endereco',
        motivo: 'vazio',
        mensagem: 'O endereço não foi informado.',
      });
    }

    // * validação
    if (!faturamento.cep.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'cep',
        motivo: 'vazio',
        mensagem: 'O cep não foi informado.',
      });
    }
    // * validação
    if (!faturamento.cidade.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'cidade',
        motivo: 'vazio',
        mensagem: 'A cidade não foi informada.',
      });
    }
    // * validação
    if (!faturamento.estado.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'estado',
        motivo: 'vazio',
        mensagem: 'O estado não foi informado.',
      });
    }

    try {
      const connection3 = await mysql.createConnection(dbConfig);
      const [
        result3,
      ] = await connection3.query(
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
      await connection3.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Conta de faturamento incluída com sucesso.',
        contaFaturamento: result3.insertId,
      });
    } catch (err) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao inserir a conta de faturamento.',
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao inserir a conta de faturamento.',
    });
  }
};

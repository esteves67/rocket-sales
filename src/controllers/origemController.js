const mysql = require('mysql2/promise');
const tratamentoErros = require('../util/tratamentoErros');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.listar = async (req, res) => {
  try {
    const { dealer, lead } = req.body;

    if (dealer === undefined || lead === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (lead == '0') {
      const connection1 = await mysql.createConnection(dbConfig);
      const [
        lista_origem,
      ] = await connection1.query(
        'select distinct origem from dealerdepartamentosorigem where dealerdepartamentosorigem.dealer = ?',
        [dealer]
      );
      await connection1.end();

      return res.status(200).send({
        status: 'ok',
        lista_origem,
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      result,
    ] = await connection.query(
      'select departamento from leads where leads.dealer = ? and leads.id = ?',
      [dealer, lead]
    );
    await connection.end();

    const connection1 = await mysql.createConnection(dbConfig);
    const [
      origens,
    ] = await connection1.query(
      'select distinct origem from dealerdepartamentosorigem where dealerdepartamentosorigem.dealer = ? and dealerdepartamentosorigem.departamento = ?',
      [dealer, result[0].departamento]
    );
    await connection1.end();

    return res.status(200).send({
      status: 'ok',
      origens,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter a lista de seleção "origens".',
    });
  }
};


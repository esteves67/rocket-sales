const mysql = require('mysql2/promise');
const moment = require('moment');
const tratamentoErros = require('../util/tratamentoErros');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.cadastro = async (req, res) => {
  try {
    const {
      nome,
      telefone1,
      email,
      veiculoInteresse,
      vendedor,
      comoconheceu,
      horaEntrada,
      observacao,
      dealer,
    } = req.body;

    if (
      nome === undefined ||
      telefone1 === undefined ||
      email === undefined ||
      veiculoInteresse === undefined ||
      vendedor === undefined ||
      comoconheceu === undefined ||
      horaEntrada === undefined ||
      observacao === undefined ||
      dealer === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const horaEntrada1 = moment(horaEntrada, 'DD/MM/YYYY HH:mm:ss', true).format(
      'YYYY-MM-DD HH:mm:ss'
    );

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query(
      'INSERT INTO leads (nome, telefone1, email, veiculoInteresse,  vendedor, comoconheceu, horaEntrada, observacao, dealer, createdBy) VALUES (?, ?, ?, ?, ?, ?, ? ,? ,?, ?);',
      [
        nome,
        telefone1,
        email,
        veiculoInteresse,
        vendedor,
        comoconheceu,
        horaEntrada1,
        observacao,
        dealer,
        req.userId,
      ]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Cliente cadastado com sucesso!',
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

exports.atualizar = async (req, res) => {
  try {
    const {
      lead,
      nome,
      cpf,
      dataNascimento,
      telefone1,
      telefone2,
      email,
      veiculoInteresse,
      vendedor,
      comoconheceu,
      observacao,
    } = req.body;

    if (
      lead === undefined ||
      nome === undefined ||
      cpf === undefined ||
      dataNascimento === undefined ||
      telefone1 === undefined ||
      telefone2 === undefined ||
      email === undefined ||
      veiculoInteresse === undefined ||
      vendedor === undefined ||
      comoconheceu === undefined ||
      observacao === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const dataNascimento1 = moment(dataNascimento, 'DD/MM/YYYY', true).format('YYYY-MM-DD');

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query(
      'UPDATE leads SET nome = ?, cpf = ?, dataNascimento = ?, telefone1 = ?, telefone2 = ?, email = ?, veiculoInteresse = ?, vendedor = ?, observacao = ?, comoconheceu = ? WHERE id = ?;',
      [
        nome,
        cpf,
        dataNascimento1,
        telefone1,
        telefone2,
        email,
        veiculoInteresse,
        vendedor,
        observacao,
        comoconheceu,
        lead,
      ]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Cliente atualizado com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao atualizar o cliente.',
    });
  }
};

exports.registraSaida = async (req, res) => {
  try {
    const { lead, horaSaida } = req.body;

    if (lead === undefined || horaSaida === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const horaSaida1 = moment(horaSaida, 'DD/MM/YYYY HH:mm:ss', true).format('YYYY-MM-DD HH:mm:ss');

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('UPDATE leads SET horaSaida = ? WHERE id = ?;', [
      horaSaida1,
      lead,
    ]);
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Cliente atualizado com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao atualizar o cliente.',
    });
  }
};

exports.registraTestDrive = async (req, res) => {
  try {
    const { lead, testDriveHora } = req.body;

    if (lead === undefined || testDriveHora === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const testDriveHora1 = moment(testDriveHora, 'DD/MM/YYYY HH:mm:ss', true).format(
      'YYYY-MM-DD HH:mm:ss'
    );

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query('UPDATE leads SET testDriveHora = ?, testdrive = 1 WHERE id = ?;', [
      testDriveHora1,
      lead,
    ]);
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Test Drive registrado com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao registrar o test drive.',
    });
  }
};

exports.registraNegativaTestDrive = async (req, res) => {
  try {
    const { lead, testDriveMotivo } = req.body;

    if (lead === undefined || testDriveMotivo === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query(
      'UPDATE leads SET testDriveMotivo = ?, testdrive = 0 WHERE id = ?;',
      [testDriveMotivo, lead]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Informações do Test Drive registrado com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao registrar o test drive.',
    });
  }
};

exports.listar = async (req, res) => {
  try {
    const { dealer, dataInicial, dataFinal } = req.body;

    if (dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    // const connection0 = await mysql.createConnection(dbConfig);
    // const [user] = await connection0.query('SELECT * FROM dealerUsers WHERE dealer = ? and user = ?', [dealer, req.userId]);
    // await connection0.end();

    // const permissao = user[0].permissao

    const connection = await mysql.createConnection(dbConfig);
    const [
      leads,
    ] = await connection.query(
      'SELECT nome, vendedor, veiculoInteresse, horaEntrada, horaSaida FROM leads WHERE dealer = ? and horaEntrada BETWEEN ? AND ?',
      [
        dealer,
        moment(dataInicial, 'DD/MM/YYYY', true).format('YYYY-MM-DD'),
        moment(dataFinal, 'DD/MM/YYYY', true).format('YYYY-MM-DD'),
      ]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      leads,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter a lista de leads.',
    });
  }
};

const mysql = require('mysql2/promise');
const moment = require('moment');
const validator = require('validator');
const cpfValidator = require('cpf');
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
      email,
      veiculoInteresse,
      vendedor,
      comoconheceu,
      horaEntrada,
      observacao,
      dealer,
    } = req.body;

    let { telefone1 } = req.body;

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

    if (!nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O nome do cliente não foi informado.',
      });
    }

    if (!telefone1.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O telefone do cliente não foi informado.',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O e-mail do cliente não foi informado ou está inválido.',
      });
    }

    if (!veiculoInteresse.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O veículo de interesse não foi informado.',
      });
    }

    if (!vendedor.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O vendedor não foi informado.',
      });
    }

    if (!horaEntrada.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A hora de entrada do cliente no showroom não foi informada.',
      });
    }

    const horaEntrada1 = moment(horaEntrada, 'DD/MM/YYYY HH:mm:ss', true).format(
      'YYYY-MM-DD HH:mm:ss'
    );
    if (horaEntrada1 === 'Invalid date') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A hora de entrada do cliente no showroom é inválida.',
      });
    }

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
      mensagem: 'Cliente cadastrado com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao cadastrar o cliente.',
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
      dealer,
    } = req.body;

    if (
      dealer === undefined ||
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

    if (!nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O nome do cliente não foi informado.',
      });
    }

    if (!cpfValidator.isValid(cpf)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O CPF do cliente não foi informado ou é inválido.',
      });
    }

    if (!telefone1.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O telefone do cliente não foi informado.',
      });
    }

    if (!telefone2.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O telefone do cliente não foi informado.',
      });
    }

    if (!dataNascimento.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A data de nascimento do cliente não foi informada.',
      });
    }

    const dataNascimento1 = moment(dataNascimento, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
    if (dataNascimento1 === 'Invalid date') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A data de nascimento do cliente é inválida.',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O e-mail do cliente não foi informado ou está inválido.',
      });
    }

    if (!veiculoInteresse.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O veículo de interesse não foi informado.',
      });
    }

    if (!vendedor.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O vendedor não foi informado.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query(
      'UPDATE leads SET nome = ?, cpf = ?, dataNascimento = ?, telefone1 = ?, telefone2 = ?, email = ?, veiculoInteresse = ?, vendedor = ?, observacao = ?, comoconheceu = ? WHERE id = ? and dealer = ?;',
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
        dealer,
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
    const { lead, horaSaida, dealer } = req.body;

    if (lead === undefined || horaSaida === undefined || dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const horaSaida1 = moment(horaSaida, 'DD/MM/YYYY HH:mm:ss', true).format('YYYY-MM-DD HH:mm:ss');
    if (horaSaida1 === 'Invalid date') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A hora de saída do cliente é inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query('UPDATE leads SET horaSaida = ? WHERE id = ? and dealer = ?;', [
      horaSaida1,
      lead,
      dealer,
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
    const { lead, testDriveHora, dealer } = req.body;

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
    if (testDriveHora1 === 'Invalid date') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A hora de realização do test drive é inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection.query(
      'UPDATE leads SET testDriveHora = ?, testdrive = 1 WHERE id = ? dealer = ?;',
      [testDriveHora1, lead, dealer]
    );
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
    const { lead, testDriveMotivo, dealer } = req.body;

    if (lead === undefined || testDriveMotivo === undefined || dealer === undefined) {
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
      'UPDATE leads SET testDriveMotivo = ?, testdrive = 0 WHERE id = ? and dealer = ?;',
      [testDriveMotivo, lead, dealer]
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

    const dataInicial1 = moment(dataInicial, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
    if (dataInicial1 === 'Invalid date') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A data inicial é inválida.',
      });
    }

    const dataFinal1 = moment(dataFinal, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
    if (dataFinal1 === 'Invalid date') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A data final é inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      leads,
    ] = await connection.query(
      'SELECT nome, vendedor, veiculoInteresse, horaEntrada, horaSaida FROM leads WHERE dealer = ? and horaEntrada BETWEEN ? AND ?',
      [dealer, dataInicial1, dataFinal1]
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

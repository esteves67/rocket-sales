const mysql = require('mysql2/promise');
const moment = require('moment');
const validator = require('validator');
const cpfValidator = require('cpf');
const tratamentoErros = require('../util/tratamentoErros');
const { consultarWhatsApp } = require('./canaisController');

const logLead = require('../util/logLead');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

function nullif(valor) {
  return valor === '' ? null : valor;
}

async function vendedorDaVez(tipoCadastramento, tipoLead, dealer) {
  if (tipoLead === 'Peças' || tipoLead === 'Pós-Vendas') return 0;

  let SQLtipo = 'ultimadistribuicao_interna';

  if (tipoCadastramento === 'externo') SQLtipo = 'ultimadistribuicao_externa';

  const connection = await mysql.createConnection(dbConfig);
  const [result] = await connection.query(
    `SELECT user
    FROM dealerusers
    where recebelead_${tipoLead.replace(' ', '').replace('Táxi', 'taxi')} = 1
    order by ${SQLtipo} LIMIT 1`,
    [dealer]
  );
  await connection.end();

  if (result.length > 0) {
    const atendente = result[0].user;

    const connection2 = await mysql.createConnection(dbConfig);
    await connection2.query(
      `UPDATE dealerusers set ${SQLtipo} = NOW() WHERE dealer = ? and user = ?`,
      [dealer, atendente]
    );
    await connection2.end();

    return atendente;
  }

  return 0;
}

// FUNCAO logLead
//***PARAMETROS*/
//* ACAO == Mensagens qual ação foi realizada no lead
//* userId ==  Codigo do usuário responsavel pela ação
//* dealer == Codigo do dealer responsavel pela ação
//* lead ==  Codigo do lead
//* observacao  == Motivos (PODE SER NULL)

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
      origem,
      departamento,
      tipoVenda,
    } = req.body;

    if (
      nome === undefined ||
      telefone1 === undefined ||
      email === undefined ||
      veiculoInteresse === undefined ||
      vendedor === undefined ||
      comoconheceu === undefined ||
      horaEntrada === undefined ||
      origem === undefined ||
      observacao === undefined ||
      departamento === undefined ||
      dealer === undefined ||
      tipoVenda === undefined
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

    if (!origem.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A origem do lead não foi informada.',
      });
    }

    if (!validator.isEmail(email) && email !== '') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O e-mail do cliente não foi informado ou está inválido.',
      });
    }

    // if (!veiculoInteresse.trim()) {
    //   return res.status(400).send({
    //     status: 'erro',
    //     tipo: 'Validação',
    //     mensagem: 'O veículo de interesse não foi informado.',
    //   });
    // }

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
      result,
    ] = await connection.query(
      'INSERT INTO leads (nome, telefone1, telefone1WhatsApp, email, veiculoInteresse,  vendedor, comoconheceu, horaEntrada, observacao, dealer, origem, createdBy, departamento, tipoVenda) VALUES (?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?, ?);',
      [
        nome,
        telefone1.replace(/\D/g, ''),
        await consultarWhatsApp(telefone1.replace(/\D/g, '')),
        email,
        veiculoInteresse,
        vendedor === ''
          ? await vendedorDaVez('interno', tipoVenda === '' ? departamento : tipoVenda, dealer)
          : vendedor,
        comoconheceu,
        horaEntrada1,
        observacao,
        dealer,
        origem,
        req.userId,
        departamento,
        tipoVenda,
      ]
    );
    await connection.end();

    logLead('Lead Cadastrado', req.userId, dealer, result.insertId, null);

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Cliente cadastrado com sucesso!',
      lead: result.insertId,
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
      departamento,
      tipoVenda,
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
      departamento === undefined ||
      observacao === undefined ||
      tipoVenda === undefined
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

    if (!cpfValidator.isValid(cpf) && cpf !== '') {
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

    let dataNascimento1 = null;

    if (dataNascimento.trim()) {
      dataNascimento1 = moment(dataNascimento, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
      if (dataNascimento1 === 'Invalid date') {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'A data de nascimento do cliente é inválida.',
        });
      }
    }

    if (!validator.isEmail(email) && email !== '') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O e-mail do cliente não foi informado ou está inválido.',
      });
    }

    if (!veiculoInteresse.trim() && veiculoInteresse !== '') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O veículo de interesse não foi informado.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      `UPDATE leads SET nome = ?, departamento = ?, cpf = ?, dataNascimento = ?, telefone1 = NULLIF(?, ''), telefone1WhatsApp = ?, telefone2 = NULLIF(?, ''), telefone2WhatsApp = ?, email = ?, veiculoInteresse = ?, vendedor = ?, observacao = ?, comoconheceu = ?, tipoVenda = ? WHERE id = ? and dealer = ?;`,
      [
        nome,
        departamento,
        cpf,
        dataNascimento1,
        telefone1.replace(/\D/g, ''),
        await consultarWhatsApp(telefone1.replace(/\D/g, '')),
        telefone2.replace(/\D/g, ''),
        await consultarWhatsApp(telefone2.replace(/\D/g, '')),
        email,
        veiculoInteresse,
        vendedor === ''
          ? await vendedorDaVez('interno', tipoVenda === '' ? departamento : tipoVenda, dealer)
          : vendedor,
        observacao,
        comoconheceu,
        tipoVenda,
        lead,
        dealer,
      ]
    );
    await connection.end();

    logLead('Dados Atualizados', req.userId, dealer, lead, null);

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
    await connection.query('UPDATE leads SET horaSaida = ? WHERE id = ? and dealer = ?;', [
      horaSaida1,
      lead,
      dealer,
    ]);
    await connection.end();

    logLead('Horário de Saída Registrado', req.userId, dealer, lead, null);

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
    await connection.query(
      'UPDATE leads SET testDriveHora = ?, testdrive = 1 WHERE id = ? AND dealer = ?;',
      [testDriveHora1, lead, dealer]
    );
    await connection.end();

    logLead('Test Drive Realizado em ' + testDriveHora, req.userId, dealer, lead, null);

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
      'UPDATE leads SET testDriveMotivo = ?, testdrive = 0 ,testDriveHora = null WHERE id = ? and dealer = ?;',
      [testDriveMotivo, lead, dealer]
    );
    await connection.end();

    logLead('Test Drive não realizado. Motivo: ' + testDriveMotivo, req.userId, dealer, lead, null);

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
    const { dealer, dataInicial, dataFinal, vendedores, origens, status } = req.body;
    if (
      dealer === undefined ||
      dataInicial === undefined ||
      dataFinal === undefined ||
      vendedores === undefined ||
      origens === undefined ||
      status === undefined
    ) {
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

    let SQLvendedor = '';
    if (vendedores !== '') {
      SQLvendedor = ` and vendedor in (${vendedores}) `;
    }

    let SQLorigem = '';
    if (origens !== '') {
      SQLorigem = ` AND origem in (${origens}) `;
    }

    let SQLstatus = '';
    if (status !== '') {
      SQLstatus = ` AND statusnegociacao in (${status}) `;
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      leads,
    ] = await connection.query(
      `SELECT leads.id, origem, departamento, leads.nome, user.nome as vendedor, veiculoInteresse, DateTimeFormatPtBr(horaEntrada) as horaEntrada, DateFormatPtBr(horaEntrada) as dataEntrada, DateTimeFormatPtBr(horaSaida) as horaSaida, statusnegociacao, numeropedido, motivodesistencia, testdrive, testdrivemotivo, testdrivehora, DateTimeFormatPtBr(agendamentoContato) agendamentoContato, IF(agendamentoContato < NOW(), IF(agendamentoContato < DATE_ADD(NOW(), INTERVAL - 2 HOUR), 'Ação Pendente Atrasada', 'Ação Pendente'), '') acao, finalizadoEm FROM leads LEFT JOIN user ON leads.vendedor = user.id WHERE dealer = ? and DATE(horaEntrada) BETWEEN ? AND ? ${SQLstatus} ${SQLvendedor} ${SQLorigem} ORDER BY CASE WHEN statusnegociacao = 'novo' THEN 5 WHEN statusnegociacao in ('sucesso', 'insucesso') THEN 0 ELSE 2 END DESC, leads.agendamentoContato`,
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

exports.alterarStatus = async (req, res) => {
  try {
    const {
      dealer,
      lead,
      status,
      numeroPedido,
      motivoDesistencia,
      agendamentoContato,
      observacao,
      finalizador,
      dataVisita,
    } = req.body;

    if (
      dealer === undefined ||
      lead === undefined ||
      status === undefined ||
      numeroPedido === undefined ||
      motivoDesistencia === undefined ||
      observacao === undefined ||
      finalizador === undefined ||
      agendamentoContato === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (status === 'Sucesso') {
      if (numeroPedido === '') {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'O número do pedido não foi informado.',
        });
      }
    }

    if (status === 'Insucesso') {
      if (motivoDesistencia === '') {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'Não foi informado o motivo da desistência.',
        });
      }
    }

    if (status === 'Visita Agendada') {
      if (dataVisita === '') {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'Não foi informado a data da visita.',
        });
      }
    }

    const SQLFinalizadoEm = finalizador == 1 ? ', finalizadoEm = Now()' : ', finalizadoEm = null';

    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      `UPDATE leads SET statusNegociacao = ?, agendamentoContato = DateTimeFormatPtBrToMysql(?), numeroPedido = NULLIF(?, ""), motivoDesistencia = NULLIF(?, ""), dataVisita = DateTimeFormatPtBrToMysql(?) ${SQLFinalizadoEm} WHERE id = ? and dealer = ?;`,
      [
        status,
        dataVisita === '' ? agendamentoContato : dataVisita,
        numeroPedido,
        motivoDesistencia,
        dataVisita,
        lead,
        dealer,
      ]
    );
    await connection.end();

    let sub = '';
    let agend = '';
    if (status === 'Sucesso' || status === 'Insucesso') {
      sub = ' - ' + motivoDesistencia + numeroPedido;
    } else {
      agend = 'Agendamento: ' + agendamentoContato;
    }

    logLead(
      `Status do lead foi alterado para ${status}${sub}. ${agend}`,
      req.userId,
      dealer,
      lead,
      observacao
    );

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Cliente atualizado com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao atualizar cliente.',
    });
  }
};

exports.selecionarLead = async (req, res) => {
  try {
    const { dealer, lead } = req.body;

    if (dealer === undefined || lead === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      dadoslead,
    ] = await connection.query(
      'SELECT  leads.nome, departamento, origem, cpf, leads.dataNascimento, leads.telefone1, leads.telefone2, leads.email, veiculoInteresse, user.id as vendedor,  leads.comoconheceu, leads.observacao, DateTimeFormatPtBr(leads.horaEntrada) horaEntrada, user.nome as nomeVendedor, leads.tipoVenda, leads.html, DateTimeFormatPtBr(finalizadoEm) finalizadoEm, statusNegociacao, DateTimeFormatPtBr(agendamentoContato) agendamentoContato, DateTimeFormatPtBr(dataVisita) dataVisita, numeroPedido, motivoDesistencia FROM leads left JOIN user ON user.id = leads.vendedor WHERE leads.dealer = ? And leads.id = ? ',
      [dealer, lead]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      dadoslead,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter ao lead.',
    });
  }
};

exports.listarLog = async (req, res) => {
  try {
    const { dealer, lead } = req.body;

    if (dealer === undefined || lead === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      logLeads,
    ] = await connection.query(
      'SELECT acao, user.nome as criadopor, DATE_FORMAT(logleads.createdAt, "%d/%m/%Y %H:%i:%s") as criadoem,observacao FROM logleads INNER JOIN user ON logleads.user = user.id WHERE (logleads.lead = ?) AND (logleads.dealer = ?) ORDER BY logleads.createdAt DESC',
      [lead, dealer]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      logLeads,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter ao log do lead.',
    });
  }
};

exports.localizar = async (req, res) => {
  try {
    const { dealer, vendedores, telefone, email, cpf } = req.body;
    if (
      dealer === undefined ||
      vendedores === undefined ||
      telefone === undefined ||
      cpf === undefined ||
      email === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    let SQLvendedor = '';
    if (vendedores !== '') {
      SQLvendedor = ` and vendedor in (${vendedores}) `;
    }

    let SQLemail = '';
    if (email !== '') {
      SQLemail = ` and (leads.email = "${email}") `;
    }

    let SQLcpf = '';
    if (cpf !== '') {
      SQLcpf = ` and (digits(leads.cpf) = '${cpf.replace(/\D/g, '')}') `;
    }

    let SQLtelefone = '';
    if (telefone !== '') {
      SQLtelefone = ` and (leads.telefone1 = ${telefone.replace(
        /\D/g,
        ''
      )} or leads.telefone2 = ${telefone.replace(/\D/g, '')}) `;
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      leads,
    ] = await connection.query(
      `SELECT leads.id, origem, departamento, leads.nome, user.nome as vendedor, veiculoInteresse, DateTimeFormatPtBr(horaEntrada) as horaEntrada, DateFormatPtBr(horaEntrada) as dataEntrada, DateTimeFormatPtBr(horaSaida) as horaSaida, statusnegociacao, numeropedido, motivodesistencia, testdrive, testdrivemotivo, testdrivehora, DateTimeFormatPtBr(agendamentoContato) agendamentoContato, IF(agendamentoContato < NOW(), IF(agendamentoContato < DATE_ADD(NOW(), INTERVAL - 2 HOUR), 'Ação Pendente Atrasada', 'Ação Pendente'), '') acao FROM leads LEFT JOIN user ON leads.vendedor = user.id WHERE dealer = ? ${SQLcpf} ${SQLemail} ${SQLtelefone} ${SQLvendedor} and leads.createdAt >= DATE_ADD(NOW(), INTERVAL - 30 DAY) ORDER BY CASE WHEN statusnegociacao = 'novo' THEN 5 WHEN statusnegociacao in ('sucesso', 'insucesso') THEN 0 ELSE 2 END DESC, agendamentoContato`,
      [dealer]
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

exports.outrosLeads = async (req, res) => {
  try {
    const { dealer, telefone, email, cpf } = req.body;
    if (
      dealer === undefined ||
      cpf === undefined ||
      telefone === undefined ||
      email === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    let SQLvendedor = '';
    if (vendedores !== '') {
      SQLvendedor = ` and vendedor in (${vendedores}) `;
    }

    let SQLemail = '';
    if (email !== '') {
      SQLemail = ` and (leads.email = "${email}") `;
    }

    let SQLtelefone = '';
    if (telefone !== '') {
      SQLtelefone = ` and (leads.telefone1 = ${telefone.replace(
        /\D/g,
        ''
      )} or leads.telefone2 = ${telefone.replace(/\D/g, '')}) `;
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      leads,
    ] = await connection.query(
      `SELECT leads.id, origem, departamento, leads.nome, user.nome as vendedor, veiculoInteresse, DateTimeFormatPtBr(horaEntrada) as horaEntrada, DateFormatPtBr(horaEntrada) as dataEntrada, DateTimeFormatPtBr(horaSaida) as horaSaida, statusnegociacao, numeropedido, motivodesistencia, testdrive, testdrivemotivo, testdrivehora, DateTimeFormatPtBr(agendamentoContato) agendamentoContato, IF(agendamentoContato < NOW(), IF(agendamentoContato < DATE_ADD(NOW(), INTERVAL - 2 HOUR), 'Ação Pendente Atrasada', 'Ação Pendente'), '') acao FROM leads LEFT JOIN user ON leads.vendedor = user.id WHERE dealer = ? ${SQLemail} ${SQLtelefone} ${SQLvendedor} and leads.createdAt >= DATE_ADD(NOW(), INTERVAL - 30 DAY) ORDER BY CASE WHEN statusnegociacao = 'novo' THEN 5 WHEN statusnegociacao in ('sucesso', 'insucesso') THEN 0 ELSE 2 END DESC, agendamentoContato`,
      [dealer]
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

exports.avaliacaousado_alterar = async (req, res) => {
  try {
    const {
      dealer,
      lead,
      marca,
      modelo,
      versao,
      anofabricacao,
      anomodelo,
      km,
      placa,
      chassi,
      cor,
    } = req.body;
    if (
      dealer === undefined ||
      lead === undefined ||
      marca === undefined ||
      modelo === undefined ||
      versao === undefined ||
      anomodelo === undefined ||
      anofabricacao === undefined ||
      km === undefined ||
      placa === undefined ||
      chassi === undefined ||
      cor === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      'INSERT INTO fichaavaliacaousados (dealer, lead, marca, modelo, versao, anofabricacao, anomodelo, km, placa, chassi, cor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marca = ?, modelo = ?, versao = ?, anofabricacao = ?, anomodelo = ?, km = ?, placa = ?, chassi = ?, cor = ?',
      [
        nullif(dealer),
        nullif(lead),
        nullif(marca),
        nullif(modelo),
        nullif(versao),
        nullif(anofabricacao),
        nullif(anomodelo),
        nullif(km),
        nullif(placa),
        nullif(chassi),
        nullif(cor),
        nullif(marca),
        nullif(modelo),
        nullif(versao),
        nullif(anofabricacao),
        nullif(anomodelo),
        nullif(km),
        nullif(placa),
        nullif(chassi),
        nullif(cor),
      ]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Ficha de avaliação alterada com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao atualizar a ficha de avaliação.',
    });
  }
};

exports.avaliacaousado_selecionar = async (req, res) => {
  try {
    const { dealer, lead } = req.body;
    if (dealer === undefined || lead === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [
      result,
    ] = await connection.query('SELECT * FROM fichaavaliacaousados WHERE dealer = ? AND lead = ?', [
      dealer,
      lead,
    ]);
    await connection.end();

    if (result.length > 0) {
      const connection2 = await mysql.createConnection(dbConfig);
      const [
        fotos,
      ] = await connection2.query(
        `SELECT id, concat('${process.env.STORAGE_HTTP}',nome) nome, nomeoriginal, mimetype FROM arquivos WHERE dealer = ? AND lead = ? and local = "AvaliacaoUsados"`,
        [dealer, lead]
      );
      await connection2.end();

      result[0].fotos = fotos;
    }

    return res.status(200).send({
      status: 'ok',
      result,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter os dados da ficha de avaliação.',
    });
  }
};

exports.avaliacaousado_deletarfoto = async (req, res) => {
  try {
    const { dealer, lead, foto } = req.body;
    if (dealer === undefined || lead === undefined || foto === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      'DELETE FROM arquivos WHERE lead = ? and dealer = ? and id = ? and local = "AvaliacaoUsados"',
      [lead, dealer, foto]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      mensagem: 'Foto excluída com sucesso!',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao deletar a foto.',
    });
  }
};

exports.painel = async (req, res) => {
  try {
    const { dealer } = req.body;

    if (dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const resultado = {};

    const connection = await mysql.createConnection(dbConfig);
    const [totais] = await connection.query(
      `SELECT count(*) qtde
      FROM dealerusers INNER JOIN user on dealerusers.user = user.id INNER JOIN permissoes on dealerusers.permissao = permissoes.id
      WHERE dealer = ? AND permissoes.allow_AparecerNoPainel = 1;`,
      [dealer]
    );
    await connection.end();

    const connection2 = await mysql.createConnection(dbConfig);
    const [consultores] = await connection2.query(
      `SELECT user.id, user.nome
      FROM dealerusers INNER JOIN user on dealerusers.user = user.id INNER JOIN permissoes on dealerusers.permissao = permissoes.id
      WHERE dealer = ? AND permissoes.allow_AparecerNoPainel = 1;`,
      [dealer]
    );
    await connection2.end();

    resultado.qtde = totais[0].qtde;
    resultado.consultores = consultores;

    for (let index = 0; index < consultores.length; index++) {
      const consultor = consultores[index];

      const connection3 = await mysql.createConnection(dbConfig);
      const [visitas] = await connection3.query(
        `SELECT nome, DateTimeFormatPtBr(datavisita) dataVisita, origem
        FROM ROCKETSALES.LEADS
        WHERE STATUSNEGOCIACAO = 'Visita Agendada' AND     DEALER = ? and vendedor = ?;`,
        [dealer, consultor.id]
      );
      await connection3.end();

      resultado.consultores[index].visitas = visitas;
    }

    return res.status(200).send({
      status: 'ok',
      resultado,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao obter ao lead.',
    });
  }
};

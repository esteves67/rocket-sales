const uuid = require('uuid');
const sql = require('mssql');
const mysql = require('mysql2/promise');
const transporter = require('../util/nodemailer');
const tratamentoErros = require('../util/tratamentoErros');

const config = {
  user: process.env.SQL_DB_USER,
  password: process.env.SQL_DB_PASS,
  server: process.env.SQL_DB_HOST,
  database: process.env.SQL_DB_NAME,
};

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.enviarWhatsApp = async (req, res) => {
  if (
    req.body.dealer === undefined ||
    req.body.lead === undefined ||
    req.body.tipo === undefined ||
    req.body.celular === undefined ||
    req.body.mensagem === undefined
  ) {
    return res.status(400).send({
      status: 'erro',
      tipo: 'Falha na Chamada',
      mensagem: 'Requisição inválida.',
    });
  }

  try {
    if (req.body.tipo === 'files') {
      const files = req.body.mensagem.split(';==;');

      for (file of files) {
        if (file !== '') {
          const pool = await sql.connect(config);

          await pool
            .request()
            .input('remetente', sql.BigInt, req.dealerWhatsapp1)
            .input('telefone', sql.BigInt, req.body.celular)
            .input('mensagem', sql.VarChar, file)
            .input('codEmpresa', sql.Int, 5)
            .query(
              'INSERT INTO WHATSAPP.MENSAGENS (REMETENTE, TELEFONE, MENSAGEM, CODEMPRESA) VALUES (@remetente, @telefone, @mensagem, @codEmpresa)'
            );
        }
      }
    } else {
      const pool = await sql.connect(config);

      await pool
        .request()
        .input('remetente', sql.BigInt, req.dealerWhatsapp1)
        .input('telefone', sql.BigInt, req.body.celular)
        .input('mensagem', sql.VarChar, req.body.mensagem)
        .input('codEmpresa', sql.Int, 5)
        .query(
          'INSERT INTO WHATSAPP.MENSAGENS (REMETENTE, TELEFONE, MENSAGEM, CODEMPRESA) VALUES (@remetente, @telefone, @mensagem, @codEmpresa)'
        );
    }

    return res.status(200).send({
      status: 'ok',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao enviar mensagem.',
    });
  }
};

exports.listarMensagens = async (req, res) => {
  if (req.body.dealer === undefined || req.body.lead === undefined) {
    return res.status(400).send({
      status: 'erro',
      tipo: 'Falha na Chamada',
      mensagem: 'Requisição inválida.',
    });
  }

  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [
      result1,
    ] = await connection1.query(
      'SELECT IFNULL(telefone1, 0) as telefone1, IFNULL(telefone2, 0) as telefone2, IFNULL(email, "a") as email FROM leads where (id = ?) and (dealer = ?)',
      [req.body.lead, req.body.dealer]
    );
    await connection1.end();

    const connection = await mysql.createConnection(dbConfig);
    const [
      resultEm,
    ] = await connection.query(
      `SELECT id, remetente, html mensagem, DateTimeFormatPtBr(data) data, 'email' tipo, direcao, unix_timestamp(convert_tz(data, '+00:00', @@session.time_zone)) as timestamp, anexo, contentIdMap FROM emails WHERE ((remetente = ?) or (email = ?)) and ((remetente = ?) or (email = ?))`,
      [result1[0].email, result1[0].email, req.dealerEmail, req.dealerEmail]
    );
    await connection.end();

    for (let i = 0; i < resultEm.length; i++) {
      if (resultEm[i].anexo != null && resultEm[i].contentIdMap != null) {
        const anexo = resultEm[i].anexo.split(';==;');
        const contentIdMap = JSON.parse(resultEm[i].contentIdMap);

        for (let k = 0; k < Object.entries(contentIdMap).length; k++) {
          const key = Object.entries(contentIdMap)[k][0];
          const cid = `cid:${key.replace('<', '').replace('>', '')}`;
          const attachment = contentIdMap[key].replace('attachment-', '') - 1;

          if (resultEm[i].mensagem.search(cid) > 0) {
            resultEm[i].anexo = resultEm[i].anexo.replace(anexo[attachment] + ';==;', '');
          }

          resultEm[i].mensagem = resultEm[i].mensagem.replace(
            cid,
            anexo[attachment].split(':==:')[1]
          );
        }
      }

      const anexos = [];
      if (resultEm[i].anexo != null) {
        const anexo = resultEm[i].anexo.split(';==;');
        for (let y = 0; y < anexo.length; y++) {
          const arquivo = anexo[y].split(':==:')[0];

          if (arquivo != '') {
            const path = anexo[y].split(':==:')[1];

            anexos.push([arquivo, path]);
          }
        }

        resultEm[i].anexo = anexos;
      }
    }

    const pool = await sql.connect(config);

    const resultWp = await pool
      .request()
      .input('telefone1', sql.BigInt, '55' + result1[0].telefone1.replace(/\D/g, ''))
      .input('telefone11', sql.BigInt, '55' + result1[0].telefone1.replace(/\D/g, ''))
      .input('telefone2', sql.BigInt, '55' + result1[0].telefone2.replace(/\D/g, ''))
      .input('telefone22', sql.BigInt, '55' + result1[0].telefone2.replace(/\D/g, ''))
      .input('remetente1', sql.BigInt, req.dealerWhatsapp1.replace(/\D/g, ''))
      .input('remetente11', sql.BigInt, req.dealerWhatsapp1.replace(/\D/g, ''))
      .input('remetente2', sql.BigInt, req.dealerWhatsapp2.replace(/\D/g, ''))
      .input('remetente22', sql.BigInt, req.dealerWhatsapp2.replace(/\D/g, ''))
      .input('remetente3', sql.BigInt, req.dealerWhatsapp3.replace(/\D/g, ''))
      .input('remetente33', sql.BigInt, req.dealerWhatsapp3.replace(/\D/g, ''))
      .query(
        `SELECT id, case when tipo = 'in' then remetente else telefone end remetente, mensagem, CONCAT(CONVERT(VARCHAR(20), data, 103), ' ', CONVERT(VARCHAR(20), data, 108)) data, 'whatsapp' tipo, tipo direcao, DATEDIFF(SECOND,{d '1970-01-01'}, data) timestamp, '' anexo, '' contentIdMap FROM WHATSAPP.MENSAGENS        where  (remetente = @telefone1 or telefone = @telefone11 or remetente = @telefone2 or telefone = @telefone22) and (remetente = @remetente1 or telefone = @remetente11 or remetente = @remetente2 or telefone = @remetente22 or remetente = @remetente3 or telefone = @remetente33)`
      );
    resultEm.push(...resultWp.recordset);

    const result = resultEm.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    sql.on('error', (err) => {});

    return res.status(200).send({
      status: 'ok',
      result,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao listar as mensagens.',
    });
  }
};

exports.listarCanais = async (req, res) => {
  try {
    if (req.body.dealer === undefined || req.body.lead === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const connection1 = await mysql.createConnection(dbConfig);
    const [
      result,
    ] = await connection1.query(
      'SELECT telefone1, telefone2, email FROM leads where (id = ?) and (dealer = ?)',
      [req.body.lead, req.body.dealer]
    );
    await connection1.end();

    const canais = [];

    if (req.dealerWhatsapp1) {
      if (result[0].telefone1) canais.push({ tipo: 'WhatsApp', destinatario: result[0].telefone1 });
      if (result[0].telefone2) canais.push({ tipo: 'WhatsApp', destinatario: result[0].telefone2 });
    }

    if (req.dealerEmail) {
      if (result[0].email) canais.push({ tipo: 'E-mail', destinatario: result[0].email });
    }

    return res.status(200).send({
      status: 'ok',
      canais,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao listar os canais.',
    });
  }
};

exports.enviarEmail = async (req, res) => {
  try {
    if (
      req.body.dealer === undefined ||
      req.body.lead === undefined ||
      req.body.destinatario === undefined ||
      req.body.assunto === undefined ||
      req.body.html === undefined ||
      req.body.anexos === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    const anexosEnviados = req.body.anexos; // anexos enviados pelo cliente
    let anexosMysql = ''; // anexos no formato que vou inserir no bd
    const anexosNodemailer = []; // anexos no formato que vou enviar para o nodemailer

    if (anexosEnviados !== '') {
      const anexos_enviados_array = req.body.anexos.split(';==;');

      for (let index = 0; index < anexos_enviados_array.length - 1; index++) {
        const anexoNodemailer = [];
        anexoNodemailer['filename'] = anexos_enviados_array[index].split('/').pop();
        anexoNodemailer['path'] = anexos_enviados_array[index].replace(
          process.env.STORAGE_HTTP,
          process.env.STORAGE
        );

        anexosNodemailer.push(anexoNodemailer);

        anexosMysql =
          anexosMysql +
          anexos_enviados_array[index].split('/').pop() +
          ':==:' +
          anexos_enviados_array[index] +
          ';==;';
      }
    }

    const result = await transporter.sendMail({
      from: req.dealerEmail,
      to: req.body.destinatario,
      subject: req.body.assunto,
      html: req.body.html,
      attachments: anexosNodemailer,
    });

    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.query(
      'INSERT INTO emails (remetente, email, html, idlead, assunto, messageId, direcao, data, anexo) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
      [
        req.dealerEmail,
        req.body.destinatario,
        req.body.html,
        req.body.lead,
        req.body.assunto,
        result.messageId,
        'out',
        anexosMysql,
      ]
    );
    await connection3.end();

    return res.status(200).send({
      status: 'ok',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao enviar o e-mail.',
    });
  }
};

exports.uploadAnexoEmail = async (req, res) => {
  try {
    const id = uuid.v1();

    const fileKeys = Object.keys(req.files);

    const arquivos = [];

    fileKeys.forEach((element) => {
      arquivos.push([
        req.files[element].name.replace(' ', ''),
        `${process.env.STORAGE_HTTP}${id}_${req.files[element].name.replace(' ', '')}`,
      ]);

      req.files[element].mv(
        `${process.env.STORAGE}${id}_${req.files[element].name.replace(' ', '')}`,
        (err) => {
          if (err) console.log(err);
        }
      );
    });

    return res.status(200).send({
      status: 'ok',
      arquivos,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao enviar o e-mail.',
    });
  }
};

exports.mailgun = async (req, res) => {
  try {
    let filenames = '';

    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      const filename = `${file.destination}${file.filename}`;
      filenames = filenames + file.originalname + ':==:' + filename + ';==;';

      const connection1 = await mysql.createConnection(dbConfig);
      await connection1.query('INSERT INTO arquivos (nome, nomeoriginal) values (?, ?)', [
        file.filename,
        file.originalname,
      ]);
      await connection1.end();
    }

    const connection0 = await mysql.createConnection(dbConfig);
    await connection0.query('UPDATE leads SET agendamentoContato = NOW() WHERE (email = ?)', [
      req.body.sender,
    ]);
    await connection0.end();

    const connection1 = await mysql.createConnection(dbConfig);
    await connection1.query(
      'INSERT INTO emails (remetente, email, html, emailcc, anexo, data, contentIdMap, direcao, assunto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.body.sender,
        req.body.recipient,
        req.body['stripped-html'],
        req.body.subject,
        filenames.split(process.env.STORAGE).join(process.env.STORAGE_HTTP),
        new Date(req.body.timestamp * 1000),
        req.body['content-id-map'],
        'in',
        req.body.subject,
      ]
    );
    await connection1.end();

    res.send('ok');
  } catch (err) {
    const html = `
        <!doctype html>
        <html lang="pr-br">
        <head>
            <title>Hooks Mailgun</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            </head>
        <body>
            <p>Você está recebendo este e-mail pois o processo de receber o retorno da Mailgun gerou um erro.</p>
            <p>headers: ${JSON.stringify(req.headers)}</p>
            <p>body: ${JSON.stringify(req.body)}</p>
            <p>error: ${err.message}/p>
        </body>
        </html>`;

    await transporter.sendMail({
      from: '"Robô Rocket Sales" <robot@rocketsales.app>',
      to: 'claudio@amaro.com.br',
      subject: 'Erro hooks Mailgun',
      html,
    });

    tratamentoErros(req, res, err);

    res.send('ok');
  }

  // ('From', u'Ev Kontsevoy '),
  // ('sender', u'ev@mailgunhq.com'),
  // ('To', u'Awesome Bot '),
  // ('attachment-count', u'1'),
  // ('Subject', u'Re: Your application')])
  // ('stripped-text', u'My application is attached.nThanks.'),
  // ('stripped-html', u'HTML version of stripped-text'),
  // ('body-html', u'[full html version of the message]'),
  // ('body-plain', u'[full text version of the message]'),
  // ('stripped-signature', u'-- nEv Kontsevoy,nCo-founder and CEO of Mailgun.net  - the emailnplatform for developers.'),
  // ('recipient', u'bot@hello.mailgun.org'),
  // ('subject', u'Re: Your application'),
  // ('timestamp', u'1320695889'),
  // ('signature', u'b8869291bd72f1ad38238429c370cb13a109eab01681a31b1f4a2751df1e3379'),
  // ('token', u'9ysf1gfmskxxsp1zqwpwrqf2qd4ctdmi5e$k-ajx$x0h846u88'),
  // ('In-Reply-To', u'Message-Id-of-original-message'),
  // ('Date', u'Mon, 7 Nov 2011 11:58:06 -0800'),
  // ('Message-Id', u'message-id-goes-here'),
  // ('X-Originating-Ip', u'[216.156.80.78]'),
  // # NOTE: ALL message fields are parsed and pasted. If some fields (like "Cc") are
  // # missing here it only means they were absent from the message.
};

exports.file = async (req, res) => {
  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [result] = await connection1.query('SELECT * FROM arquivos WHERE (nome = ?)', [
      req.params.filename,
    ]);
    await connection1.end();

    res.download(`${process.env.STORAGE}${req.params.filename}`, result[0].nomeoriginal);
  } catch (err) {
    tratamentoErros(req, res, err);
  }
};

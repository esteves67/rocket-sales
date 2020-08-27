const util = require('util');
const axios = require('axios');
const fs = require('fs');
const mysql = require('mysql2/promise');
const transporter = require('../util/nodemailer');
const tratamentoErros = require('../util/tratamentoErros');
const { Console } = require('console');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

async function processarUpload(files, dealer, lead, user) {
  const ret_files = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];

    const connection1 = await mysql.createConnection(dbConfig);
    await connection1.query(
      'INSERT INTO arquivos (idDealer, idLead, idUser, nome, nomeoriginal, mimetype, tamanho) values (?, ?, ?, ?, ?, ?, ?)',
      [dealer, lead, user, file.filename, file.originalname, file.mimetype, file.size]
    );
    await connection1.end();

    ret_files.push({ nome: file.originalname, caminho: process.env.STORAGE_HTTP + file.filename });
  }

  return ret_files;
}

exports.enviarWhatsApp = async (req, res) => {
  const instancia = 'instance165454';
  const key = '7dlzh5j2yg4pi1lv';
  const nro_loja = '1135113707';

  if (
    req.body.dealer === undefined ||
    req.body.lead === undefined ||
    req.body.tipo === undefined ||
    req.body.celular === undefined ||
    req.body.arquivos === undefined ||
    req.body.mensagem === undefined
  ) {
    return res.status(400).send({
      status: 'erro',
      tipo: 'Falha na Chamada',
      mensagem: 'Requisição inválida.',
    });
  }

  try {
    if (req.body.tipo === 'mensagem') {
      const result = await axios.post(
        `https://eu153.chat-api.com/${instancia}/sendMessage?token=${key}`,
        {
          phone: `55${req.body.celular}`,
          body: req.body.mensagem,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log(result);

      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'INSERT INTO whatsapp (idDealer, idlead, idUser, direcao, instancia, nro_loja, nro_cliente, mensagem, status, status_response, queuenumber, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          req.body.dealer,
          req.body.lead,
          req.userId,
          'out',
          instancia,
          nro_loja,
          req.body.celular,
          req.body.mensagem,
          'Enviada',
          JSON.stringify(result.data),
          result.data.queueNumber,
          result.data.id,
        ]
      );
      await connection3.end();
    } else if (req.body.tipo === 'arquivos') {
      const { arquivos } = req.body;

      for (let index = 0; index < arquivos.length; index++) {
        const arquivo = arquivos[index];

        const result = await axios.post(
          `https://eu153.chat-api.com/${instancia}/sendFile?token=${key}`,
          {
            phone: `55${req.body.celular}`,
            //body: arquivo.caminho + '.' + arquivo.nome.split('.').pop(),
            body: arquivo.caminho,
            filename: arquivo.nome,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const connection3 = await mysql.createConnection(dbConfig);
        await connection3.query(
          'INSERT INTO whatsapp (idDealer, idlead, idUser, direcao, instancia, nro_loja, nro_cliente, mensagem, status, status_response, queuenumber, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            req.body.dealer,
            req.body.lead,
            req.userId,
            'out',
            instancia,
            nro_loja,
            req.body.celular,
            arquivo.caminho,
            'Enviada',
            JSON.stringify(result.data),
            result.data.queueNumber,
            result.data.id,
          ]
        );
        await connection3.end();
      }
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
      'SELECT IFNULL(telefone1, 0) as telefone1, IFNULL(telefone2, 0) as telefone2, IFNULL(email, 0) as email FROM leads where (id = ?) and (dealer = ?)',
      [req.body.lead, req.body.dealer]
    );
    await connection1.end();

    const connection = await mysql.createConnection(dbConfig);
    const [resultEm] = await connection.query(
      `SELECT user.nome nomeUsuario, emails.direcao, emails.email_loja, emails.email, emails.assunto, emails.html, emails.anexo, emails.contentIdMap, emails.data, emails.status
      FROM emails left join user on emails.idUser = user.id
      WHERE ((emails.idlead = ?) OR (emails.email = ?)) AND (emails.iddealer = ?)
      union
      select user.nome nomeUsuario, whatsapp.direcao, whatsapp.nro_loja, whatsapp.nro_cliente, '' assunto, whatsapp.mensagem, '' anexo, '' contentIdMap, whatsapp.data, whatsapp.status
      from whatsapp left join user on whatsapp.idUser = user.id
      WHERE ((whatsapp.idlead = ?) OR (whatsapp.nro_cliente = ?) OR (whatsapp.nro_cliente = ?)) AND (whatsapp.iddealer = ?)
      order by data`,
      [
        req.body.lead,
        result1[0].email,
        req.body.dealer,
        req.body.lead,
        result1[0].telefone1,
        result1[0].telefone2,
        req.body.dealer,
      ]
    );
    await connection.end();

    for (let i = 0; i < resultEm.length; i++) {
      const anexos = JSON.parse(resultEm[i].anexo);
      const contentIdMap = JSON.parse(resultEm[i].contentIdMap);

      if (anexos != null && contentIdMap != null) {
        for (let k = 0; k < Object.entries(contentIdMap).length; k++) {
          const key = Object.entries(contentIdMap)[k][0];
          const cid = `cid:${key.replace('<', '').replace('>', '')}`;
          const attachment = contentIdMap[key].replace('attachment-', '') - 1;
          if (resultEm[i].html.search(cid) > 0) {
            resultEm[i].html = resultEm[i].html.replace(cid, anexos[attachment]['caminho']);
            anexos.splice(attachment);
          }
        }
      }
      resultEm[i].anexo = anexos;
    }

    return res.status(200).send({
      status: 'ok',
      resultEm,
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

    const result = await transporter.sendMail({
      from: req.dealerEmail,
      to: req.body.destinatario,
      subject: req.body.assunto,
      html: req.body.html,
      attachments: JSON.parse(
        JSON.stringify(req.body.anexos)
          .split('"nome":')
          .join('"filename":')
          .split('"caminho":')
          .join('"path":')
      ),
    });

    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.query(
      'INSERT INTO emails (idDealer, idlead, idUser, email_loja, email, html, assunto, messageId, direcao, anexo, status, status_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.body.dealer,
        req.body.lead,
        req.userId,
        req.dealerEmail,
        req.body.destinatario,
        req.body.html,
        req.body.assunto,
        result.messageId,
        'out',
        JSON.stringify(req.body.anexos),
        'Enviado',
        JSON.stringify(result),
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

exports.mailgun = async (req, res) => {
  try {
    const connection0 = await mysql.createConnection(dbConfig);
    await connection0.query(
      'UPDATE leads SET agendamentoContato = NOW() WHERE (email = ?) AND (dealer = ?)',
      [req.body.sender, 10] // TODO: pegar o codigo do dealer de acordo com a tabela dealerCanais
    );
    await connection0.end();

    const connection1 = await mysql.createConnection(dbConfig);
    await connection1.query(
      'INSERT INTO emails (idDealer, email_loja, email, html, assunto, anexo, data, contentIdMap, direcao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        10, // TODO: pegar o codigo do dealer de acordo com a tabela dealerCanais
        req.body.recipient,
        req.body.sender,
        req.body['stripped-html'],
        req.body.subject,
        JSON.stringify(await processarUpload(req.files, 10, null, null)),
        new Date(req.body.timestamp * 1000),
        req.body['content-id-map'],
        'in',
        'Recebido',
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

exports.chatapi = async (req, res) => {
  try {
    if (req.body.messages !== undefined) {
      if (req.body.messages[0].fromMe.toString() != 'true') {
        const nro_loja = '1135113707';
        const celular = req.body.messages[0].author.split('@')[0].slice(2);

        const connection0 = await mysql.createConnection(dbConfig);
        await connection0.query(
          'UPDATE leads SET agendamentoContato = NOW() WHERE (digits(telefone1) = ? or digits(telefone2) = ?) AND (dealer = ?)',
          [celular, celular, 10] // TODO: pegar o codigo do dealer de acordo com a tabela dealerCanais
        );
        await connection0.end();

        const connection3 = await mysql.createConnection(dbConfig);
        const [
          result,
        ] = await connection3.query(
          'INSERT INTO whatsapp (direcao, instancia, nro_loja, nro_cliente, mensagem, emResposta, status, status_response, queuenumber, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            'in',
            'instance' + req.body.instanceId.toString(),
            nro_loja,
            celular,
            req.body.messages[0].body,
            req.body.messages[0].quotedMsgBody,
            'Recebida',
            JSON.stringify(req.body),
            req.body.messages[0].messageNumber,
            req.body.messages[0].id,
          ]
        );
        await connection3.end();
      }
    } else if (req.body.ack !== undefined) {
      const messageNumber = req.body.ack[0].messageNumber;
    }

    res.send('OK');
  } catch (err) {
    const html = `
        <!doctype html>
        <html lang="pr-br">
        <head>
            <title>Hooks Chat-Api</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            </head>
        <body>
            <p>Você está recebendo este e-mail pois o processo de receber o retorno da chat-api gerou um erro.</p>
            <p>headers: ${JSON.stringify(req.headers)}</p>
            <p>body: ${JSON.stringify(req.body)}</p>
            <p>error: ${err.message}/p>
        </body>
        </html>`;

    await transporter.sendMail({
      from: '"Robô Rocket Sales" <robot@rocketsales.app>',
      to: 'claudio@amaro.com.br',
      subject: 'Erro hooks Chat-api',
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

exports.upload = async (req, res) => {
  try {
    if (req.body.dealer === undefined || req.body.lead === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    return res.status(200).send({
      status: 'ok',
      arquivos: await processarUpload(req.files, req.body.dealer, req.body.lead, req.userId),
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao enviar o(s) arquivo(s).',
    });
  }
};

exports.file = async (req, res) => {
  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [result] = await connection1.query('SELECT * FROM arquivos WHERE (nome = ?)', [
      req.params.filename,
    ]);
    await connection1.end();

    //res.download(`${process.env.STORAGE}${req.params.filename}`, result[0].nomeoriginal);

    // res.sendFile(`${process.env.STORAGE}${req.params.filename}`, {
    //   headers: { 'Content-Type': result[0].mimetype, 'Content-Disposition': 'attachment; filename="'+result[0].nomeoriginal+'"' },
    // });

    res.sendFile(`${process.env.STORAGE}${req.params.filename}`, {
      headers: {
        'Content-Type': result[0].mimetype,
        'Content-Disposition': 'filename="' + result[0].nomeoriginal + '"',
      },
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao realizar o download do arquivo.',
    });
  }
};

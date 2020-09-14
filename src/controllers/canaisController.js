const venom = require('venom-bot');
const axios = require('axios');
const mysql = require('mysql2/promise');
const transporter = require('../util/nodemailer');
const tratamentoErros = require('../util/tratamentoErros');

async function filter(arr, callback) {
  const fail = Symbol();
  return (
    await Promise.all(arr.map(async (item) => ((await callback(item)) ? item : fail)))
  ).filter((i) => i !== fail);
}

let venomClient = null;
async function startVenomClient() {
  venomClient = await venom.create();
}
startVenomClient();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

function nullif(valor) {
  return valor === '' ? null : valor;
}

async function processarUpload(files, dealer, lead, user, local) {
  const ret_files = [];

  if (files === undefined) return ret_files;

  for (let index = 0; index < files.length; index++) {
    const file = files[index];

    const connection1 = await mysql.createConnection(dbConfig);
    await connection1.query(
      'INSERT INTO arquivos (dealer, lead, user, nome, nomeoriginal, mimetype, tamanho, local) values (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nullif(dealer),
        nullif(lead),
        user,
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        local,
      ]
    );
    await connection1.end();

    ret_files.push({
      nome: file.originalname,
      caminho: process.env.STORAGE_HTTP + file.filename,
      mimetype: file.mimetype,
    });
  }

  return ret_files;
}

async function consultarWhatsApp(celular) {
  try {
    const response = await venomClient.getNumberProfile('55' + celular.toString() + '@c.us');

    if (response.status === 200) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

exports.consultarWhatsApp = consultarWhatsApp;

exports.verificarNumeroWhatsApp = async (req, res) => {
  try {
    return res.status(200).send({
      status: 'ok',
      whatsApp: await consultarWhatsApp(req.body.telefone),
    });
  } catch (error) {
    return res.status(400).send({
      status: 'erro',
      tipo: 'Falha na Chamada',
      mensagem: 'Requisição inválida.',
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
      'SELECT IFNULL(telefone1, 0) as telefone1, IFNULL(telefone2, 0) as telefone2, IFNULL(email, 0) as email, departamento, createdAt, finalizadoEm FROM leads where (id = ?) and (dealer = ?)',
      [req.body.lead, req.body.dealer]
    );
    await connection1.end();

    const connection = await mysql.createConnection(dbConfig);
    const [resultEm] = await connection.query(
      `SELECT user.nome nomeUsuario, 'E-mail' as tipo, emails.direcao, emails.email_loja endereco_loja, emails.email endereco_cliente, emails.assunto, emails.html mensagem, emails.anexo, emails.contentIdMap, data dataoriginal, DateTimeFormatPtBr(emails.data) data, emails.status, '' mimetype, '' emresposta_mensagem, '' emresposta_mimetype
      FROM
        emails left join user on emails.user = user.id
      WHERE
        (
          (emails.direcao = 'out') AND
          (emails.dealer = ?) AND
          (emails.lead = ?) AND
          (emails.data BETWEEN DATE_ADD(IFNULL(?, NOW()), INTERVAL -1 HOUR) AND DATE_ADD(IFNULL(?, NOW()), INTERVAL 1 HOUR))
        ) OR
        (
          (emails.direcao = 'in') AND
          (emails.email = ?) AND
          (emails.data BETWEEN DATE_ADD(IFNULL(?, NOW()), INTERVAL -1 HOUR) AND DATE_ADD(IFNULL(?, NOW()), INTERVAL 1 HOUR)) AND
          (emails.email_loja IN (
            SELECT endereco
            FROM dealercanais
            WHERE
              (dealer = ?) and
              (ativo = 1) and
              (departamento = ?) and
              (tipo = 'E-mail')
          ))
        )
        UNION
        SELECT 'Sistema' nome, 'Telefone', direcao, nro_loja, nro_cliente, '' assunto, 'Ligação no ramal 2222. Tempo 20 segundos. Status Ocupado' mensagem, '' anexo, '' contentIdMap, data dataoriginal, DateTimeFormatPtBr(data) data, '' status, '' mimetype,  '' emresposta_mensagem,  '' emresposta_mimetype
        FROM telefone
        UNION
        SELECT user.nome, 'WhatsApp', whatsapp.direcao, whatsapp.nro_loja, whatsapp.nro_cliente, '' assunto, whatsapp.mensagem, '' anexo, '' contentIdMap, whatsapp.data dataoriginal, DateTimeFormatPtBr(whatsapp.data) data, whatsapp.status, whatsapp.mimetype, whatsapp_emresposta.mensagem emresposta_mensagem, whatsapp_emresposta.mimetype emresposta_mimetype
        FROM
          whatsapp left join user on whatsapp.user = user.id
          left join whatsapp as whatsapp_emresposta on whatsapp.emrespostachatid = whatsapp_emresposta.chatid
        WHERE
        (
          (whatsapp.direcao = 'out') AND
          (whatsapp.dealer = ?) AND
          (whatsapp.data BETWEEN DATE_ADD(IFNULL(?, NOW()), INTERVAL -1 HOUR) AND DATE_ADD(IFNULL(?, NOW()), INTERVAL 1 HOUR)) AND
          (whatsapp.lead = ?)
        ) OR
        (
          (whatsapp.direcao = 'in') AND
          (whatsapp.data BETWEEN DATE_ADD(IFNULL(?, NOW()), INTERVAL -1 HOUR) AND DATE_ADD(IFNULL(?, NOW()), INTERVAL 1 HOUR)) AND
          (whatsapp.nro_cliente = ? or whatsapp.nro_cliente = ?) AND
          (whatsapp.instancia IN (
            SELECT chatapi_instance
            FROM dealercanais
            WHERE
              (dealer = ?) and
              (ativo = 1) and
              (departamento = ?) and
              (tipo = 'WhatsApp')
          ))
        )
        ORDER BY dataoriginal
        `,
      [
        req.body.dealer,
        req.body.lead,
        result1[0].createdAt,
        result1[0].finalizadoEm,

        result1[0].email,
        result1[0].createdAt,
        result1[0].finalizadoEm,
        req.body.dealer,
        result1[0].departamento,

        req.body.dealer,
        result1[0].createdAt,
        result1[0].finalizadoEm,
        req.body.lead,

        result1[0].createdAt,
        result1[0].finalizadoEm,
        result1[0].telefone1,
        result1[0].telefone2,
        req.body.dealer,
        result1[0].departamento,
      ]
    );
    await connection.end();

    for (let i = 0; i < resultEm.length; i++) {
      try {
        const anexos = JSON.parse(resultEm[i].anexo);
        const contentIdMap = JSON.parse(resultEm[i].contentIdMap);

        if (anexos != null && contentIdMap != null) {
          for (let k = 0; k < Object.entries(contentIdMap).length; k++) {
            const key = Object.entries(contentIdMap)[k][0];
            const cid = `cid:${key.replace('<', '').replace('>', '')}`;
            const attachment = contentIdMap[key].replace('attachment-', '') - 1;
            if (resultEm[i].mensagem.search(cid) > 0) {
              resultEm[i].mensagem = resultEm[i].mensagem.replace(
                cid,
                anexos[attachment]['caminho']
              );
              //anexos.slice(attachment);
            }
          }
        }
        resultEm[i].anexo = anexos;
      } catch (error) {}
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

    const connection0 = await mysql.createConnection(dbConfig);
    const [result0] = await connection0.query(
      `
      SELECT departamento FROM leads WHERE (id = ?) and (dealer = ?)
      `,
      [req.body.lead, req.body.dealer]
    );
    await connection0.end();

    const connection1 = await mysql.createConnection(dbConfig);
    const [result1] = await connection1.query(
      `
        SELECT endereco
        FROM dealercanais
        WHERE (dealer = ?) and (departamento = ?) and (tipo = 'E-mail') and (ativo = 1)
        LIMIT 1
      `,
      [req.body.dealer, result0[0].departamento]
    );
    await connection1.end();

    let result2 = {};

    try {
      result2 = await transporter.sendMail({
        from: result1[0].endereco,
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
    } catch (error) {}

    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.query(
      'INSERT INTO emails (dealer, lead, user, email_loja, email, html, assunto, messageId, direcao, anexo, status, status_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.body.dealer,
        req.body.lead,
        req.userId,
        result1[0].endereco,
        req.body.destinatario,
        req.body.html,
        req.body.assunto,
        result2.messageId,
        'out',
        JSON.stringify(req.body.anexos),
        result2.messageId !== undefined ? 'Enviado' : 'Erro',
        JSON.stringify(result2),
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
      `UPDATE leads SET agendamentoContato = NOW(), statusnegociacao = IF(finalizadoEm is null, statusnegociacao, "Em andamento"), finalizadoEm = null WHERE (email = ?) AND (dealer in (
        SELECT dealer
        FROM dealercanais
        WHERE (endereco = ?)
      ))`,
      [req.body.sender, req.body.recipient]
    );
    await connection0.end();

    const connection1 = await mysql.createConnection(dbConfig);
    await connection1.query(
      'INSERT INTO emails (email_loja, email, html, assunto, anexo, data, contentIdMap, direcao, status, emResposta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.body.recipient,
        req.body.sender,
        req.body['stripped-html'],
        req.body.subject,
        JSON.stringify(await processarUpload(req.files, null, null, null)),
        new Date(req.body.timestamp * 1000),
        req.body['content-id-map'],
        'in',
        'Recebido',
        req.body['In-Reply-To'],
      ]
    );
    await connection1.end();

    return res.send('ok');
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

    return res.send('ok');
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

exports.enviarWhatsApp = async (req, res) => {
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

  const connection0 = await mysql.createConnection(dbConfig);
  const [result0] = await connection0.query(
    `
      SELECT departamento FROM leads WHERE (id = ?) and (dealer = ?)
      `,
    [req.body.lead, req.body.dealer]
  );
  await connection0.end();

  const connection1 = await mysql.createConnection(dbConfig);
  const [result1] = await connection1.query(
    `
        SELECT chatapi_instance, chatapi_token, endereco
        FROM dealercanais
        WHERE (dealer = ?) and (departamento = ?) and (tipo = 'WhatsApp') and (ativo = 1)
        LIMIT 1
      `,
    [req.body.dealer, result0[0].departamento]
  );
  await connection1.end();

  try {
    if (req.body.tipo === 'texto') {
      let status = 'Erro';
      let result = {};
      let queueNumber = null;
      let id = null;

      try {
        result = await axios.post(
          `https://eu153.chat-api.com/instance${result1[0].chatapi_instance}/sendMessage?token=${result1[0].chatapi_token}`,
          {
            phone: `55${req.body.celular}`,
            body: req.body.mensagem,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        queueNumber = result.data.queueNumber;
        id = result.data.id;

        if (result.data.sent == true) {
          status = 'Enviando';
        }
      } catch (err) {}

      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'INSERT INTO whatsapp (dealer, lead, user, direcao, instancia, nro_loja, nro_cliente, mensagem, status, status_response, queuenumber, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          req.body.dealer,
          req.body.lead,
          req.userId,
          'out',
          result1[0].chatapi_instance,
          result1[0].endereco,
          req.body.celular,
          req.body.mensagem,
          status,
          JSON.stringify(result.data),
          queueNumber,
          id,
        ]
      );
      await connection3.end();
    } else if (req.body.tipo === 'arquivo') {
      const { arquivos } = req.body;

      for (let index = 0; index < arquivos.length; index++) {
        const arquivo = arquivos[index];

        let status = 'Erro';
        let result = {};
        let queueNumber = null;
        let id = null;

        try {
          result = await axios.post(
            `https://eu153.chat-api.com/instance${result1[0].chatapi_instance}/sendFile?token=${result1[0].chatapi_token}`,
            {
              phone: `55${req.body.celular}`,
              body: arquivo.caminho,
              filename: arquivo.nome,
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          queueNumber = result.data.queueNumber;
          id = result.data.id;

          if (result.data.sent == true) {
            status = 'Enviando';
          }
        } catch (err) {}

        const connection3 = await mysql.createConnection(dbConfig);
        await connection3.query(
          'INSERT INTO whatsapp (dealer, lead, user, direcao, instancia, nro_loja, nro_cliente, mensagem, status, status_response, queuenumber, chatId, mimetype) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            req.body.dealer,
            req.body.lead,
            req.userId,
            'out',
            result1[0].chatapi_instance,
            result1[0].endereco,
            req.body.celular,
            arquivo.caminho,
            status,
            JSON.stringify(result.data),
            queueNumber,
            id,
            arquivo.mimetype,
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

exports.chatapi = async (req, res) => {
  try {
    if (req.body.messages !== undefined) {
      if (req.body.messages[0].fromMe.toString() !== 'true') {
        const celular = req.body.messages[0].author.split('@')[0].slice(2);
        const instancia = req.body.instanceId;

        const connection0 = await mysql.createConnection(dbConfig);
        await connection0.query(
          `
          UPDATE leads
	          SET agendamentoContato = NOW(), statusnegociacao = IF(finalizadoEm is null, statusnegociacao, "Em andamento"), finalizadoEm = null
          WHERE
            (telefone1 = ? or telefone2 = ?) AND
            (dealer in (
              SELECT dealer
              FROM dealercanais
              WHERE (chatapi_instance = ?)
            ))`,
          [celular, celular, instancia]
        );
        await connection0.end();

        const connection1 = await mysql.createConnection(dbConfig);
        const [result1] = await connection1.query(
          `
              SELECT endereco
              FROM dealercanais
              WHERE (chatapi_instance = ?)
              LIMIT 1
            `,
          [instancia]
        );
        await connection1.end();

        const connection3 = await mysql.createConnection(dbConfig);
        await connection3.query(
          'INSERT INTO whatsapp (direcao, instancia, nro_loja, nro_cliente, mensagem, emResposta, emRespostaChatId, status, status_response, queuenumber, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            'in',
            req.body.instanceId,
            result1[0].endereco,
            celular,
            req.body.messages[0].body,
            req.body.messages[0].quotedMsgBody,
            req.body.messages[0].quotedMsgId,
            'Recebida',
            JSON.stringify(req.body),
            req.body.messages[0].messageNumber,
            req.body.messages[0].id,
          ]
        );
        await connection3.end();
      }
    } else if (req.body.ack !== undefined) {
      let status = null;

      if (req.body.ack[0].status == 'sent') {
        status = 'Enviada';
      } else if (req.body.ack[0].status == 'delivered') {
        status = 'Entregue';
      } else if (req.body.ack[0].status == 'viewed') {
        status = 'Lida';
      } else {
        return res.send('ok');
      }

      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'UPDATE whatsapp set status = ? where instancia = ? and queueNumber = ?',
        [status, req.body.instanceId, req.body.ack[0].queueNumber]
      );
      await connection3.end();
    }

    return res.send('ok');
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

    return res.send('ok');
  }
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
      arquivos: await processarUpload(
        req.files,
        req.body.dealer,
        req.body.lead,
        req.userId,
        req.body.local
      ),
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

    return res.sendFile(`${process.env.STORAGE}${req.params.filename}`, {
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

exports.listarCanais = async (req, res) => {
  if (req.body.dealer === undefined || req.body.lead === undefined) {
    return res.status(400).send({
      status: 'erro',
      tipo: 'Falha na Chamada',
      mensagem: 'Requisição inválida.',
    });
  }

  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [result] = await connection1.query(
      `SELECT
        dealercanais.id,
        dealercanais.tipo,
        dealercanais.endereco remetente,
        digits(telefone1) as destinatario,
        telefone1Whatsapp as whatsapp
      FROM leads inner join dealercanais on leads.dealer = dealercanais.dealer and leads.departamento = dealercanais.departamento
      where (leads.id = ?) and (leads.dealer = ?) and (tipo = 'whatsapp') and (digits(telefone1) is not null)
      union
      SELECT
        dealercanais.id,
        dealercanais.tipo,
        dealercanais.endereco remetente,
        digits(telefone2) as destinatario,
        telefone2Whatsapp as whatsapp
      FROM leads inner join dealercanais on leads.dealer = dealercanais.dealer and leads.departamento = dealercanais.departamento
      where (leads.id = ?) and (leads.dealer = ?) and (tipo = 'whatsapp') and (digits(telefone2) is not null)
      union
      SELECT
        dealercanais.id,
        dealercanais.tipo,
        dealercanais.endereco remetente,
        email as destinatario,
        0 as whatsapp
      FROM leads inner join dealercanais on leads.dealer = dealercanais.dealer and leads.departamento = dealercanais.departamento
      where (leads.id = ?) and (leads.dealer = ?) and (tipo = 'e-mail') and (EMAIL is not null)
    `,
      [
        req.body.lead,
        req.body.dealer,
        req.body.lead,
        req.body.dealer,
        req.body.lead,
        req.body.dealer,
      ]
    );
    await connection1.end();

    const result2 = await filter(result, async (item) => {
      if (item.tipo === 'WhatsApp' && item.whatsapp == 0) {
        return await consultarWhatsApp(item.destinatario);
      }
      return true;
    });

    return res.status(200).send({
      status: 'ok',
      result: result2,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao listar os canais de comunicação com esse cliente.',
    });
  }
};

exports.asterisk = async (req, res) => {
  if (
    req.query.direcao === undefined ||
    req.query.nro_loja === undefined ||
    req.query.nro_cliente === undefined ||
    req.query.ramal === undefined ||
    req.query.status === undefined ||
    req.query.tempo === undefined
  ) {
    return res.status(400).send({
      status: 'erro',
      tipo: 'Falha na Chamada',
      mensagem: 'Requisição inválida. Nem todos os parâmetros foram enviados.',
    });
  }

  try {
    if (req.query.direcao !== 'in' && req.query.direcao !== 'out') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem:
          'Valor inválido para o parâmetro "direcao". Os valores permitidos são "in" para ligações de entrada e "out" para ligações de saída.',
      });
    }

    if (
      req.query.nro_loja !== req.query.nro_loja.replace(/\D/g, '') ||
      req.query.nro_loja.length < 10 ||
      req.query.nro_loja.length > 11
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem:
          'Valor inválido para o parâmetro "nro_loja". O valor informado deve ser um número de 10 ou 11 dígitos. Exemplo: "1135113700" ou "11935113700".',
      });
    }

    if (
      req.query.nro_cliente !== req.query.nro_cliente.replace(/\D/g, '') ||
      req.query.nro_cliente.length < 10 ||
      req.query.nro_cliente.length > 11
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem:
          'Valor inválido para o parâmetro "nro_cliente". O valor informado deve ser um número de 10 ou 11 dígitos. Exemplo: "1135113700" ou "11935113700".',
      });
    }

    if (req.query.status === '') {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Não foi informado nenhum valor para o parâmetro "status".',
      });
    }

    if (req.query.tempo !== req.query.tempo.replace(/\D/g, '')) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem:
          'Valor inválido para o parâmetro "tempo". Deve ser informado um número inteiro que representa os segundos que a ligação durou.',
      });
    }

    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.query(
      'INSERT INTO telefone (direcao, nro_loja, ramal, nro_cliente, status, tempo) VALUES (?, ?, digits(?), ?, ?, ?)',
      [
        req.query.direcao,
        req.query.nro_loja,
        req.query.ramal,
        req.query.nro_cliente,
        req.query.status,
        req.query.tempo,
      ]
    );
    await connection3.end();

    return res.status(200).send({
      status: 'ok',
    });
  } catch (error) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro durante a requisição.',
    });
  }
};

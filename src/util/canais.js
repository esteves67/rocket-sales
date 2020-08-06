const sql = require('mssql');
const mysql = require('mysql2/promise');
const transporter = require('./nodemailer');

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

exports.whatsApp = async (remetente, telefone, mensagem, codEmpresa, idRocketLead) => {
  try {
    const pool = await sql.connect(config);

    await pool
      .request()
      .input('remetente', sql.BigInt, remetente)
      .input('telefone', sql.BigInt, telefone)
      .input('mensagem', sql.VarChar, mensagem)
      .input('codEmpresa', sql.Int, codEmpresa)
      .input('idRocketSales', sql.BigInt, idRocketLead)
      .query(
        'INSERT INTO WHATSAPP.MENSAGENS (REMETENTE, TELEFONE, MENSAGEM, CODEMPRESA, IDROCKETLEAD) VALUES (@remetente, @telefone, @mensagem, @codEmpresa, @idRocketSales)'
      );

    return { status: 'enviado' };
  } catch (err) {
    return { status: 'erro', err };
  }
};

function verificar_undefined(valor) {
  if (valor === undefined) return '';
  else return str(valor);
}

exports.listarMensagens = async (idRocketLead) => {
  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [
      result1,
    ] = await connection1.query('SELECT telefone1, telefone2, email FROM leads where (id = ?)', [
      idRocketLead,
    ]);
    await connection1.end();

    console.log(result1)

    const connection = await mysql.createConnection(dbConfig);
    const [
      resultEm,
    ] = await connection.query(
      `SELECT id, remetente, html mensagem, DateTimeFormatPtBr(data) data, 'email' tipo, direcao, unix_timestamp(convert_tz(data, '+00:00', @@session.time_zone)) as timestamp FROM emails WHERE (remetente = ?) or (email = ?)`,
      [result1[0].email, result1[0].email]
    );
    await connection.end();

    const pool = await sql.connect(config);

    const resultWp = await pool
      .request()
      .input('telefone1', sql.BigInt, '55' + verificar_undefined(result1[0].telefone1).toString().replace(/\D/g, ''))
      .input('telefone11', sql.BigInt, '55' + verificar_undefined(result1[0].telefone1).toString().replace(/\D/g, ''))
      .input('telefone2', sql.BigInt, '55' + verificar_undefined(result1[0].telefone2).toString().replace(/\D/g, ''))
      .input('telefone22', sql.BigInt, '55' + verificar_undefined(result1[0].telefone2).toString().replace(/\D/g, ''))
      .query(
        `SELECT id, case when tipo = 'in' then remetente else telefone end remetente, mensagem, CONCAT(CONVERT(VARCHAR(20), data, 103), ' ', CONVERT(VARCHAR(20), data, 108)) data, 'whatsapp' tipo, tipo direcao, DATEDIFF(SECOND,{d '1970-01-01'}, data) timestamp FROM WHATSAPP.MENSAGENS where remetente = @telefone1 or telefone = @telefone11 or remetente = @telefone2 or telefone = @telefone22`
      );
    resultEm.push(...resultWp.recordset);

    const result = resultEm.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    return { status: 'ok', result };
  } catch (err) {
    return { status: 'erro', err };
  }
};

exports.listarCanais = async (idRocketLead) => {
  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [
      result,
    ] = await connection1.query('SELECT telefone1, telefone2, email FROM leads where (id = ?)', [
      idRocketLead,
    ]);
    await connection1.end();

    const canais = [];

    if (result[0].telefone1) canais.push({ tipo: 'WhatsApp', destinatario: result[0].telefone1 });

    if (result[0].telefone2) canais.push({ tipo: 'WhatsApp', destinatario: result[0].telefone2 });

    if (result[0].email) canais.push({ tipo: 'E-mail', destinatario: result[0].email });

    return { status: 'ok', canais };
  } catch (err) {
    return { status: 'erro', err };
  }
};

exports.email = async (
  remetente,
  destinatario,
  destinataiocc,
  destinatariocco,
  assunto,
  html,
  lead
) => {
  try {
    const result = await transporter.sendMail({
      from: remetente,
      to: destinatario,
      subject: assunto,
      html,
    });

    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.query(
      'INSERT INTO emails (remetente, email, html, idlead, assunto, messageId, direcao, data) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [remetente, destinatario, html, lead, assunto, result.messageId, 'out']
    );
    await connection3.end();

    return { status: 'enviado' };
  } catch (err) {
    return { status: 'erro', err };
  }
};

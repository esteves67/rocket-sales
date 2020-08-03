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

exports.listarMensagens = async (idRocketLead) => {
  try {
    const connection1 = await mysql.createConnection(dbConfig);
    const [
      result1,
    ] = await connection1.query('SELECT telefone1, telefone2, email FROM leads where (id = ?)', [
      idRocketLead,
    ]);
    await connection1.end();

    const connection = await mysql.createConnection(dbConfig);
    const [
      resultEm,
    ] = await connection.query(
      `SELECT id, remetente, html mensagem, data, 'email' tipo FROM emails WHERE (remetente = ?) or (email = ?) order by id limit 2`,
      [result1[0].email, result1[0].email]
    );
    await connection.end();

    const pool = await sql.connect(config);

    const resultWp = await pool
      .request()
      .input('remetente', sql.BigInt, '55' + result1[0].telefone1.replace(/\D/g, ''))
      .input('destinatario', sql.BigInt, '55' + result1[0].telefone1.replace(/\D/g, ''))
      .input('remetente2', sql.BigInt, '55' + result1[0].telefone2.replace(/\D/g, ''))
      .input('destinatario2', sql.BigInt, '55' + result1[0].telefone2.replace(/\D/g, ''))
      .query(
        `SELECT id, remetente, mensagem, data, 'whatsapp' tipo FROM WHATSAPP.MENSAGENS where remetente = @remetente or telefone = @destinatario or  remetente = @remetente2 or telefone = @destinatario2`
      );

    resultEm.push(...resultWp.recordset);

    const result = resultEm.sort((a, b) => {
      return new Date(b.id) - new Date(a.id);
    });

    return { status: 'ok', result };
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
      'INSERT INTO emails (remetente, email, html, idlead, assunto, messageId) VALUES (?, ?, ?, ?, ?, ?)',
      [remetente, destinatario, html, lead, assunto, result.messageId]
    );
    await connection3.end();

    return { status: 'enviado' };
  } catch (err) {
    return { status: 'erro', err };
  }
};

const sql = require('mssql');
const mysql = require('mysql2');
const transporter = require('nodemailer');

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

exports.listarWhatsApp = async (idRocketLead) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .input('idRocketSales', sql.BigInt, idRocketLead)
      .query('SELECT * FROM WHATSAPP.MENSAGENS WHERE (IDROCKETLEAD = @idRocketSales)');

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
    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.query(
      'INSERT INTO emails (remetente, email, html, idlead) VALUES (?, ?, ?, ?)',
      [remetente, destinatario, html, lead]
    );
    await connection3.end();

    await transporter.sendMail({
      from: remetente,
      to: destinatario,
      subject: assunto,
      html,
    });

    return { status: 'enviado' };
  } catch (err) {
    return { status: 'erro', err };
  }
};

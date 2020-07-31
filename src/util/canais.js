const sql = require('mssql');
// const transporter = require('nodemailer');

const config = {
  user: 'rocketsales',
  password: 'TWV#!zd87S9X_-;V$#vsfqQR4',
  server: 'SERVER01',
  database: 'DBASE',
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

// exports.email = async (remetente, destinatario, assunto, mensagem, codEmpresa, idRocketLead) => {
//   await transporter.sendMail({
//     from: remetente,
//     to: destinatario,
//     subject: assunto,
//     html: mensagem,
//     // template: mensagem,
//     // context: {
//     //   link,
//     //   nome: rows[0].nome,
//     // },
//   });
// };

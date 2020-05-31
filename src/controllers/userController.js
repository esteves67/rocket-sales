const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const moment = require('moment');

// TODO: Criar Um Arquivo Externo Que Exporta O Objeto Transport.
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.signup = async (req, res) => {
  try {
    const user = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
    if (user.nome === undefined || user.password === undefined || user.email === undefined) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Requisição inválida.',
      });
    }

    // * validação
    if (!user.nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'nome',
        motivo: 'vazio',
        mensagem: 'O nome não foi informado.',
      });
    }

    // * validação
    if (!validator.isEmail(user.email)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'email',
        motivo: 'inválido',
        mensagem: 'Não foi informado um e-mail válido.',
      });
    }

    // * validação
    if (user.password.trim().length < 6) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'validação',
        campo: 'senha',
        motivo: 'fraca',
        mensagem: 'A senha precisa conter ao menos 6 caracteres.',
      });
    }

    // * verifica se o usuário já existe.
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute('SELECT * FROM user WHERE email = ?', [user.email]);
      await connection.end();

      if (rows.length === 1) {
        return res.status(400).send({
          status: 'erro',
          tipo: 'validação',
          campo: 'email',
          motivo: 'existente',
          mensagem: 'O usuário já existe.',
        });
      }
    } catch (err) {
      // * se ocorreu algum erro durante a consulta ao banco de dados, retorna erro 400.
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao inserir o usuário.',
      });
    }

    // * criptografando o password
    const passwd = await bcrypt.hash(user.password, 10);
    user.password = passwd;

    try {
      const connection2 = await mysql.createConnection(dbConfig);
      await connection2.query('INSERT INTO user SET ?', user);
      await connection2.end();

      const connection3 = await mysql.createConnection(dbConfig);
      const [rows] = await connection3.query('SELECT id FROM user WHERE email = ?', user.email);
      await connection3.end();

      const token = jwt.sign({ user: rows[0].id, email: rows[0].email }, process.env.SECRET, {
        expiresIn: 86400, // 24 horas
      });

      // TODO: Falta enviar um e-mail de boas-vindas para o usuário.

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Usuário incluído com sucesso.',
        token,
      });
    } catch (err) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao inserir o usuário.',
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao inserir o usuário.',
    });
  }
};

exports.auth = async (req, res) => {
  try {
    const user = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
    if (user.password === undefined || user.email === undefined) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Requisição inválida.',
      });
    }

    // * validação
    if (!validator.isEmail(user.email)) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'E-mail não localizado.',
      });
    }

    // * validação
    if (user.password.trim().length < 6) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Password inválido.',
      });
    }

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.query('SELECT * FROM user WHERE email = ?', user.email);
      await connection.end();

      // * se existe algum resultado, o usuário existe
      if (rows.length === 1) {
        // * comparando a senha, para ver se a senha está correta para esse usuário.
        if (!(await bcrypt.compare(user.password, rows[0].password))) {
          return res.status(400).send({
            status: 'erro',
            mensagem: 'Password inválido.',
          });
        }

        const token = jwt.sign({ user: rows[0].id, email: rows[0].email }, process.env.SECRET, {
          expiresIn: 86400, // 24 horas
        });

        const connection2 = await mysql.createConnection(dbConfig);
        const [rows2] = await connection2.query(
          'SELECT dealer FROM dealerUsers WHERE user = ? ORDER BY principal DESC',
          rows[0].id
        );
        await connection2.end();

        return res.status(200).send({
          status: 'ok',
          empresa: rows2.length > 0 ? rows2[0].dealer : 0,
          mensagem: 'Login realizado com sucesso.',
          token,
        });
      }

      // * se a consulta não retornou nada, o e-mail está inválido.
      return res.status(400).send({
        status: 'erro',
        mensagem: 'E-mail não localizado.',
      });
    } catch (err) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao realizar o login.',
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao realizar o login.',
    });
  }
};

exports.convite = async (req, res) => {
  try {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.query(
        'SELECT * FROM dealerConvites WHERE email = ?',
        req.userEmail
      );
      await connection.end();

      return res.status(200).send({
        status: 'ok',
        qtde_convites: rows.length,
        convites: rows,
      });
    } catch (err) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao obter os convites.',
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao obter os convites.',
    });
  }
};

exports.aceitarConvite = async (req, res) => {
  try {
    const convite = req.body;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.query(
        'SELECT * FROM dealerConvites WHERE id = ?',
        convite.convite
      );
      await connection.end();

      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'UPDATE dealerConvites set aceitoEm = CURRENT_TIMESTAMP WHERE id = ?',
        convite.convite
      );
      await connection3.end();

      const connection2 = await mysql.createConnection(dbConfig);
      await connection2.query(
        'INSERT INTO dealerUsers (dealer, user, permissao) VALUES (?, ?, ?)',
        [rows[0].dealer, req.userId, rows[0].permissao]
      );
      await connection2.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Convite aceito com sucesso.',
      });
    } catch (err) {
      console.log(err);
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Ocorreu um erro ao aceitar o convite.',
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao aceitar o convite.',
    });
  }
};

exports.sendMailPasswordReset = async (req, res) => {
  try {
    const user = req.body;

    // * se não foi enviado algum parâmetro obrigatório, retorno erro 400.
    if (user.email === undefined) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'Requisição inválida.',
      });
    }

    // * validação
    if (!validator.isEmail(user.email)) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'E-mail não localizado.',
      });
    }

    // * crio um token aleatório
    const buf = await crypto.randomBytes(20);
    const token = buf.toString('hex');

    // * defino a data que o token vai expirar
    const expires = moment(Date.now() + 7200000).format('YYYY-MM-DD HH:mm:ss'); // 2 Horas

    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      `UPDATE user SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?`,
      [token, expires, user.email]
    );
    await connection.end();

    const link = `http://${req.headers.host}/user/passwordReset/${token}`;

    const template_body = `
      <p>Olá, </p>
      <p>Para redefinir a senha clique aqui: <a href="${link}">${link}</a>.</p>
      <p>Caso você não tenha solicitado a redefinição de senha, por favor, desconsidere esse e-mail. </p>
      <p>Equipe Rocket Sales</p>
    `;

    const template_text = `
      Olá,
      Para redefinir a senha clique aqui: <a href="${link}">${link}</a>.
      Caso você não tenha solicitado a redefinição de senha, por favor, desconsidere esse e-mail.
      Equipe Rocket Sales
    `;

    // TODO: Criar o layout do e-mail que será enviado para o cliente
    await transporter.sendMail({
      from: '"Rocket Sales" <rocket-sales@amaro.com.br>',
      to: 'claudio@amaro.com.br', // user.email
      subject: 'Redefinição de Senha',
      text: template_text,
      html: template_body,
    });

    return res.status(400).send({
      status: 'ok',
      mensagem: 'E-mail enviado com sucesso.',
    });
  } catch (error) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Erro ao resetar o password.',
    });
  }
};

exports.checkTokenPasswordReset = async (req, res) => {
  try {
    const { token } = req.params;

    const connection3 = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection3.query(
      'SELECT id FROM user WHERE resetPasswordToken = ? and resetPasswordExpires > ?',
      [token, Date.now()]
    );
    await connection3.end();

    if (rows.length === 1) {
      return res.status(400).send({
        status: 'Ok.',
        mensagem: 'O token é válido.',
      });
    }

    return res.status(400).send({
      status: 'erro',
      mensagem: 'Token inválido.',
    });
  } catch (error) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Erro ao resetar o password.',
    });
  }
};

exports.passwordReset = async (req, res) => {
  try {
    const user = req.body;

    const connection3 = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection3.query(
      'SELECT id FROM user WHERE resetPasswordToken = ? and resetPasswordExpires > ?',
      [user.token, moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')]
    );
    await connection3.end();

    if (rows.length === 1) {
      let { password } = user;

      // * validação
      if (password.trim().length < 6) {
        return res.status(400).send({
          status: 'erro',
          tipo: 'validação',
          campo: 'senha',
          motivo: 'fraca',
          mensagem: 'A senha precisa conter ao menos 6 caracteres.',
        });
      }

      password = await bcrypt.hash(password, 10);

      const connection = await mysql.createConnection(dbConfig);
      const [
        result,
      ] = await connection.query(
        'UPDATE user SET password = ?, resetPasswordToken = null, resetPasswordExpires = null WHERE resetPasswordToken = ?',
        [password, user.token]
      );
      await connection.end();

      if (result.affectedRows === 1) {
        // TODO: enviar um e-mail alertando que a senha foi alterada.

        return res.status(200).send({
          status: 'ok',
          mensagem: 'Senha alterada com sucesso.',
        });
      }
    }
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Erro ao alterar a senha.',
    });
  } catch (error) {
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Erro ao alterar a senha.',
    });
  }
};

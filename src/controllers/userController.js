const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const transporter = require('../util/nodemailer');
const tratamentoErros = require('../util/tratamentoErros');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

exports.cadastro = async (req, res) => {
  try {
    const user = req.body;

    if (
      user.nome === undefined ||
      user.password === undefined ||
      user.email === undefined ||
      user.celular === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!user.nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O nome não foi informado.',
      });
    }

    if (!validator.isEmail(user.email)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'Não foi informado um e-mail válido.',
      });
    }

    user.celular = user.celular
      .toString()
      .replace('(', '')
      .replace(')', '')
      .replace('-', '')
      .replace(' ', '');
    if (user.celular.substring(2, 3) !== '9' || user.celular.length !== 11) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'Não foi informado um celular válido.',
      });
    }

    if (user.password.trim().length < 6) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
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
          tipo: 'Validação',
          mensagem: 'O usuário já existe.',
        });
      }
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir o usuário.',
      });
    }

    // * criptografando o password
    const passwd = await bcrypt.hash(user.password, 10);
    user.password = passwd;

    // * inserindo o usuário
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
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir o usuário.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o usuário.',
    });
  }
};

exports.autenticacao = async (req, res) => {
  try {
    const user = req.body;

    if (user.password === undefined || user.email === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!validator.isEmail(user.email)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Autenticação',
        mensagem: 'E-mail não localizado.',
      });
    }

    if (user.password.trim().length < 6) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Autenticação',
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
            tipo: 'Falha na Autenticação',
            mensagem: 'Password inválido.',
          });
        }

        const token = jwt.sign({ user: rows[0].id, email: rows[0].email }, process.env.SECRET, {
          expiresIn: 86400, // 24 horas
        });

        const connection2 = await mysql.createConnection(dbConfig);
        const [rows2] = await connection2.query(
          'SELECT dealer, permissao FROM dealerUsers WHERE user = ? ORDER BY principal DESC',
          rows[0].id
        );
        await connection2.end();

        return res.status(200).send({
          status: 'ok',
          mensagem: 'Login realizado com sucesso.',
          nome: rows[0].nome,
          empresa: rows2.length > 0 ? rows2[0].dealer : null,
          permissao: rows2.length > 0 ? rows2[0].permissao : null,
          token,
        });
      }

      // * se a consulta não retornou nada, o e-mail está inválido.
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Autenticação',
        mensagem: 'E-mail não localizado.',
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao realizar o login.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao realizar o login.',
    });
  }
};

exports.listarConvites = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT dealerconvites.id, dealer.nome as empresa, convidante.nome as convidante, dealerconvites.createdAt as data_convite FROM dealerconvites INNER JOIN dealer ON dealerconvites.dealer = dealer.id INNER JOIN user as convidante ON dealerconvites.convidante = convidante.id WHERE (dealerconvites.email = ?) and (dealerconvites.aceitoEm is null)',
      req.userEmail
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      qtde_convites: rows.length,
      convites: rows,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao obter os convites.',
    });
  }
};

exports.aceitarConvite = async (req, res) => {
  try {
    const convite = req.body;

    if (convite.convite === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.query(
        'SELECT * FROM dealerConvites WHERE (id = ?) and (email = ?)',
        convite.convite,
        req.userEmail
      );
      await connection.end();

      if (rows.length !== 1) {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'Esse convite não está disponível.',
        });
      }

      const connection1 = await mysql.createConnection(dbConfig);
      await connection1.query(
        'UPDATE dealerConvites set aceitoEm = CURRENT_TIMESTAMP WHERE id = ?',
        convite.convite
      );
      await connection1.end();

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
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao aceitar o convite.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao aceitar o convite.',
    });
  }
};

exports.enviarEmailResetarSenha = async (req, res) => {
  try {
    const user = req.body;

    if (user.email === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!validator.isEmail(user.email)) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
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
      'UPDATE user SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?',
      [token, expires, user.email]
    );
    await connection.end();

    const link = `http://${req.headers.host}/forgotPassword/verify?token=${token}`;

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
      to: user.email,
      subject: 'Redefinição de Senha',
      text: template_text,
      html: template_body,
    });

    return res.status(400).send({
      status: 'ok',
      mensagem: 'E-mail enviado com sucesso.',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao enviar o e-mail para resetar a senha.',
    });
  }
};

exports.verificarTokenResetarSenha = async (req, res) => {
  try {
    const { token } = req.params;

    const connection3 = await mysql.createConnection(dbConfig);
    const [
      rows,
    ] = await connection3.query(
      'SELECT id FROM user WHERE (resetPasswordToken = ?) and (resetPasswordExpires > ?)',
      [token, Date.now()]
    );
    await connection3.end();

    if (rows.length === 1) {
      return res.status(200).send({
        status: 'Ok',
        mensagem: 'O token é válido.',
      });
    }

    return res.status(400).send({
      status: 'erro',
      tipo: 'Validação',
      mensagem: 'Token inválido.',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao autorizar o reset da senha.',
    });
  }
};

exports.resetarSenha = async (req, res) => {
  try {
    const user = req.body;

    if (user.password === undefined || user.token === undefined) {
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
      'SELECT id FROM user WHERE (resetPasswordToken = ?) and (resetPasswordExpires > ?)',
      [user.token, moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')]
    );
    await connection.end();

    if (rows.length === 1) {
      let { password } = user;

      if (password.trim().length < 6) {
        return res.status(400).send({
          status: 'erro',
          tipo: 'Validação',
          mensagem: 'A senha precisa conter ao menos 6 caracteres.',
        });
      }

      password = await bcrypt.hash(password, 10);

      const connection2 = await mysql.createConnection(dbConfig);
      const [
        result,
      ] = await connection2.query(
        'UPDATE user SET password = ?, resetPasswordToken = null, resetPasswordExpires = null WHERE resetPasswordToken = ?',
        [password, user.token]
      );
      await connection2.end();

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
      tipo: 'Validação',
      mensagem: 'Token inválido.',
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Erro ao resetar a senha.',
    });
  }
};

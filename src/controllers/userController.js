const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// * função para incluir um novo usuário
// eslint-disable-next-line consistent-return
exports.post = async (req, res) => {
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

      const token = jwt.sign({ user: rows[0].id }, process.env.SECRET, {
        expiresIn: 86400, // 24 horas
      });

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

// exports.forgot = async (req, res) => {
//   try {
//     const user = req.body;

//     //sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

//     http: const buf = await crypto.randomBytes(20);
//     const token = buf.toString('hex');

//     const connection = await mysql.createConnection(dbConfig);
//     await connection.query(
//       `UPDATE user SET resetPasswordToken = '123123' WHERE email = '1claudio@rocket-sales.com.br'`
//     );
//     await connection.end();

//     console.log(token);

//     return res.status(400).send({
//       status: 'ok',
//       mensagem: 'ok.',
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).send({
//       status: 'erro',
//       mensagem: 'Erro ao resetar o password.',
//     });
//   }
// };

// eslint-disable-next-line consistent-return
exports.login = async (req, res) => {
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

        // TODO: Falta retornar um JWT
        return res.status(200).send({
          status: 'ok',
          mensagem: 'Login realizado com sucesso.',
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

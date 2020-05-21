const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

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

    // TODO: validação

    // * criptografando o password
    const passwd = await bcrypt.hash(user.password, 10);
    user.password = passwd;

    const connection = mysql.createConnection(dbConfig);

    connection.query('INSERT INTO user SET ?', user, (err) => {
      connection.end();

      if (err) {
        // * se ocorreu algum erro durante a inserção do usuário no banco de dados, retorna erro 400
        return res.status(400).send({
          status: 'erro',
          mensagem: 'Ocorreu um erro ao inserir o usuário.',
        });
      }

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Usuário incluído com sucesso.',
      });
    });
  } catch (error) {
    // * se ocorreu algum erro durante o processo de inserção de usuário, retorna erro 400.
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao inserir o usuário.',
    });
  }
};

// eslint-disable-next-line consistent-return
exports.get = async (req, res) => {
  try {
    const user = req.body;

    // TODO validação

    const connection = mysql.createConnection(dbConfig);

    connection.query(
      'SELECT * FROM user WHERE email = ?',
      user.email,
      async (err, results) => {
        connection.end();

        if (err) {
          // * se ocorreu algum erro durante a consulta ao banco de dados, retorna erro 400.
          return res.status(400).send({
            status: 'erro',
            mensagem: 'Ocorreu um erro ao realizar o login.',
          });
        }

        // * se existe algum resultado, o usuário existe
        if (results.length === 1) {
          // * comparando a senha, para ver se a senha está correta para esse usuário.
          if (!(await bcrypt.compare(user.password, results[0].password))) {
            return res.status(400).send({
              status: 'erro',
              mensagem: 'Password inválido.',
            });
          }

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
      }
    );
  } catch (error) {
    // * se ocorreu algum erro durante o processo de login, retorna erro 400.
    return res.status(400).send({
      status: 'erro',
      mensagem: 'Ocorreu um erro ao realizar o login.',
    });
  }
};

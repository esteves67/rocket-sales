const mysql = require('mysql2/promise');
const validator = require('validator');
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
    const dealer = req.body;

    if (
      dealer.nome === undefined ||
      dealer.fabricante === undefined ||
      dealer.plano === undefined ||
      dealer.contaFaturamento === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!dealer.nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O nome do dealer não foi informado.',
      });
    }

    if (!dealer.fabricante.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O fabricante não foi informado.',
      });
    }

    if (dealer.plano !== 1 && dealer.contaFaturamento === null) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A conta de faturamento não foi informada.',
      });
    }
    try {
      if (dealer.plano !== 1) {
        const connection0 = await mysql.createConnection(dbConfig);
        const [
          result0,
        ] = await connection0.query('SELECT * FROM faturamento WHERE id = ? and user = ?', [
          dealer.contaFaturamento,
          req.userId,
        ]);
        await connection0.end();

        // * verifico se a conta de faturamento existe e é pertencente a esse usuário.
        if (result0.length === 0) {
          return res.status(400).send({
            status: 'erro',
            tipo: 'Validação',
            mensagem: 'A conta de faturamento não está disponível.',
          });
        }
      }
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.query('INSERT INTO dealer SET ?', dealer);
      await connection.end();

      const connection2 = await mysql.createConnection(dbConfig);
      await connection2.query(
        'INSERT INTO dealerUsers (user, dealer, permissao) values (?, ?, ?)',
        [
          req.userId,
          result.insertId,
          4, // * administrador
        ]
      );
      await connection2.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Dealer incluído com sucesso.',
        dealerAtivo: {
          dealer: result.insertId,
          dealerNome: dealer.nome,
          permissao: 4,
        },
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir o dealer.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.editar = async (req, res) => {
  try {
    const dealer = req.body;

    if (
      dealer.dealer === undefined ||
      dealer.nome === undefined ||
      dealer.fabricante === undefined ||
      dealer.plano === undefined ||
      dealer.contaFaturamento === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!dealer.nome.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O nome do dealer não foi informado.',
      });
    }

    if (!dealer.fabricante.trim()) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'O fabricante não foi informado.',
      });
    }

    if (dealer.plano !== 1 && dealer.contaFaturamento === null) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Validação',
        mensagem: 'A conta de faturamento não foi informada.',
      });
    }
    try {
      if (dealer.plano !== 1) {
        const connection0 = await mysql.createConnection(dbConfig);
        const [
          result0,
        ] = await connection0.query('SELECT * FROM faturamento WHERE id = ? and user = ?', [
          dealer.contaFaturamento,
          req.userId,
        ]);
        await connection0.end();

        // * verifico se a conta de faturamento existe e é pertencente a esse usuário.
        if (result0.length === 0) {
          return res.status(400).send({
            status: 'erro',
            tipo: 'Validação',
            mensagem: 'A conta de faturamento não está disponível.',
          });
        }
      }

      const connection = await mysql.createConnection(dbConfig);
      const [
        result,
      ] = await connection.query(
        'UPDATE dealer SET nome = ?, fabricante = ?, plano = ?, contaFaturamento = ? where id = ?',
        [dealer.nome, dealer.fabricante, dealer.plano, dealer.contaFaturamento, dealer.dealer]
      );
      await connection.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Dealer alterado com sucesso.',
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao alterar o dealer.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao alterar o dealer.',
    });
  }
};

exports.listar = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [
      dealers,
    ] = await connection.query(
      'SELECT dealer.id, dealer.nome, fabricante, permissoes.nome as permissao, dealerUsers.principal FROM dealerUsers INNER JOIN dealer ON dealerUsers.dealer = dealer.id INNER JOIN permissoes on dealerusers.permissao = permissoes.id WHERE user = ?',
      [req.userId]
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      dealers,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.definirPrincipal = async (req, res) => {
  try {
    const { dealer } = req.body;

    if (dealer === undefined) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    try {
      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'UPDATE dealerUsers SET principal = IF(dealer = ?, 1, 0) WHERE user = ?',
        [dealer, req.userId]
      );
      await connection3.end();

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Dealer principal definido.',
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao inserir o dealer.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao inserir o dealer.',
    });
  }
};

exports.convidarUsuario = async (req, res) => {
  try {
    const convite = req.body;

    if (
      convite.email === undefined ||
      convite.permissao === undefined ||
      convite.dealer === undefined
    ) {
      return res.status(400).send({
        status: 'erro',
        tipo: 'Falha na Chamada',
        mensagem: 'Requisição inválida.',
      });
    }

    if (!validator.isEmail(convite.email)) {
      return res.status(400).send({
        status: 'erro',
        mensagem: 'E-mail inválido.',
      });
    }

    try {
      const connection3 = await mysql.createConnection(dbConfig);
      await connection3.query(
        'INSERT INTO dealerConvites (dealer, convidante, email, permissao) VALUES (?, ?, ?, ?)',
        [convite.dealer, req.userId, convite.email, convite.permissao]
      );
      await connection3.end();

      const connection4 = await mysql.createConnection(dbConfig);
      const [rows] = await connection4.query('SELECT nome FROM dealer where ID = ?', [
        convite.dealer,
      ]);
      await connection4.end();

      await transporter.sendMail({
        from: '"Rocket Sales" <rocket-sales@amaro.com.br>',
        to: convite.email,
        subject: 'Você recebeu um convite',
        template: 'Convite',
        context: { dealerNome: rows[0].nome },
      });

      return res.status(200).send({
        status: 'ok',
        mensagem: 'Usuário convidado com sucesso.',
      });
    } catch (err) {
      tratamentoErros(req, res, err);
      return res.status(400).send({
        status: 'erro',
        tipo: 'Erro de Servidor',
        mensagem: 'Ocorreu um erro ao convidar o usuário.',
      });
    }
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao convidar o usuário.',
    });
  }
};

exports.listarConvites = async (req, res) => {
  const { dealer } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [convites] = await connection.query(
      'SELECT dealerconvites.id, user.nome as convidante, dealerconvites.email, dealerconvites.createdAt as ConvidadoEm, dealerconvites.aceitoEm as ConviteAceitoEm FROM dealerconvites inner join user on dealerconvites.convidante = user.id where dealer = ?',
      dealer
    );
    await connection.end();

    return res.status(200).send({
      status: 'ok',
      convites,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao listar os convites.',
    });
  }
};

exports.dealer = async (req, res) => {
  const { dealer } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [loja] = await connection.query(
      'SELECT nome, fabricante, contaFaturamento, plano FROM dealer where id = ?',
      dealer
    );
    await connection.end();

    loja[0].permissao = req.userPermissao;

    return res.status(200).send({
      status: 'ok',
      loja,
    });
  } catch (err) {
    tratamentoErros(req, res, err);
    return res.status(400).send({
      status: 'erro',
      tipo: 'Erro de Servidor',
      mensagem: 'Ocorreu um erro ao obter os dados da loja.',
    });
  }
};

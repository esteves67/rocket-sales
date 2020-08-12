const canais = require('../util/canais');
var uuid = require('uuid');

exports.enviarWhatsApp = async (req, res) => {
  try {
    let status = '';

    if (req.body.tipo === 'files') {
      const files = req.body.mensagem.split(';');

      for (file of files) {
        status = await canais.whatsApp(
          5511934956360,
          req.body.celular,
          file,
          5,
          req.body.lead
        );
      }
    } else {
      status = await canais.whatsApp(
        5511934956360,
        req.body.celular,
        req.body.mensagem,
        5,
        req.body.lead
      );
    }

    return res.status(200).send({
      status,
    });
  } catch (err) {
    console.log(err)
    return res.status(400).send({
      err,
    });
  }
};

exports.listarMensagens = async (req, res) => {
  try {
    const status = await canais.listarMensagens(req.body.lead);

    return res.status(200).send({
      status,
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

exports.listarCanais = async (req, res) => {
  try {
    const status = await canais.listarCanais(req.body.lead);

    return res.status(200).send({
      status,
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

exports.enviarEmail = async (req, res) => {
  try {
    const status = await canais.email(
      'amaro@rocketsales.amaro.com.br',
      req.body.destinatario,
      null,
      null,
      req.body.assunto,
      req.body.html,
      req.body.lead
    );

    return res.status(200).send({
      status,
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

exports.uploadAnexoEmail = async (req, res) => {
  try {
    const id = uuid.v1();

    const fileKeys = Object.keys(req.files);

    const arquivos = [];

    fileKeys.forEach((element) => {
      arquivos.push([req.files[element].name.replace(
        ' ',
        ''
      ), `https://files.amaro.com.br/${id}_${req.files[element].name.replace(
        ' ',
        ''
      )}`])

      req.files[element].mv(
        `C:/Server-Web/Node/rocket-sales/public/${id}_${req.files[element].name.replace(
          ' ',
          ''
        )}`,
        (err) => {
          if (err) console.log(err);
        }
      );
    });

    return res.status(200).send({
      status: 'ok',
      arquivos
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

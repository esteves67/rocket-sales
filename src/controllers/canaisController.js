const canais = require('../util/canais');
var uuid = require('uuid');

exports.enviarWhatsApp = async (req, res) => {
  try {
    const status = await canais.whatsApp(
      5511934956360,
      req.body.celular,
      req.body.mensagem,
      5,
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

    fileKeys.forEach((element) => {
      req.files[element].mv(
        `C:/Server-Web/Node/rocket-sales-attachments/${id}_${req.files[element].name.replace(' ', '')}`,
        (err) => {
          if (err) console.log(err)
        }
      );
    });

    return res.status(200).send({
      status: 'ok',
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

const canais = require('../util/canais');

exports.enviarWhatsApp = async (req, res) => {
  try {
    const status = await canais.whatsApp(
      req.body.remetente,
      req.body.celular,
      req.body.mensagem,
      15,
      req.body.lead
    );

    return res.status(400).send({
      status,
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

exports.listarWhatsApp = async (req, res) => {
  try {
    const status = await canais.listarWhatsApp(req.body.lead);

    return res.status(400).send({
      status,
    });
  } catch (err) {
    return res.status(400).send({
      err,
    });
  }
};

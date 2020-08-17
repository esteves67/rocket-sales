/* eslint-disable no-console */
const tratamentoErros = function tratamentoErros(req, res, err) {
  console.log(err);
  return res.status(400).send({
    status: 'erro',
    tipo: 'Erro de Servidor',
    mensagem: err.message,
  });
};

module.exports = tratamentoErros;

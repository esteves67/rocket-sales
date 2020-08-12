require('dotenv').config({path: __dirname + '/../.env'});
const express = require('express');
const fileUpload = require('express-fileupload');

const cors = require('cors');

const app = express();

app.use(cors());

// * para o express identificar parametros via url e json
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(fileUpload(
  {createParentPath: true}
));

app.use(express.static(__dirname + '/../public'));

// * importação das rotas
app.use('/user', require('./routes/userRoute'));
app.use('/dealer', require('./routes/dealerRoute'));
app.use('/faturamento', require('./routes/faturamentoRoute'));
app.use('/menu', require('./routes/menuRoute'));
app.use('/showroom', require('./routes/showroomRoute'));
app.use('/canais', require('./routes/canaisRoute'));

module.exports = app;

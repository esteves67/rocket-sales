require('dotenv').config();
const express = require('express');

const app = express();

// * para o express identificar parametros via url e json
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// * importação das rotas
app.use('/user', require('./routes/userRoute'));

module.exports = app;

const express = require('express');
const indexRoute = require('./api/routes/index');
const authRoute = require('./api/routes/auth');
const shopRoute = require('./api/routes/shop');
const app = express();
const bodypaser = require('body-parser');

app.use(express.json());
app.use(bodypaser.json());
app.use('/', indexRoute);
app.use('/auth', authRoute);
app.use('/shop', shopRoute);





module.exports = app;
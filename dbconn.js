const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 10,
    host     : '202.28.34.197',
    user     : 'ts_66011212134',
    password : '66011212134@csmsu',
    database : 'ts_66011212134'
});

module.exports = pool;
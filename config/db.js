const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // deve ser shinkansen.proxy.rlwy.net
  user: process.env.DB_USER,       // root
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),  // 48964 — cuidado com o tipo (string -> number)
  timezone: '-03:00'
});

pool.getConnection((err, conn) => {
  if (err) {
    console.log('Erro ao conectar ao MySQL:', err);
  } else {
    console.log('Conectado ao MySQL!');
    conn.release();
  }
});

module.exports = pool;

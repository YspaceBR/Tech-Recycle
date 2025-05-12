const mysql = require("mysql2");
require("dotenv").config();

// Conexão com o MySQL
const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Conectar ao banco de dados MySQL
conn.connect((err) => {
  if (err) {
    console.log("Erro ao conectar ao MySQL:", err);
    return;
  }
  console.log("Conectado ao MySQL!");
});

module.exports = conn;
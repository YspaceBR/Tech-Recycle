require("dotenv").config(); // isso precisa ser a primeira linha
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // mysql.railway.internal
  user: process.env.DB_USER,       // root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // railway
  port: process.env.DB_PORT,       // 3306
  timezone: "-03:00",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  } else {
    console.log("Conectado ao MySQL!");
    conn.release();
  }
});

module.exports = pool;

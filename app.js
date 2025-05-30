const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

// Importar rotas
const publicRoutes = require("./routes/publicRoutes");
const authRoutes = require("./routes/authRoutes");

// Importar conexão com o banco de dados
const conn = require("./config/db");

const PORT = process.env.PORT || 3000;
const app = express();

// Configuração de sessão com MySQL
const sessionStore = new MySQLStore({}, conn.promise());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "seuSegredoAqui",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

// Middleware necessário para receber JSON via fetch
app.use(express.json());

// Middleware para parsing de formulários (POST HTML)
app.use(express.urlencoded({ extended: true }));

// Configuração do Handlebars
app.engine(
  "handlebars",
  exphbs.engine({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "/views/layouts"),
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "assets")));

// Usar rotas
app.use(publicRoutes);
app.use(authRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em ${PORT}`);
});

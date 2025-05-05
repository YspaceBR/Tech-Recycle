  const express = require("express");
  const exphbs = require("express-handlebars");
  const mysql = require("mysql2");
  const path = require("path");
  const session = require("express-session");
  const MySQLStore = require("express-mysql-session")(session);
  require("dotenv").config();

  const PORT = process.env.PORT || 3000;
  const app = express();

  const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const sessionStore = new MySQLStore({}, conn.promise());

  app.use(
    session({
      secret: "seuSegredoAqui",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
    })
  );

  app.use(express.urlencoded({
    extended: true
  }));

  app.engine(
    "handlebars",
    exphbs.engine({
      defaultLayout: "main",
      layoutsDir: __dirname + "/views/layouts",
    })
  );

  app.set("view engine", "handlebars");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.static(path.join(__dirname, "assets")));

  conn.connect((err) => {
    if (err) {
      console.log("Erro ao conectar ao MySQL:", err);
      return;
    }

    console.log("Conectado ao MySQL!");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em ${PORT}`);
    });
  });

  function checarAutenticacao(req, res, next) {
    if (req.session && req.session.usuario) {
      next();
    } else {
      res.redirect("/login");
    }
  }

  app.get("/", (req, res) => {
    res.render("public/home", {
      navClass: "nav-home",
    });
  });

  app.get("/login", (req, res) => {
    res.render("public/login", {
      layout: "main",
      navClass: "nav-login",
    });
  });

  app.get("/principal", checarAutenticacao, (req, res) => {
    const nome = req.session.usuario.nome || "Usuário";
    res.render("auth/principal", {
      layout: "auth",
      navClass: "nav-principal",
      nome: nome
    });
  });

  app.get("/reciclar", checarAutenticacao, (req, res) => {
    res.render("auth/reciclar", {
      layout: "auth",
      navClass: "nav-reciclar",
    });
  });

  app.get("/user", checarAutenticacao, (req, res) => {
    res.render("auth/user", {
      layout: "auth",
      navClass: "nav-user",
      nome: req.session.usuario.nome || "Usuário",
    });
  });

  app.get("/dados", checarAutenticacao, (req, res) => {
    if (!req.session.usuario || !req.session.usuario.email) {
      console.log("Sessão de usuário inválida");
      return res.redirect("/login");
    }

    const emailUsuario = req.session.usuario.email;
    console.log("Email da sessão:", emailUsuario);

    const sql = "SELECT nome, email, senha FROM usuarios WHERE email = ?";

    conn.query(sql, [emailUsuario], (err, results) => {
      if (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        return res.status(500).send("Erro ao buscar dados.");
      }

      if (results.length === 0) {
        console.log("Nenhum usuário encontrado para o email:", emailUsuario);
        return res.render("auth/dados", {
          layout: "auth",
          navClass: "nav-dados",
          erro: "Usuário não encontrado.",
        });
      }

      const usuario = results[0];
      //console.log("Usuário encontrado:", usuario); linha de log para depuração//

      res.render("auth/dados", {
        layout: "auth",
        navClass: "nav-dados",
        usuario: usuario,
      });
    });
  });


  app.get("/mapa", checarAutenticacao, (req, res) => {
    res.render("auth/mapa", {
      layout: "maps",
      navClass: "nav-mapa",
    });
  });

  app.get("/cadastrar", (req, res) => {
    res.render("public/cadastrar", {
      navClass: "nav-cadastrar",
    });
  });

  app.post("/cadastrar", (req, res) => {
    const {
      nome,
      email,
      senha
    } = req.body;

    // Verifica se o e-mail já existe
    const checkEmailSql = "SELECT * FROM usuarios WHERE email = ?";
    conn.query(checkEmailSql, [email], (err, results) => {
      if (err) {
        console.error("Erro ao verificar e-mail:", err);
        return res.status(500).send("Erro interno");
      }

      if (results.length > 0) {
        // E-mail já cadastrado
        return res.render("public/cadastrar", {
          navClass: "nav-cadastrar",
          errorMessage: "E-mail já está em uso."
        });
      }

      // Se não existir, insere o novo usuário
      const insertSql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
      conn.query(insertSql, [nome, email, senha], (err, result) => {
        if (err) {
          console.error("Erro ao cadastrar usuário:", err);
          return res.status(500).send("Erro ao cadastrar");
        }

        console.log("Usuário cadastrado com sucesso!");
        res.redirect("/login");
      });
    });
  });

  app.post("/excluir", checarAutenticacao, (req, res) => {
    const usuarioId = req.session.usuario.id;

    const sql = "DELETE FROM usuarios WHERE id = ?";
    conn.query(sql, [usuarioId], (err, result) => {
      if (err) {
        console.error("Erro ao excluir usuário:", err);
        return res.status(500).send("Erro ao excluir a conta.");
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Erro ao encerrar a sessão:", err);
          return res.status(500).send("Erro ao sair.");
        }

        res.redirect("/");
      });
    });
  });

  app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao encerrar a sessão:", err);
        return res.status(500).send("Erro ao sair");
      }
      res.redirect("/login");
    });
  });

  app.post("/login", (req, res) => {
    const {
      email,
      password
    } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ? AND senha = ?";
    conn.query(sql, [email, password], (err, results) => {
      if (err) {
        console.error("Erro ao buscar usuário:", err);
        return res.status(500).send("Erro interno no servidor.");
      }

      if (results.length === 0) {
        return res.render("public/login", {
          erro: "Email ou senha incorretos."
        });
      }

      const usuario = results[0];

      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      };

      res.redirect("/principal");
    });
  });

  module.exports = conn;
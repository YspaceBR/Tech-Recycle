const express = require("express");
const exphbs = require("express-handlebars");
const mysql = require("mysql2");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bcrypt = require("bcryptjs"); // Para criptografar senhas
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

// Conexão com o MySQL
const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

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

// Middleware para parsing de corpo de requisição
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

// Conectar ao banco de dados MySQL
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

// Função de autenticação
function checarAutenticacao(req, res, next) {
  if (req.session && req.session.usuario) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Rotas
app.get("/", (req, res) => {
  res.render("public/home", { navClass: "nav-home" });
});

app.get("/login", (req, res) => {
  res.render("public/login", { layout: "main", navClass: "nav-login" });
});

app.get("/principal", checarAutenticacao, (req, res) => {
  const nome = req.session.usuario.nome || "Usuário";
  res.render("auth/principal", {
    layout: "auth",
    navClass: "nav-principal",
    nome: nome,
  });
});

app.get("/reciclar", checarAutenticacao, (req, res) => {
  res.render("auth/reciclar", { layout: "auth", navClass: "nav-reciclar" });
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
    res.render("auth/dados", { layout: "auth", navClass: "nav-dados", usuario: usuario });
  });
});

app.get("/mapa", checarAutenticacao, (req, res) => {
  res.render("auth/mapa", { layout: "maps", navClass: "nav-mapa" });
});

app.get("/agenda", checarAutenticacao, (req, res) => {
  res.render("auth/agenda", { layout: "auth", navClass: "nav-agenda" });
});

app.get("/cadastrar", (req, res) => {
  res.render("public/cadastrar", { navClass: "nav-cadastrar" });
});

app.get("/formulario", (req, res) => {
  res.render("auth/formulario", { layout: "auth", navClass: "nav-formulario" });
});

// Endpoint de agendamento
app.post('/agendar', async (req, res) => {
  const {
    data,
    material,
    peso,
    observacao,
    usarCadastro,
    local
  } = req.body;

  const idUsuario = req.session.usuario.id;  // Ajustado de user para usuario

  if (!local) {
    return res.status(400).send('Local de coleta não informado');
  }

  conn.query('SELECT ID_Empresa FROM Empresa WHERE NomeEmpresa = ?', [local], async (err, results) => {
    if (err) {
      console.error('Erro ao buscar empresa:', err);
      return res.status(500).send('Erro ao buscar empresa');
    }

    if (results.length === 0) {
      return res.status(400).send('Empresa não encontrada');
    }

    const idEmpresa = results[0].ID_Empresa;

    try {
      // Debug: Verifique os valores antes de inserir
      console.log(`Data: ${data}, ID_Usuario: ${idUsuario}, ID_Empresa: ${idEmpresa}`);

      const coletaQuery = 'INSERT INTO Coleta (Data, ID_Usuario, ID_Empresa) VALUES (?, ?, ?)';
      const [coletaResult] = await conn.promise().query(coletaQuery, [data, idUsuario, idEmpresa]);

      const idColeta = coletaResult.insertId; // Pega o ID da coleta inserida

      const dispositivoQuery = 'INSERT INTO Dispositivo (Tipo, ID_Coleta, ID_Usuario) VALUES (?, ?, ?)';
      await conn.promise().query(dispositivoQuery, [material, idColeta, idUsuario]);

      res.redirect('/principal');
    } catch (err) {
      console.error('Erro ao inserir agendamento ou dispositivo:', err);
      res.status(500).send('Erro ao salvar agendamento');
    }
  });
});

// Cadastro de usuário
app.post("/cadastrar", (req, res) => {
  const { nome, email, senha } = req.body;

  // Verifica se o e-mail já existe
  const checkEmailSql = "SELECT * FROM usuarios WHERE email = ?";
  conn.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error("Erro ao verificar e-mail:", err);
      return res.status(500).send("Erro interno");
    }

    if (results.length > 0) {
      return res.render("public/cadastrar", {
        navClass: "nav-cadastrar",
        errorMessage: "E-mail já está em uso."
      });
    }

    // Criptografar senha
    bcrypt.hash(senha, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Erro ao criptografar senha:", err);
        return res.status(500).send("Erro ao cadastrar");
      }

      const insertSql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
      conn.query(insertSql, [nome, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Erro ao cadastrar usuário:", err);
          return res.status(500).send("Erro ao cadastrar");
        }

        console.log("Usuário cadastrado com sucesso!");
        res.redirect("/login");
      });
    });
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao encerrar a sessão:", err);
      return res.status(500).send("Erro ao sair");
    }
    res.redirect("/login");
  });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM usuarios WHERE email = ?";
  conn.query(sql, [email], (err, results) => {
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

    // Verificar senha
    bcrypt.compare(password, usuario.senha, (err, isMatch) => {
      if (err || !isMatch) {
        return res.render("public/login", {
          erro: "Email ou senha incorretos."
        });
      }

      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      };

      res.redirect("/principal");
    });
  });
});

module.exports = conn;

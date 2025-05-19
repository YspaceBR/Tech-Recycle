const conn = require("../config/db");

// Controller para páginas de usuário
exports.getPrincipal = (req, res) => {
  const nome = req.session.usuario.nome || "Usuário";
  res.render("auth/principal", {
    layout: "auth",
    navClass: "nav-principal",
    nome: nome,
  });
};

exports.getReciclar = (req, res) => {
  res.render("auth/reciclar", { layout: "auth", navClass: "nav-reciclar" });
};

exports.getUser = (req, res) => {
  res.render("auth/user", {
    layout: "auth",
    navClass: "nav-user",
    nome: req.session.usuario.nome || "Usuário",
  });
};

exports.getDados = (req, res) => {
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
};

exports.getMapa = (req, res) => {
  res.render("auth/mapa", { layout: "maps", navClass: "nav-mapa" });
};

exports.getAgenda = (req, res) => {
  res.render("auth/agenda", { layout: "auth", navClass: "nav-agenda" });
};

exports.getBusca = (req, res) => {
  res.render("auth/busca", { layout: "maps", navClass: "nav-busca" });
};

exports.getFormulario = (req, res) => {
  res.render("auth/formulario", { layout: "auth", navClass: "nav-formulario" });
};
const bcrypt = require("bcryptjs");
const conn = require("../config/db");

// Controller de autenticação
exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM usuarios WHERE email = ?";
  conn.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).send("Erro interno no servidor.");
    }

    if (results.length === 0) {
      return res.render("public/login", {
        navClass: "nav-login",
        erro: "Email ou senha incorretos."
      });
    }

    const usuario = results[0];

    // Verificar senha
    bcrypt.compare(password, usuario.senha, (err, isMatch) => {
      if (err || !isMatch) {
        return res.render("public/login", {
          navClass: "nav-login",
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
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao encerrar a sessão:", err);
      return res.status(500).send("Erro ao sair");
    }
    res.redirect("/login");
  });
};

exports.excluirConta = (req, res) => {
  const userId = req.session.usuario.id;

  const deletarDispositivos = `
    DELETE FROM Dispositivo 
    WHERE ID_Coleta IN (
      SELECT ID_Coleta FROM Coleta WHERE ID_Usuario = ?
    )`;

  conn.query(deletarDispositivos, [userId], (err) => {
    if (err) {
      console.error("Erro ao deletar dispositivos:", err);
      return res.status(500).send("Erro ao excluir dispositivos");
    }

    const deletarColetas = `DELETE FROM Coleta WHERE ID_Usuario = ?`;
    conn.query(deletarColetas, [userId], (err) => {
      if (err) {
        console.error("Erro ao deletar coletas do usuário:", err);
        return res.status(500).send("Erro ao excluir coletas");
      }

      const deletarUsuario = `DELETE FROM usuarios WHERE id = ?`;
      conn.query(deletarUsuario, [userId], (err) => {
        if (err) {
          console.error("Erro ao excluir conta:", err);
          return res.status(500).send("Erro ao excluir conta");
        }

        req.session.destroy(() => {
          res.redirect("/login");
        });
      });
    });
  });
};




exports.register = (req, res) => {
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
};
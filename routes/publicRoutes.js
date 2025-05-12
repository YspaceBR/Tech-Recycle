const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Rota da página inicial
router.get("/", (req, res) => {
  res.render("public/home", { navClass: "nav-home" });
});

// Rotas de login
router.get("/login", (req, res) => {
  res.render("public/login", { layout: "main", navClass: "nav-login" });
});
router.post("/login", authController.login);

// Rotas de cadastro
router.get("/cadastrar", (req, res) => {
  res.render("public/cadastrar", { navClass: "nav-cadastrar" });
});
router.post("/cadastrar", authController.register);

// Rota de logout
router.get("/logout", authController.logout);

module.exports = router;
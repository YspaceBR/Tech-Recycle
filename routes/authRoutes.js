const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const coletaController = require("../controllers/coletaController");
const { checarAutenticacao } = require("../middlewares/authMiddleware");

// Aplicar middleware de autenticação para todas as rotas
router.use(checarAutenticacao);

// Rotas de páginas autenticadas
router.get("/principal", usuarioController.getPrincipal);
router.get("/reciclar", usuarioController.getReciclar);
router.get("/user", usuarioController.getUser);
router.get("/dados", usuarioController.getDados);
router.get("/mapa", usuarioController.getMapa);
router.get("/agenda", usuarioController.getAgenda);
router.get("/formulario", usuarioController.getFormulario);

// Rota para agendamento de coleta
router.post("/agendar", coletaController.agendarColeta);

module.exports = router;
const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const coletaController = require("../controllers/coletaController");
const authController = require("../controllers/authController"); // <- ESSA LINHA FALTAVA
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
router.get("/busca", usuarioController.getBusca);

// Rota para agendamento de coleta
router.post("/agendar-coleta", coletaController.agendarColeta);
router.post('/cancelar-coleta', coletaController.cancelarColeta);
router.get('/minhas-coletas', coletaController.buscarAgendamento);
router.post('/reagendar-coleta', coletaController.reagendarColeta);
router.get('/buscar-agendamento', coletaController.buscarAgendamentosAPI);

// Rota de exclusão de conta
router.post("/excluir", authController.excluirConta);

module.exports = router;
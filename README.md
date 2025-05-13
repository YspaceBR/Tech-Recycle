# 🌱 Tech-Recycle

Sistema web para incentivar o descarte correto de resíduos, com cadastro e login de usuários, funcionalidades de mapa e informações de reciclagem.

## 📁 Estrutura do Projeto

Tech-Recycle/
├── config/
│ └── db.js # Configuração do banco de dados
├── controllers/
│ ├── authController.js # Controlador de autenticação
│ ├── coletaController.js # Controlador de coletas
│ └── usuarioController.js # Controlador de usuários
├── middlewares/
│ └── authMiddleware.js # Middleware de autenticação
├── routes/
│ ├── authRoutes.js # Rotas autenticadas
│ └── publicRoutes.js # Rotas públicas
├── views/ # Suas views existentes
├── assets/ # Seus arquivos estáticos existentes
└── app.js # Arquivo principal da aplicação

## 📦 Tecnologias

- Node.js
- Express
- MySQL
- Handlebars
- bcrypt (hash de senha)
- express-session

## 🚀 Como rodar localmente

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o `.env` com os dados do MySQL
4. Inicie com `npm start`

## ✅ Requisitos Atendidos

### Funcionais
- Cadastro e login de usuários
- Visualização de pontos de coleta no mapa
- Agendamento de coletas com data e local

### Não Funcionais
- Armazenamento seguro de senhas com hash (bcrypt)
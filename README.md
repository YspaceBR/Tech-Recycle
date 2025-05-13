    # 🌱 Tech-Recycle
    Sistema web para incentivar o descarte correto de resíduos, com cadastro e login de usuários, funcionalidades de mapa e informações de reciclagem.

    ## 📁 Estrutura do Projeto

    Tech-Recycle/
    <<<<<<< HEAD
    ├── config/
    │   └── db.js                 # Configuração do banco de dados
    ├── controllers/
    │   ├── authController.js     # Controlador de autenticação
    │   ├── coletaController.js   # Controlador de coletas
    │   └── usuarioController.js  # Controlador de usuários
    ├── middlewares/
    │   └── authMiddleware.js     # Middleware de autenticação
    ├── routes/
    │   ├── authRoutes.js         # Rotas autenticadas
    │   └── publicRoutes.js       # Rotas públicas
    ├── views/                    # Suas views existentes
    ├── assets/                   # Seus arquivos estáticos existentes
    └── app.js                    # Arquivo principal da aplicação


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

    - Cadastro e login de usuários
    - Armazenamento de senha com hash (bcrypt)
    - Visualização de pontos de coleta em mapa
    - Sessão segura com express-session


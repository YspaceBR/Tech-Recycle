# 🌱 Tech-Recycle

Sistema web para incentivar o descarte correto de resíduos, com cadastro e login de usuários, funcionalidades de mapa e informações de reciclagem.

---

## 📁 Estrutura do Projeto

```
Tech-Recycle/
├── config/                   # Configuração do banco de dados
│   └── db.js
├── controllers/              # Lógica dos controladores
│   ├── authController.js
│   ├── coletaController.js
│   └── usuarioController.js
├── middlewares/             # Middlewares da aplicação
│   └── authMiddleware.js
├── routes/                  # Definição das rotas
│   ├── authRoutes.js
│   └── publicRoutes.js
├── views/                   # Páginas renderizadas com Handlebars
│   └── auth/
│       └── principal.handlebars
├── assets/                  # Arquivos estáticos (CSS, imagens, fontes)
├── app.js                   # Arquivo principal da aplicação
└── .env                     # Variáveis de ambiente
```

---

## 📦 Tecnologias

- Node.js  
- Express  
- MySQL  
- Handlebars  
- bcrypt (hash de senha)  
- express-session  

---

## 🚀 Como rodar localmente

1. Clone o repositório  
2. Instale as dependências: `npm install`  
3. Configure o `.env` com os dados do MySQL  
4. Inicie com `npm start`  

---

## ✅ Requisitos Atendidos

### Funcionais
- Cadastro e login de usuários  
- Visualização de pontos de coleta no mapa  
- Agendamento de coletas com data e local  

### Não Funcionais
- Armazenamento seguro de senhas com hash (bcrypt)

---
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
├── assets/                  # Arquivos estáticos (CSS, imagens, fontes)
├── test/                    # Testes automatizados
│   └── passwordValidator.test.js
├── src/                     # Funções auxiliares (ex: passwordValidator.js)
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
- Jest  (testes unitários)
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

## 🧪 Como rodar os testes

Este repositório também demonstra a aplicação de **testes unitários** utilizando **Node.js** e **Jest**, focando na validação da função `passwordValidator`, que garante requisitos mínimos de segurança para senhas.

---

## ✅ 1. O que é um Teste Unitário?

É uma técnica de desenvolvimento onde testamos **unidades individuais de código** (geralmente funções) de forma **isolada** para garantir que funcionem corretamente.

No nosso caso, a unidade testada é a função:

```javascript
passwordValidator(password)
```

---

## ✅ 2. Como estruturamos o teste no Tech-Recycle

### 2.1 Função `passwordValidator.js`

Esta função verifica se a senha:

- Tem **no mínimo 8 caracteres**
- Contém **ao menos uma letra maiúscula**
- Contém **ao menos um número**

**Exemplo da função:**

```javascript
function passwordValidator(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
 
    return password.length >= minLength && hasUpperCase && hasNumber;
}

module.exports = passwordValidator;
```

---

### 2.2 Arquivo de Teste: `passwordValidator.test.js`

Este arquivo contém os **cenários de teste** com a biblioteca Jest.

**Exemplo de teste:**

```javascript
const passwordValidator = require('../src/passwordValidator');

test('Senha inválida: sem número', () => {
    expect(passwordValidator('SenhaFraca')).toBe(false);
});
```

---

## ✅ 3. Como rodar os testes?

### 3.1 Instale o Jest:

```bash
npm install jest --save-dev
```

### 3.2 Configure o `package.json`:

Adicione o seguinte script:

```json
"scripts": {
  "test": "jest"
}
```

### 3.3 Execute os testes:

```bash
npm test
```

O Jest buscará todos os arquivos `*.test.js` e executará os testes.

---

## ✅ 4. Exemplo de saída no terminal:

```
PASS  ./passwordValidator.test.js
✓ Senha válida: contém maiúscula, número e tem mais de 8 caracteres (10 ms)
✓ Senha inválida: menos de 8 caracteres (3 ms)
✓ Senha inválida: sem letra maiúscula (2 ms)
✓ Senha inválida: sem número (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

---

## ✅ 5. Por que utilizar testes unitários?

- 🛡️ **Evita bugs** antes da integração
- 🧩 **Isola e valida** comportamentos
- 🔁 **Facilita refatorações**
- ⚙️ **Automatiza** a verificação da lógica

---

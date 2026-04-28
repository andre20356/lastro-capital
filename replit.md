# Lastro Capital

Plataforma web de investimentos com pagamento via PIX, construída com Node.js + Express.

## Arquitetura

- **Backend**: Node.js + Express (`server/index.js`)
- **Frontend**: HTML/CSS estático servido da pasta `public/`
- **Porta**: 3001 (padrão)

## Estrutura de Arquivos

```
lastro-capital/
├── server/
│   └── index.js        # Servidor Express principal
├── public/
│   └── index.html      # Frontend web (Entrar / Criar Conta)
├── .gitignore
└── replit.md
```

## Como rodar

```bash
npm start
# Servidor disponível em http://localhost:3001
```

## Rotas

- `GET /`      — Página inicial (Lastro Capital)
- `GET /api`   — Health check da API

## Notas

- Projeto migrado de Expo/React Native para Node.js + Express puro.
- Sem dependências do Expo, React Native, Metro ou QR Code.
- Arquivos estáticos servidos da pasta `public/`.

# Lastro Capital

Plataforma web de investimentos com pagamento via PIX.

## Stack

- **Frontend**: React 19 + TypeScript + Vite (CSS Modules)
- **Backend**: Node.js + Express
- **Build**: Vite compila `client/src/` → `public/`
- **Porta**: 3000

## Estrutura

```
lastro-capital/
├── client/                  # Frontend React
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css          # CSS variables globais
│       └── components/
│           ├── Navbar.tsx / .module.css
│           ├── Hero.tsx / .module.css
│           ├── Features.tsx / .module.css
│           ├── PixSection.tsx / .module.css
│           ├── CtaStrip.tsx / .module.css
│           └── Footer.tsx / .module.css
├── server/
│   └── index.js             # API Express
├── public/                  # Build output (gerado pelo Vite)
├── vite.config.ts           # Config Vite (root: ./client)
├── .gitignore
└── replit.md
```

## Como rodar

O workflow roda automaticamente:
```
npx vite build && node server/index.js
```

## Rotas

- `GET /`      — Frontend React (Lastro Capital landing page)
- `GET /api`   — Health check

## Design

- Fundo: `#050a18` (azul-marinho escuro)
- Accent: `#2563eb` → `#7c3aed` (gradiente azul-roxo)
- Verde PIX: `#10b981`
- Componentes com CSS Modules isolados

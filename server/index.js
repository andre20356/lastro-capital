const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// servir arquivos do frontend (build)
app.use(express.static(path.join(__dirname, "../public")));

// rota API
app.get("/api", (req, res) => {
  res.json({ status: "API rodando" });
});

// SPA (React) — pega TODAS rotas
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Lastro Capital rodando na porta ${PORT}`);
});
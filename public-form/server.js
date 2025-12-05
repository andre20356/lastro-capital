const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao carregar o formulario');
        return;
      }
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  } else {
    res.writeHead(404);
    res.end('Pagina nao encontrada');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Formulario de emprestimo disponivel em: http://0.0.0.0:${PORT}`);
});

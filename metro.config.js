const { getDefaultConfig } = require('expo/metro-config');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs'];
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

config.resolver.unstable_enablePackageExports = false;

const serverPath = path.join(__dirname, 'server', 'index.js');
const stripeServer = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env },
});

stripeServer.on('error', (err) => {
  console.error('Failed to start Stripe API server:', err.message);
});

process.on('exit', () => {
  stripeServer.kill();
});

config.server = config.server || {};
const originalEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalEnhanceMiddleware
    ? originalEnhanceMiddleware(middleware, server)
    : middleware;

  return (req, res, next) => {
    if (req.url && req.url.startsWith('/api/')) {
      const proxyReq = http.request(
        {
          hostname: '127.0.0.1',
          port: 3001,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: '127.0.0.1:3001' },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      );
      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'API server unavailable' }));
      });
      req.pipe(proxyReq, { end: true });
      return;
    }
    enhanced(req, res, next);
  };
};

module.exports = config;

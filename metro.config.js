const { getDefaultConfig } = require('expo/metro-config');
const { spawn } = require('child_process');
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

module.exports = config;

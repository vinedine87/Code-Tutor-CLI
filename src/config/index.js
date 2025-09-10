const fs = require('fs');
const path = require('path');
const os = require('os');

function readJsonSafe(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (_) {}
  return {};
}

function loadConfig() {
  const cwd = process.cwd();
  const userDir = path.join(os.homedir(), '.codetutor');
  const userCfg = path.join(userDir, 'config.json');
  const projCfg = path.join(cwd, 'codetutor.config.json');

  const def = {
    ollama: {
      host: process.env.CT_OLLAMA_HOST || '127.0.0.1',
      port: Number(process.env.CT_OLLAMA_PORT || 11434),
      timeoutMs: Number(process.env.CT_TIMEOUT_MS || 60000),
      modelPrimary: process.env.CT_MODEL_PRIMARY || 'qwen2:7b',
      modelCode: process.env.CT_MODEL_CODE || 'starcoder2:7b'
    },
    offline: process.env.CT_OFFLINE === '1' || process.env.CT_OFFLINE === 'true',
    outputDir: 'lessons'
  };

  const user = readJsonSafe(userCfg);
  const proj = readJsonSafe(projCfg);

  const cfg = { ...def, ...user, ...proj };
  return cfg;
}

module.exports = { loadConfig };


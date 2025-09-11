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

function getUserConfigDir() {
  return path.join(os.homedir(), '.codetutor');
}

function getUserConfigPath() {
  return path.join(getUserConfigDir(), 'config.json');
}

function hasUserConfig() {
  try { return fs.existsSync(getUserConfigPath()); } catch (_) { return false; }
}

function saveUserConfig(nextCfg) {
  try {
    const dir = getUserConfigDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getUserConfigPath(), JSON.stringify(nextCfg, null, 2), 'utf-8');
    return true;
  } catch (_) { return false; }
}

function loadConfig() {
  const cwd = process.cwd();
  const userCfg = getUserConfigPath();
  const projCfg = path.join(cwd, 'codetutor.config.json');

  const def = {
    provider: process.env.CT_PROVIDER || 'transformers',
    ollama: {
      host: process.env.CT_OLLAMA_HOST || '127.0.0.1',
      port: Number(process.env.CT_OLLAMA_PORT || 11434),
      timeoutMs: Number(process.env.CT_TIMEOUT_MS || 60000),
      modelPrimary: process.env.CT_MODEL_PRIMARY || 'qwen2:7b',
      modelCode: process.env.CT_MODEL_CODE || 'starcoder2:7b'
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      timeoutMs: Number(process.env.CT_TIMEOUT_MS || 60000),
      modelPrimary: process.env.CT_GEMINI_MODEL || 'gemini-1.5-flash'
    },
    local: {
      modelsDir: process.env.CT_LOCAL_MODELS || path.join(os.homedir(), '.codetutor', 'models'),
      modelName: process.env.CT_LOCAL_MODEL_NAME || 'TinyLlama-1.1B-Chat-v1.0.Q4_K_M.gguf',
      modelURL: process.env.CT_LOCAL_MODEL_URL || 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/TinyLlama-1.1B-Chat-v1.0.Q4_K_M.gguf',
      contextSize: Number(process.env.CT_LOCAL_CTX || 2048)
    },
    transformers: {
      modelPrimary: process.env.CT_TRANSFORMERS_MODEL || 'Xenova/Qwen2-0.5B-Instruct',
      maxNewTokens: Number(process.env.CT_TRANSFORMERS_MAX_TOKENS || 256),
      temperature: Number(process.env.CT_TRANSFORMERS_TEMPERATURE || 0.7)
    },
    offline: process.env.CT_OFFLINE === '1' || process.env.CT_OFFLINE === 'true',
    outputDir: 'lessons'
  };

  const user = readJsonSafe(userCfg);
  const proj = readJsonSafe(projCfg);

  const cfg = { ...def, ...user, ...proj };
  return cfg;
}

module.exports = { loadConfig, saveUserConfig, hasUserConfig, getUserConfigPath };

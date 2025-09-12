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
    provider: 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      modelPrimary: process.env.CT_OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: Number(process.env.CT_OPENAI_MAX_TOKENS || 256),
      temperature: Number(process.env.CT_OPENAI_TEMPERATURE || 0.7)
    },
    outputDir: 'lessons'
  };

  const user = readJsonSafe(userCfg);
  const proj = readJsonSafe(projCfg);

  const cfg = { ...def, ...user, ...proj };
  cfg.provider = 'openai';
  return cfg;
}

module.exports = { loadConfig, saveUserConfig, hasUserConfig, getUserConfigPath };

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
    provider: 'huggingface',
    huggingface: {
      apiToken: process.env.HF_API_TOKEN || '',
      modelPrimary: process.env.CT_HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta',
      maxNewTokens: Number(process.env.CT_HF_MAX_TOKENS || 256),
      temperature: Number(process.env.CT_HF_TEMPERATURE || 0.7)
    },
    outputDir: 'lessons'
  };

  const user = readJsonSafe(userCfg);
  const proj = readJsonSafe(projCfg);

  const cfg = { ...def, ...user, ...proj };
  cfg.provider = 'huggingface';
  return cfg;
}

module.exports = { loadConfig, saveUserConfig, hasUserConfig, getUserConfigPath };

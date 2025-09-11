const { createClient: createOllama } = require('./ollama');
const { createGeminiClient } = require('./gemini');
const { createLocalClient } = require('./local');
const { createTransformersClient } = require('./transformers');

function createAI(cfg) {
  const provider = (cfg.provider || 'ollama').toLowerCase();
  if (provider === 'gemini') return createGeminiClient(cfg);
  if (provider === 'transformers') return createTransformersClient(cfg);
  if (provider === 'local') return createLocalClient(cfg);
  return createOllama(cfg);
}

module.exports = { createAI };

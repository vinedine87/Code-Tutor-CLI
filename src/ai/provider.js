const { createGeminiClient } = require('./gemini');
const { createLocalClient } = require('./local');

function createAI(cfg) {
  const provider = (cfg.provider || 'transformers').toLowerCase();
  if (provider === 'gemini') return createGeminiClient(cfg);
  if (provider === 'transformers') {
    const { createTransformersClient } = require('./transformers');
    return createTransformersClient(cfg);
  }
  if (provider === 'local') return createLocalClient(cfg);
  // 기본은 transformers
  const { createTransformersClient } = require('./transformers');
  return createTransformersClient(cfg);
}

module.exports = { createAI };

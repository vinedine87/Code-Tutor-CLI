function createAI(cfg) {
  const provider = (cfg.provider || 'openai').toLowerCase();
  if (provider === 'openai') {
    const { createOpenAIClient } = require('./openai');
    return createOpenAIClient({ ...cfg, provider: 'openai' });
  }
  // fallback: default to OpenAI
  const { createOpenAIClient } = require('./openai');
  return createOpenAIClient({ ...cfg, provider: 'openai' });
}

module.exports = { createAI };

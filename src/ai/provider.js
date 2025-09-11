function createAI(cfg) {
  const provider = (cfg.provider || 'huggingface').toLowerCase();
  const { createHuggingFaceClient } = require('./huggingface');
  // 온라인 전용: 기본/유일 제공자는 huggingface
  return createHuggingFaceClient({ ...cfg, provider: 'huggingface' });
}

module.exports = { createAI };

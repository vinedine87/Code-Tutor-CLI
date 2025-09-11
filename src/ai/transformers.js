const { pipeline } = require('@xenova/transformers');

// Simple chat formatting for instruction-tuned models (multilingual)
function messagesToPrompt(messages = []) {
  const lines = [];
  for (const m of messages) {
    if (!m) continue;
    if (m.role === 'system') lines.push(`System: ${m.content}`);
    else if (m.role === 'user') lines.push(`User: ${m.content}`);
    else if (m.role === 'assistant') lines.push(`Assistant: ${m.content}`);
  }
  lines.push('Assistant:');
  return lines.join('\n');
}

function createTransformersClient(cfg) {
  const cache = new Map(); // model -> pipeline instance

  async function getGenerator(model) {
    const key = model || cfg.transformers.modelPrimary;
    if (cache.has(key)) return cache.get(key);
    const gen = await pipeline('text-generation', key);
    cache.set(key, gen);
    return gen;
  }

  async function chat({ model, messages, stream = false, options = {} }) {
    const gen = await getGenerator(model);
    const prompt = messagesToPrompt(messages);
    const max_new_tokens = options.max_new_tokens || cfg.transformers.maxNewTokens || 256;
    const temperature = options.temperature ?? cfg.transformers.temperature ?? 0.7;
    const res = await gen(prompt, {
      max_new_tokens,
      temperature,
      do_sample: temperature > 0,
      return_full_text: false,
    });
    const text = Array.isArray(res) ? (res[0]?.generated_text ?? '') : (res?.generated_text ?? '');
    return { message: { content: text } };
  }

  async function generate({ model, prompt, stream = false, options = {} }) {
    const gen = await getGenerator(model);
    const max_new_tokens = options.max_new_tokens || cfg.transformers.maxNewTokens || 256;
    const temperature = options.temperature ?? cfg.transformers.temperature ?? 0.7;
    const res = await gen(String(prompt || ''), {
      max_new_tokens,
      temperature,
      do_sample: temperature > 0,
      return_full_text: false,
    });
    const text = Array.isArray(res) ? (res[0]?.generated_text ?? '') : (res?.generated_text ?? '');
    return { message: { content: text } };
  }

  async function listModels() {
    // Transformers backend downloads on-demand; return the configured default as a hint.
    return [{ name: cfg.transformers.modelPrimary }];
  }

  return { chat, generate, listModels };
}

module.exports = { createTransformersClient };


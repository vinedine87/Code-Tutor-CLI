const OpenAI = require('openai');

function normalizeMessages(messages = []) {
  return (messages || []).map(m => ({
    role: m.role || 'user',
    content: String(m.content ?? '')
  }));
}

function createOpenAIClient(cfg) {
  const apiKey = process.env.OPENAI_API_KEY || cfg.openai?.apiKey || '';
  const client = new OpenAI({ apiKey });

  async function chat({ model, messages, stream = false, options = {} }) {
    const mdl = model || cfg.openai?.modelPrimary || 'gpt-4o-mini';
    const temperature = options.temperature ?? cfg.openai?.temperature ?? 0.7;
    const max_tokens = options.max_tokens || options.maxTokens || cfg.openai?.maxTokens || 256;
    const msgs = normalizeMessages(messages);
    const res = await client.chat.completions.create({
      model: mdl,
      messages: msgs,
      temperature,
      max_tokens
    });
    const text = res?.choices?.[0]?.message?.content || '';
    const usage = res?.usage || null;
    const modelUsed = res?.model || mdl;
    return { message: { content: text }, usage, model: modelUsed };
  }

  async function generate({ model, prompt, stream = false, options = {} }) {
    const mdl = model || cfg.openai?.modelPrimary || 'gpt-4o-mini';
    const temperature = options.temperature ?? cfg.openai?.temperature ?? 0.7;
    const max_tokens = options.max_tokens || options.maxTokens || cfg.openai?.maxTokens || 256;
    const res = await client.chat.completions.create({
      model: mdl,
      messages: [{ role: 'user', content: String(prompt || '') }],
      temperature,
      max_tokens
    });
    const text = res?.choices?.[0]?.message?.content || '';
    const usage = res?.usage || null;
    const modelUsed = res?.model || mdl;
    return { message: { content: text }, usage, model: modelUsed };
  }

  async function listModels() {
    return [{ name: cfg.openai?.modelPrimary || 'gpt-4o-mini' }];
  }

  return { chat, generate, listModels };
}

module.exports = { createOpenAIClient };

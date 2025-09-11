const axios = require('axios');

function createGeminiClient(cfg) {
  const apiKey = cfg.gemini.apiKey;
  if (!apiKey) {
    return {
      async chat() { throw new Error("Gemini API 키가 없습니다. 환경변수 GEMINI_API_KEY를 설정하거나 codetutor.config.json에 추가하세요."); },
      async generate() { throw new Error("Gemini API 키가 없습니다. 환경변수 GEMINI_API_KEY를 설정하거나 codetutor.config.json에 추가하세요."); },
      async listModels() { return []; }
    };
  }
  const base = 'https://generativelanguage.googleapis.com/v1beta';
  const http = axios.create({ baseURL: base, timeout: cfg.gemini.timeoutMs, params: { key: apiKey } });

  function toSystem(messages) {
    const idx = messages.findIndex(m => m.role === 'system');
    if (idx === -1) return undefined;
    const sys = messages[idx];
    return { role: 'system', parts: [{ text: String(sys.content || '') }] };
  }

  function toContents(messages) {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }]
      }));
  }

  async function chat({ model, messages, stream = false, options = {} }) {
    const mdl = model || cfg.gemini.modelPrimary;
    const body = {
      contents: toContents(messages || []),
      generationConfig: options,
    };
    const sys = toSystem(messages || []);
    if (sys) body.systemInstruction = sys;
    try {
      const res = await http.post(`/models/${encodeURIComponent(mdl)}:generateContent`, body);
      const cand = res.data?.candidates?.[0];
      const text = cand?.content?.parts?.map(p => p.text).join('\n') || '';
      return { message: { content: text } };
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || String(err);
      throw new Error(`Gemini 오류: ${msg}`);
    }
  }

  async function generate({ model, prompt, stream = false, options = {} }) {
    return chat({ model, messages: [{ role: 'user', content: String(prompt || '') }], stream, options });
  }

  async function listModels() {
    // Public list requires OAuth; keep simple empty list to avoid confusion
    return [];
  }

  return { chat, generate, listModels };
}

module.exports = { createGeminiClient };


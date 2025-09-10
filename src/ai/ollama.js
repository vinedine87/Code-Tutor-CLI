const axios = require('axios');

function createClient(cfg) {
  const baseURL = `http://${cfg.ollama.host}:${cfg.ollama.port}`;
  const http = axios.create({ baseURL, timeout: cfg.ollama.timeoutMs });

  async function chat({ model, messages, stream = false, options = {} }) {
    try {
      const res = await http.post('/api/chat', { model, messages, stream, options });
      return res.data;
    } catch (err) {
      throw mapError(err, cfg);
    }
  }

  async function generate({ model, prompt, stream = false, options = {} }) {
    try {
      const res = await http.post('/api/generate', { model, prompt, stream, options });
      return res.data;
    } catch (err) {
      throw mapError(err, cfg);
    }
  }

  async function listModels() {
    try {
      const res = await http.get('/api/tags');
      return res.data?.models || [];
    } catch (err) {
      throw mapError(err, cfg);
    }
  }

  return { chat, generate, listModels };
}

function mapError(err, cfg) {
  const base = `Ollama(${cfg.ollama.host}:${cfg.ollama.port})`;
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return new Error(`${base} 연결 실패. ollama 서버가 실행 중인지 확인하세요. 예: 'ollama serve'`);
  }
  const msg = err?.response?.data || err?.message || String(err);
  return new Error(`${base} 오류: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
}

module.exports = { createClient };


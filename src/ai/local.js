const fs = require('fs');
const path = require('path');
const https = require('https');

async function ensureModel(cfg) {
  const dir = cfg.local.modelsDir;
  const file = path.join(dir, cfg.local.modelName);
  if (fs.existsSync(file)) return file;
  await fs.promises.mkdir(dir, { recursive: true });
  const url = cfg.local.modelURL;
  console.log(`[local] 모델 다운로드 시작: ${url}`);
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // handle redirect once
        https.get(res.headers.location, (res2) => res2.pipe(out)).on('error', reject);
      } else if (res.statusCode === 200) {
        res.pipe(out);
      } else {
        reject(new Error(`다운로드 실패: HTTP ${res.statusCode}`));
      }
      out.on('finish', () => out.close(resolve));
    }).on('error', reject);
  });
  console.log(`[local] 모델 다운로드 완료: ${file}`);
  return file;
}

function createLocalClient(cfg) {
  let llama = null;
  try {
    llama = require('node-llama-cpp');
  } catch (e) {
    return {
      async chat() { throw new Error("로컬 LLM 라이브러리(node-llama-cpp)가 설치되어 있지 않습니다. 'npm i node-llama-cpp' 후 다시 시도하세요."); },
      async generate() { throw new Error("로컬 LLM 라이브러리(node-llama-cpp)가 설치되어 있지 않습니다. 'npm i node-llama-cpp' 후 다시 시도하세요."); },
      async listModels() { return []; }
    };
  }

  let modelInst = null;
  let ctx = null;
  let session = null;

  async function ensureSession() {
    if (session) return session;
    const modelPath = await ensureModel(cfg);
    const { LlamaModel, LlamaContext, LlamaChatSession } = llama;
    modelInst = new LlamaModel({ modelPath });
    ctx = new LlamaContext({ model: modelInst, contextSize: cfg.local.contextSize });
    session = new LlamaChatSession({ context: ctx });
    return session;
  }

  function toPrompt(messages) {
    const lines = [];
    for (const m of messages || []) {
      if (!m || !m.role) continue;
      if (m.role === 'system') {
        lines.push(`[시스템] ${m.content}`);
      } else if (m.role === 'user') {
        lines.push(`[사용자] ${m.content}`);
      } else if (m.role === 'assistant') {
        lines.push(`[도우미] ${m.content}`);
      }
    }
    lines.push('\n[도우미]');
    return lines.join('\n');
  }

  async function chat({ model, messages, stream = false, options = {} }) {
    const s = await ensureSession();
    const prompt = toPrompt(messages);
    const res = await s.prompt(prompt);
    return { message: { content: res } };
  }

  async function generate({ model, prompt, stream = false, options = {} }) {
    const s = await ensureSession();
    const res = await s.prompt(String(prompt || ''));
    return { message: { content: res } };
  }

  async function listModels() { return [{ name: cfg.local.modelName }]; }

  return { chat, generate, listModels };
}

module.exports = { createLocalClient };


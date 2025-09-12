const { HfInference } = require('@huggingface/inference');

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

function createHuggingFaceClient(cfg) {
  // 환경변수 우선, 그다음 사용자 설정(기존 파일에 남아있을 수 있음)
  const token = process.env.HF_API_TOKEN || cfg.huggingface?.apiToken || '';
  const hf = new HfInference(token || undefined);

  async function chat({ model, messages, stream = false, options = {} }) {
    const mdl = model || cfg.huggingface?.modelPrimary || 'Qwen/Qwen2.5-7B-Instruct';
    const prompt = messagesToPrompt(messages);
    const max_new_tokens = options.max_new_tokens || cfg.huggingface?.maxNewTokens || 256;
    const temperature = options.temperature ?? cfg.huggingface?.temperature ?? 0.7;
    const res = await hf.textGeneration({
      model: mdl,
      inputs: prompt,
      parameters: { max_new_tokens, temperature, return_full_text: false },
      options: { wait_for_model: true }
    });
    const text = res?.generated_text || '';
    return { message: { content: text } };
  }

  async function generate({ model, prompt, stream = false, options = {} }) {
    const mdl = model || cfg.huggingface?.modelPrimary || 'Qwen/Qwen2.5-7B-Instruct';
    const max_new_tokens = options.max_new_tokens || cfg.huggingface?.maxNewTokens || 256;
    const temperature = options.temperature ?? cfg.huggingface?.temperature ?? 0.7;
    const res = await hf.textGeneration({
      model: mdl,
      inputs: String(prompt || ''),
      parameters: { max_new_tokens, temperature, return_full_text: false },
      options: { wait_for_model: true }
    });
    const text = res?.generated_text || '';
    return { message: { content: text } };
  }

  async function listModels() {
    // 간단히 기본 모델 힌트만 반환
    return [{ name: cfg.huggingface?.modelPrimary || 'TinyLlama/TinyLlama-1.1B-Chat-v1.0' }];
  }

  return { chat, generate, listModels };
}

module.exports = { createHuggingFaceClient };

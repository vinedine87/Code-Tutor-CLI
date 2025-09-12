#!/usr/bin/env node
const { HfInference } = require('@huggingface/inference');
const { loadConfig } = require('../src/config');

async function main() {
  const token = process.env.HF_API_TOKEN || '';
  if (!token) {
    console.log('[smoke:api] HF_API_TOKEN not set. Skipping API test (OK).');
    return;
  }
  // Align model selection with CLI config resolution
  const cfg = loadConfig();
  const model = process.env.CT_HF_MODEL || (cfg.huggingface && cfg.huggingface.modelPrimary) || 'Qwen/Qwen2.5-7B-Instruct';
  const hf = new HfInference(token);
  console.log(`[smoke:api] calling Inference API: ${model}`);
  try {
    const res = await hf.textGeneration({
      model,
      inputs: '테스트: 1+1은?',
      parameters: { max_new_tokens: 16, return_full_text: false },
      options: { wait_for_model: true }
    });
    const out = res?.generated_text || '';
    console.log('[smoke:api] OK:', out.slice(0, 80).replace(/\n/g, ' '));
  } catch (e) {
    console.error('[smoke:api] FAIL:', e.message);
    process.exit(1);
  }
}

main();

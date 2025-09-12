#!/usr/bin/env node
const OpenAI = require('openai');
const { loadConfig } = require('../src/config');

async function main() {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    console.log('[smoke:api] OPENAI_API_KEY not set. Skipping API test (OK).');
    return;
  }
  const cfg = loadConfig();
  const model = process.env.CT_OPENAI_MODEL || (cfg.openai && cfg.openai.modelPrimary) || 'gpt-4o-mini';
  const client = new OpenAI({ apiKey });
  console.log(`[smoke:api] calling OpenAI: ${model}`);
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: '테스트: 1+1은?' }],
      max_tokens: 16,
      temperature: 0.7
    });
    const out = res?.choices?.[0]?.message?.content || '';
    console.log('[smoke:api] OK:', String(out).slice(0, 80).replace(/\n/g, ' '));
  } catch (e) {
    console.error('[smoke:api] FAIL:', e.message);
    process.exit(1);
  }
}

main();

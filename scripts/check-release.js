#!/usr/bin/env node
const fs = require('fs');

function fail(msg) {
  console.error('[check-release] FAIL:', msg);
  process.exit(1);
}

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.version) fail('package.json version missing');
  if (!pkg.bin || !pkg.bin.ct || !fs.existsSync(pkg.bin.ct)) fail('bin/ct.js not wired');
  const badDeps = ['@xenova/transformers', 'node-llama-cpp', 'axios'];
  for (const d of badDeps) {
    if ((pkg.dependencies && pkg.dependencies[d]) || (pkg.optionalDependencies && pkg.optionalDependencies[d])) {
      fail(`unexpected dependency present: ${d}`);
    }
  }
  const src = fs.readFileSync('src/ai/provider.js', 'utf-8');
  if (!/openai/i.test(src)) fail('provider does not return openai client');
  if (/transformers|ollama|gemini|huggingface/i.test(src)) fail('provider contains offline/other providers');

  console.log('[check-release] OK');
} catch (e) {
  fail(e.message);
}


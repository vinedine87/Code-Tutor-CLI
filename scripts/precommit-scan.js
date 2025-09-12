#!/usr/bin/env node
/**
 * Simple pre-commit scanner to prevent committing secrets, logs, or prompt transcripts.
 * Scans staged files (added/modified) and blocks on suspicious content.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function sh(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf-8' });
  if (res.status !== 0) return { ok: false, out: '', err: res.stderr || '' };
  return { ok: true, out: res.stdout || '' };
}

function listStaged() {
  const r = sh('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM']);
  if (!r.ok) return [];
  return r.out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function isTextFile(file) {
  const exts = ['.js', '.ts', '.json', '.md', '.txt', '.mjs', '.c', '.cpp', '.h', '.java', '.kt', '.py', '.yml', '.yaml', '.gitignore', '.gitattributes'];
  const ext = path.extname(file).toLowerCase();
  return exts.includes(ext);
}

function scanContent(txt) {
  const rules = [
    { re: /sk-[A-Za-z0-9]{20,}/, msg: 'OpenAI API key-like token detected (sk-...)' },
    { re: /hf_[A-Za-z0-9]{20,}/, msg: 'Hugging Face token-like string detected (hf_...)' },
    { re: /AKIA[0-9A-Z]{16}/, msg: 'AWS Access Key ID detected (AKIA...)' },
    { re: /AWS_SECRET_ACCESS_KEY|aws_secret_access_key/i, msg: 'AWS secret key marker' },
    { re: /OPENAI_API_KEY|HF_API_TOKEN|API_KEY|API-TOKEN|AUTH_TOKEN/i, msg: 'API key environment marker' },
    { re: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i, msg: 'Authorization Bearer token' },
    // Prompt/chat transcript heuristics
    { re: /^ct\s*[>\]]/m, msg: 'CLI prompt transcript (ct > ...) detected' },
    { re: /^(User|Assistant)\s*:/m, msg: 'Chat transcript-like content detected' },
  ];
  const hits = [];
  for (const r of rules) {
    if (r.re.test(txt)) hits.push(r.msg);
  }
  return hits;
}

function main() {
  const files = listStaged();
  if (files.length === 0) process.exit(0);
  const problems = [];
  for (const f of files) {
    if (f === 'scripts/precommit-scan.js') continue; // 스캐너 자체는 스캔하지 않음
    // skip binaries/large
    if (!isTextFile(f)) continue;
    try {
      const stat = fs.statSync(f);
      if (stat.size > 2 * 1024 * 1024) continue; // skip >2MB
      const txt = fs.readFileSync(f, 'utf-8');
      const hits = scanContent(txt);
      if (hits.length) problems.push({ file: f, hits });
    } catch (_) {}
  }
  if (problems.length) {
    console.error('\n[precommit] 위험한 콘텐츠 감지됨. 커밋이 차단됩니다.');
    for (const p of problems) {
      console.error(`- ${p.file}`);
      for (const h of p.hits) console.error(`  • ${h}`);
    }
    console.error('\n해결 방법: 민감정보 제거 또는 .env/환경변수 사용. 필요 시 .gitignore에 추가.');
    process.exit(1);
  }
}

main();


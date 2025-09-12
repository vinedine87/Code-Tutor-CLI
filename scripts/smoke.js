#!/usr/bin/env node
const { spawnSync } = require('child_process');

function sh(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
}

try {
  console.log('[smoke] checking CLI help...');
  sh('node', ['bin/ct.js', '--help']);

  console.log('[smoke] checking CLI version...');
  sh('node', ['bin/ct.js', '--version']);

  console.log('[smoke] checking dependency openai...');
  require('openai');
  console.log('[smoke] OK');
} catch (e) {
  console.error('[smoke] FAIL:', e.message);
  process.exit(1);
}

#!/usr/bin/env node
const { program } = require('commander');

program
  .name('ct')
  .description('Code Tutor CLI: 자연어 기반 학습/실습/디버깅 도우미 (Ollama 연동)')
  .version('0.1.0');

program.parse(process.argv);


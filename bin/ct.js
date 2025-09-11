#!/usr/bin/env node
const { program } = require('commander');
const startInteractiveMode = require('../src/cli/interactive');

program
  .name('ct')
  .description('Code Tutor CLI: 학습/연습/도우미 도구 (Ollama 연동)')
  .version('0.1.0');

// 서브커맨드 등록
require('../src/cli/tutor')(program);
require('../src/cli/quest')(program);
require('../src/cli/doctor')(program);
require('../src/cli/models')(program);

// 'chat' 명령만 별도 처리
program
  .command('chat')
  .description('대화형 모드로 Code Tutor CLI를 사용합니다')
  .action(() => {
    startInteractiveMode();
  });

program.parse(process.argv);

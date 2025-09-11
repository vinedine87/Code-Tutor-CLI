#!/usr/bin/env node
const { program } = require('commander');

program
  .name('ct')
  .description('Code Tutor CLI')
  .version('0.1.0');

// Subcommands
require('../src/cli/tutor')(program);
require('../src/cli/quest')(program);
require('../src/cli/doctor')(program);
// Ollama 모델 관리는 제거되었습니다.

// Chat command only (gemini/codex removed)
program
  .command('chat')
  .description('대화형 모드로 Code Tutor CLI를 사용합니다')
  .action(async () => {
    const startInteractiveMode = require('../src/cli/interactive');
    return startInteractiveMode();
  });

program.parse(process.argv);

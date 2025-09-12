#!/usr/bin/env node
const pkg = require('../package.json');
const { program } = require('commander');

program
  .name('ct')
  .description('대화형 모드로 Code Tutor CLI를 사용합니다')
  .version(pkg.version || '0.0.0');

// Subcommands
require('../src/cli/quest')(program);
require('../src/cli/doctor')(program);

// Chat command
program
  .command('chat')
  .description('대화형 모드로 Code Tutor CLI를 사용합니다 (온라인 전용: OpenAI)')
  .option('--show-usage', '응답 후 토큰 사용량/비용 추정 표시', false)
  .action(async () => {
    const startInteractiveMode = require('../src/cli/interactive');
    // 플래그는 환경변수로도 제어 가능(CT_SHOW_USAGE=1)
    if (process.argv.includes('--show-usage')) process.env.CT_SHOW_USAGE = '1';
    return startInteractiveMode('openai');
  });

program.parse(process.argv);

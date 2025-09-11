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
  .description('대화형 모드로 Code Tutor CLI를 사용합니다')
  .action(async () => {
    const startInteractiveMode = require('../src/cli/interactive');
    return startInteractiveMode();
  });

program.parse(process.argv);


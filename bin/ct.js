#!/usr/bin/env node
const { Command } = require('commander');
const pkg = require('../package.json');

const program = new Command();
program
  .name('ct')
  .description('Code Tutor CLI — 자연어 기반 학습/실습/디버깅 도우미')
  .version(pkg.version);

// Register subcommands
require('../src/cli/tutor')(program);
require('../src/cli/quest')(program);
require('../src/cli/doctor')(program);
require('../src/cli/models')(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});


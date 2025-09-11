const pkg = require('../package.json');
#!/usr/bin/env node
const { program } = require('commander');

program
  .name('ct')
  .description('\uB300\uD654\uD615 \uBAA8\uB4DC\uB85C Code Tutor CLI\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4')
  .version(pkg.version || '0.0.0');

// Subcommands
// tutor command removed
require('../src/cli/quest')(program);
require('../src/cli/doctor')(program);
// Ollama 모델 관리는 ?�거?�었?�니??

// Chat command only (gemini/codex removed)
program
  .command('chat')
  .description('\uB300\uD654\uD615 \uBAA8\uB4DC\uB85C Code Tutor CLI\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4')
  .action(async () => {
    const startInteractiveMode = require('../src/cli/interactive');
    return startInteractiveMode();
  });

program.parse(process.argv);
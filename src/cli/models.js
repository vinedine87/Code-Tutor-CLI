const chalk = require('chalk');
const { loadConfig } = require('../config');
const { createClient } = require('../ai/ollama');

module.exports = (program) => {
  program
    .command('models')
    .description('로컬 Ollama 모델 관리')
    .option('--list', '모델 목록 표시')
    .option('--pull <name>', '모델 다운로드(ollama CLI 사용 권장)')
    .action(async (opts) => {
      const cfg = loadConfig();
      const client = createClient(cfg);
      try {
        if (opts.list) {
          const models = await client.listModels();
          if (!models.length) {
            console.log('모델이 없습니다. 예: ollama pull qwen2:7b');
          } else {
            models.forEach((m) => console.log(`- ${m.name} (${m.size || ''})`));
          }
          return;
        }
        if (opts.pull) {
          console.log('다운로드는 터미널에서 실행하세요:');
          console.log(chalk.cyan(`ollama pull ${opts.pull}`));
          return;
        }
        console.log('예: ct models --list | ct models --pull qwen2:7b');
      } catch (err) {
        console.error(chalk.red(String(err?.message || err)));
        process.exitCode = 1;
      }
    });
};


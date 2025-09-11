const { loadConfig } = require('../config');
const { createClient } = require('../ai/ollama');
const { spawn } = require('child_process');

module.exports = (program) => {
  program
    .command('models')
    .description('Ollama 모델을 조회/다운로드합니다')
    .option('--list', '로컬에 설치된 Ollama 모델 목록을 표시')
    .option('--pull <modelName>', 'Ollama 모델을 다운로드(ollama pull 호출)')
    .action(async (options) => {
      const cfg = loadConfig();
      const client = createClient(cfg);
      if (options.list) {
        try {
          const models = await client.listModels();
          if (!models || models.length === 0) {
            console.log('설치된 모델이 없습니다. 예) ollama pull qwen2:7b');
            return;
          }
          for (const m of models) {
            console.log(`- ${m.name} (${m.size || m.digest || ''})`);
          }
        } catch (e) {
          console.log(`모델 목록 조회 실패: ${e.message}`);
        }
        return;
      }
      if (options.pull) {
        const model = options.pull;
        try {
          const proc = spawn('ollama', ['pull', model], { stdio: 'inherit' });
          proc.on('exit', (code) => {
            if (code === 0) console.log(`모델 다운로드 완료: ${model}`);
            else console.log(`모델 다운로드 실패(code=${code}). 수동 실행: ollama pull ${model}`);
          });
        } catch (e) {
          console.log(`ollama 실행 실패. 수동으로 실행하세요: ollama pull ${model}`);
        }
        return;
      }
      console.log('사용법: ct models --list | --pull <model>');
    });
};


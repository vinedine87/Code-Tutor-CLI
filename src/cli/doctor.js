const fs = require('fs');
const { spawnSync } = require('child_process');
const { loadConfig } = require('../config');
const { createAI } = require('../ai/provider');

module.exports = (program) => {
  program
    .command('doctor <filepath>')
    .description('코드를 실행해 오류를 수집하고, 선택 시 AI로 수정 가이드를 제공합니다')
    .option('--lang <language>', '코드 언어 지정(기본 python)', 'python')
    .option('--explain', 'AI로 오류 설명과 수정 제안 제공')
    .action(async (filepath, options) => {
      if (!fs.existsSync(filepath)) {
        console.log(`파일이 없습니다: ${filepath}`);
        return;
      }
      let runOut = '';
      let runErr = '';
      if (options.lang === 'python' || filepath.endsWith('.py')) {
        const res = spawnSync('python', [filepath], { encoding: 'utf-8' });
        runOut = res.stdout || '';
        runErr = res.stderr || (res.error ? String(res.error.message) : '');
      } else if (filepath.endsWith('.mjs')) {
        const res = spawnSync('node', [filepath], { encoding: 'utf-8' });
        runOut = res.stdout || '';
        runErr = res.stderr || (res.error ? String(res.error.message) : '');
      } else {
        console.log('지원되지 않는 파일 타입입니다. python 또는 node(.mjs)만 지원.');
        return;
      }
      console.log('--- 실행 결과(stdout) ---');
      console.log(runOut.trim());
      console.log('--- 실행 오류(stderr) ---');
      console.log(runErr.trim());

      if (options.explain) {
        const cfg = loadConfig();
        const ai = createAI(cfg);
        const messages = [
          { role: 'system', content: '당신은 친절한 시니어 코드 리뷰어입니다. 오류를 찾아 설명하고 수정안을 제시하세요.' },
          { role: 'user', content: `파일 경로: ${filepath}\n언어: ${options.lang}\n오류(stderr):\n${runErr || '(없음)'}\n실행결과(stdout):\n${runOut || '(없음)'}\n요청: 원인 분석과 수정 가이드를 단계적으로 제공` }
        ];
        try {
          const res = await ai.chat({ model: cfg.provider === 'gemini' ? cfg.gemini.modelPrimary : cfg.ollama.modelPrimary, messages, stream: false });
          const txt = res?.message?.content || res?.content || '';
          console.log('\n--- AI 분석 ---');
          console.log(txt);
        } catch (e) {
          console.log(`AI 분석 실패: ${e.message}`);
        }
      }
    });
};


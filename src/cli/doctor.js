const chalk = require('chalk');
const { runHint } = require('../generate/codegen');
const { loadConfig } = require('../config');
const { createClient } = require('../ai/ollama');
const cp = require('child_process');

module.exports = (program) => {
  program
    .command('doctor')
    .description('Bug Doctor — 실행 에러 분석 및 수정 가이드')
    .argument('<file>', '대상 코드 파일')
    .option('--lang <lang>', '언어', 'python')
    .option('--run <args>', '실행 인자 문자열', '')
    .option('--timeout <s>', '타임아웃(초)', '5')
    .option('--explain', 'AI 해설 포함', false)
    .action(async (file, opts) => {
      try {
        const { stdout, stderr } = await runFile(file, opts.lang, opts.run, Number(opts.timeout));
        if (stderr) {
          console.log(chalk.yellow('에러 로그:'));
          console.log(stderr.trim());
        } else {
          console.log(chalk.green('에러 없이 실행 완료'));
        }

        if (opts.explain && stderr) {
          const cfg = loadConfig();
          const client = createClient(cfg);
          const prompt = [
            { role: 'system', content: '당신은 디버깅 도우미입니다. 로그를 분석하고 수정 가이드를 제시합니다.' },
            { role: 'user', content: `언어: ${opts.lang}\n파일: ${file}\n에러 로그:\n${stderr}\n수정 방향: 원인 → 패치 요약 → 주의점` }
          ];
          try {
            const data = await client.chat({ model: cfg.ollama.modelCode, messages: prompt, stream: false, options: { temperature: 0.2 } });
            const content = data?.message?.content || data?.response || '';
            console.log('\n' + chalk.cyan('수정 가이드:') + '\n');
            console.log(content.trim());
          } catch (aiErr) {
            console.error(chalk.red(String(aiErr?.message || aiErr)));
          }
        }
      } catch (err) {
        console.error(chalk.red(String(err?.message || err)));
        process.exitCode = 1;
      }
    });
};

function runFile(file, lang, runArgs, timeoutSec) {
  const cmd = runCmdFor(lang, file, runArgs);
  return new Promise((resolve) => {
    const child = cp.spawn(cmd.command, cmd.args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', () => resolve({ stdout, stderr }));
    setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (_) {}
      resolve({ stdout, stderr: stderr + '\nTIMEOUT' });
    }, Math.max(1000, timeoutSec * 1000));
  });
}

function runCmdFor(lang, file, runArgs) {
  const extra = (runArgs || '').trim() ? (runArgs || '').trim().split(/\s+/) : [];
  if (lang === 'python') return { command: 'python', args: ['-I', file, ...extra] };
  if (lang === 'javascript' || lang === 'js') return { command: 'node', args: ['--no-warnings', file, ...extra] };
  return { command: 'node', args: [file, ...extra] };
}


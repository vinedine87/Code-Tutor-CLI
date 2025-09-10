const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const { loadConfig } = require('../config');
const { createClient } = require('../ai/ollama');
const { buildTutorMessages } = require('../tutor/prompt');
const { slugify, timestamp } = require('../utils/fs');
const { createRunnableLesson, createRunnableBundle } = require('../generate/codegen');

module.exports = (program) => {
  program
    .command('tutor')
    .description('자연어 질문에 대한 난이도별 코드 예시/해설 제공')
    .argument('<question...>', '질문(자연어)')
    .option('--level <level>', 'elem|middle|high|college|basic', 'elem')
    .option('--lang <lang>', 'python|javascript|java|cpp|c', 'python')
    .option('--langs <list>', '여러 언어를 콤마로 지정: py,c,java', '')
    .option('--runnable', '실행 가능한 코드 파일 생성', false)
    .option('--basename <name>', '생성 파일 기본 이름(예: gugudan)', 'main')
    .option('--no-ai', 'AI 호출 없이 파일만 생성')
    .option('--outdir <dir>', '출력 기본 디렉터리', '')
    .option('--model <name>', '모델 이름(ollama 태그)', '')
    .action(async (questionParts, opts) => {
      const question = questionParts.join(' ');
      const cfg = loadConfig();
      const client = createClient(cfg);
      const model = opts.model || cfg.ollama.modelPrimary;

      const langs = resolveLangs(opts.langs, opts.lang);

      const spinner = ora(`모델(${model})로 응답 생성 중...`).start();
      try {
        let content = '';
        if (opts.ai === false) {
          spinner.stop();
          content = [
            `요약: "${question}" 주제에 대한 기본 예시입니다.`,
            `레벨: ${opts.level}, 언어: ${opts.lang}`
          ].join('\n');
        } else {
          const messages = buildTutorMessages({ question, level: opts.level, lang: opts.lang });
          const data = await client.chat({ model, messages, stream: false, options: { temperature: 0.3 } });
          spinner.stop();
          content = data?.message?.content || data?.response || '';
        }
        console.log('\n' + chalk.cyan('해설:') + '\n');
        console.log(content.trim());

        if (opts.runnable) {
          const slug = slugify(question).slice(0, 40) || 'lesson';
          const base = opts.outdir || cfg.outputDir;
          const outDir = path.join(base, `${timestamp()}-${slug}`);
          if (langs.length > 1) {
            const res = await createRunnableBundle({ outDir, title: question, langs, explanation: content, baseName: opts.basename });
            console.log('\n' + chalk.green(`파일 생성: ${outDir}`));
            res.files.forEach((f) => console.log(` - ${f.lang}: ${f.file}`));
          } else {
            await createRunnableLesson({ outDir, title: question, lang: langs[0], explanation: content, baseName: opts.basename });
            console.log('\n' + chalk.green(`파일 생성: ${outDir}`));
          }
        }
      } catch (err) {
        spinner.stop();
        console.error(chalk.red(String(err?.message || err)));
        process.exitCode = 1;
      }
    });
};

function resolveLangs(list, single) {
  const map = (s) => {
    const v = s.trim().toLowerCase();
    if (v === 'py' || v === 'python') return 'python';
    if (v === 'js' || v === 'javascript') return 'javascript';
    if (v === 'c') return 'c';
    if (v === 'cpp' || v === 'c++') return 'cpp';
    if (v === 'java') return 'java';
    return v;
  };
  if (list && list.trim()) {
    const arr = list.split(',').map(map).filter(Boolean);
    return Array.from(new Set(arr));
  }
  return [map(single || 'python')];
}

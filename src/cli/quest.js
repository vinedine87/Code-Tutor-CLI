const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const chalk = require('chalk');
const { slugify, timestamp, ensureDirSafe, writeFileSafe } = require('../utils/fs');

module.exports = (program) => {
  const quest = new Command('quest');
  quest.description('Coding Quest — 문제 출제/실행/피드백');

  quest
    .command('new')
    .description('문제 생성')
    .argument('<topic...>', '주제/문제 제목')
    .option('--level <level>', 'elem|middle|high|college|basic', 'elem')
    .option('--lang <lang>', 'python|javascript|java|cpp|c', 'python')
    .option('--difficulty <d>', 'easy|medium|hard', 'easy')
    .action(async (topicParts, opts) => {
      const title = topicParts.join(' ');
      const slug = `${timestamp()}-${slugify(title).slice(0, 40)}`;
      const dir = path.join('quests', slug);
      try {
        await ensureDirSafe(dir);
        const problem = {
          meta: { id: slug, title, level: opts.level, lang: opts.lang, difficulty: opts.difficulty },
          statement: '여기에 문제 설명을 작성하세요.',
          tests: [
            { input: '3 8 2', output: '8\n', hidden: false },
            { input: '1 2 3', output: '3\n', hidden: true }
          ],
          checker: 'trim'
        };
        await writeFileSafe(path.join(dir, 'problem.json'), JSON.stringify(problem, null, 2));
        await writeFileSafe(path.join(dir, `starter.${extFor(opts.lang)}`), starterFor(opts.lang));
        await writeFileSafe(path.join(dir, 'README.md'), `# ${title}\n\n레벨: ${opts.level}, 난이도: ${opts.difficulty}`);
        console.log(chalk.green(`문제 생성: ${dir}`));
      } catch (err) {
        console.error(chalk.red(String(err?.message || err)));
        process.exitCode = 1;
      }
    });

  quest
    .command('run')
    .description('학생 코드 실행 및 간단 채점')
    .argument('<questPath>', '문제 폴더 경로')
    .requiredOption('--file <path>', '학생 코드 파일 경로')
    .option('--timeout <s>', '타임아웃(초)', '5')
    .action(async (questPath, opts) => {
      try {
        const problem = JSON.parse(fs.readFileSync(path.join(questPath, 'problem.json'), 'utf-8'));
        const res = await runAndJudge(problem, opts.file, Number(opts.timeout));
        printJudge(res);
        if (!res.allPassed) process.exitCode = 1;
      } catch (err) {
        console.error(chalk.red(String(err?.message || err)));
        process.exitCode = 1;
      }
    });

  program.addCommand(quest);
};

function extFor(lang) {
  return lang === 'python' ? 'py' : lang === 'javascript' || lang === 'js' ? 'mjs' : 'txt';
}

function starterFor(lang) {
  if (lang === 'python') return 'nums = list(map(int, input().split()))\nprint(max(nums))\n';
  if (lang === 'javascript' || lang === 'js') return 'import fs from "node:fs";\nconst s=fs.readFileSync(0,"utf8").trim().split(/\s+/).map(Number);\nconsole.log(Math.max(...s));\n';
  return '';
}

async function runAndJudge(problem, file, timeoutSec) {
  const tests = problem.tests || [];
  const results = [];
  for (const t of tests) {
    const r = await runCase(file, problem.meta.lang, t.input, timeoutSec);
    const ok = compare(r.stdout, t.output, problem.checker);
    results.push({ ...t, stdout: r.stdout, stderr: r.stderr, ok });
  }
  return { results, allPassed: results.every((r) => r.ok) };
}

function compare(actual, expected, rule = 'trim') {
  if (rule === 'trim') return (actual || '').trim() + '\n' === (expected || '').trim() + '\n';
  return actual === expected;
}

function printJudge(res) {
  const passCount = res.results.filter((r) => r.ok).length;
  console.log(`통과: ${passCount}/${res.results.length}`);
  res.results.forEach((r, i) => {
    console.log(`\n[케이스 ${i + 1}] 공개:${!r.hidden}`);
    console.log(`입력> ${r.input}`);
    console.log(`기대> ${(r.output || '').trim()}`);
    console.log(`실제> ${(r.stdout || '').trim()}`);
    console.log(`결과> ${r.ok ? 'PASS' : 'FAIL'}`);
    if (!r.ok && r.stderr) console.log(`stderr> ${r.stderr}`);
  });
}

function runCase(file, lang, input, timeoutSec) {
  const cp = require('child_process');
  const cmd = runCmdFor(lang, file);
  return new Promise((resolve) => {
    const child = cp.spawn(cmd.command, cmd.args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', () => resolve({ stdout, stderr }));
    child.stdin.write(input == null ? '' : String(input));
    child.stdin.end();
    setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (_) {}
      resolve({ stdout, stderr: stderr + '\nTIMEOUT' });
    }, Math.max(1000, timeoutSec * 1000));
  });
}

function runCmdFor(lang, file) {
  if (lang === 'python') return { command: 'python', args: ['-I', file] };
  if (lang === 'javascript' || lang === 'js') return { command: 'node', args: ['--no-warnings', file] };
  return { command: 'node', args: [file] };
}


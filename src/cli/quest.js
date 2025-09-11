const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { slugify, timestamp, ensureDirSafe, writeFileSafe } = require('../utils/fs');

module.exports = (program) => {
  const quest = program.command('quest')
    .description('문제 생성 및 학생 코드 실행/간단 채점');

  quest.command('new <title>')
    .description('새 학습 문제 생성')
    .option('--level <level>', '레벨(elem|middle|high|college|basic)', 'elem')
    .option('--lang <language>', '문제 언어 지정(기본 python)', 'python')
    .action(async (title, options) => {
      const id = `${timestamp()}-${slugify(title)}`;
      const outDir = path.join('quests', id);
      await ensureDirSafe(outDir);
      const problem = {
        id,
        title,
        level: options.level,
        lang: options.lang,
        tests: [
          { input: '3\n1 2 3\n', output: '3' }
        ]
      };
      await writeFileSafe(path.join(outDir, 'problem.json'), JSON.stringify(problem, null, 2));
      if (options.lang === 'python') {
        const starter = `# 입력: 첫 줄에 N, 둘째 줄에 N개 정수\n# 최대값 출력\nimport sys\n\n_ = sys.stdin.readline()\nnums = list(map(int, sys.stdin.readline().split()))\nprint(max(nums))\n`;
        await writeFileSafe(path.join(outDir, 'starter.py'), starter);
      }
      const readme = `# ${title}\n\n- 언어: ${options.lang}\n- 레벨: ${options.level}\n- 채점: ct quest run ${id} --file <solution>\n`;
      await writeFileSafe(path.join(outDir, 'README.md'), readme);
      console.log(`문제 생성 완료: ${outDir}`);
    });

  quest.command('run <questId>')
    .description('학생 코드 채점 실행')
    .requiredOption('--file <filepath>', '채점할 학생 코드 파일 경로')
    .option('--timeout <seconds>', '실행 제한시간(초)', (v) => parseInt(v, 10), 3)
    .action((questId, options) => {
      const dir = path.join('quests', questId);
      const probPath = path.join(dir, 'problem.json');
      if (!fs.existsSync(probPath)) {
        console.log(`문제 정의가 없습니다: ${probPath}`);
        return;
      }
      const prob = JSON.parse(fs.readFileSync(probPath, 'utf-8'));
      const file = options.file;
      if (!fs.existsSync(file)) {
        console.log(`파일을 찾을 수 없습니다: ${file}`);
        return;
      }
      if (!Array.isArray(prob.tests) || prob.tests.length === 0) {
        console.log('테스트 케이스가 없습니다. problem.json의 tests를 확인하세요.');
        return;
      }
      let passed = 0;
      for (const [i, t] of prob.tests.entries()) {
        let cmd = null;
        let args = [];
        if (file.endsWith('.py')) { cmd = 'python'; args = [file]; }
        else if (file.endsWith('.mjs')) { cmd = 'node'; args = [file]; }
        else { console.log(`알 수 없는 파일 타입: ${file}`); return; }
        const res = spawnSync(cmd, args, { input: t.input, timeout: options.timeout * 1000, encoding: 'utf-8' });
        if (res.error) { console.log(`케이스 ${i + 1} 실행 오류: ${res.error.message}`); continue; }
        const out = String(res.stdout || '').trim();
        const exp = String(t.output || '').trim();
        const ok = out === exp;
        console.log(`케이스 ${i + 1}: ${ok ? 'PASS' : 'FAIL'} (예상='${exp}', 출력='${out}')`);
        if (ok) passed++;
      }
      console.log(`결과: ${passed}/${prob.tests.length} 통과`);
    });
};


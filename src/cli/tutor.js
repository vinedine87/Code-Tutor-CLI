const path = require('path');
const { loadConfig } = require('../config');
const { createAI } = require('../ai/provider');
const { buildTutorMessages } = require('../tutor/prompt');
const { slugify, timestamp, writeFileSafe, ensureDirSafe } = require('../utils/fs');
const { createRunnableLesson, createRunnableBundle } = require('../generate/codegen');

module.exports = (program) => {
  program
    .command('tutor <question>')
    .description('질문을 설명하고 실행 가능한 코드 파일을 생성합니다')
    .option('--level <level>', '레벨(elem|middle|high|college|basic)', 'elem')
    .option('--lang <language>', '주요 언어 지정(python|javascript 등)', 'python')
    .option('--langs <languages>', '여러 언어 동시 지정(콤마 구분, 예: py,c,java)')
    .option('--basename <name>', '생성 파일의 기본 이름', 'main')
    .option('--runnable', '생성 코드가 바로 실행 가능하도록 템플릿 사용', false)
    .option('--no-ai', 'AI 호출 없이 파일만 생성')
    .action(async (question, options) => {
      const cfg = loadConfig();
      const ai = createAI(cfg);
      const baseDir = path.join('lessons', `${timestamp()}-${slugify(question)}`);
      const outDir = await ensureUniqueDir(baseDir);
      const langs = resolveLangs(options.langs, options.lang);
      let aiText = '';
      if (!options.noAi) {
        try {
          const messages = buildTutorMessages({ question, level: options.level, lang: langs[0] });
          const res = await ai.chat({ model: cfg.provider === 'gemini' ? cfg.gemini.modelPrimary : cfg.ollama.modelPrimary, messages, stream: false });
          aiText = res?.message?.content || res?.content || '';
        } catch (e) {
          aiText = `AI 연결 실패: ${e.message}`;
        }
      }
      if (langs.length > 1) {
        await createRunnableBundle({ outDir, title: question, langs, explanation: aiText, baseName: options.basename });
      } else {
        await createRunnableLesson({ outDir, title: question, lang: langs[0], explanation: aiText, baseName: options.basename });
      }
      const usage = [
        '---',
        '사용법 요약:',
        '- ct chat   # 대화형 질문',
        `- ct tutor "${question}" --lang ${langs[0]} --runnable`,
        ''
      ].join('\n');
      await writeFileSafe(path.join(outDir, 'USAGE.txt'), usage);
      console.log(`생성 완료: ${outDir}`);
    });
};

function resolveLangs(list, single) {
  const map = (s) => {
    const v = String(s || '').trim().toLowerCase();
    if (v === 'py' || v === 'python') return 'python';
    if (v === 'js' || v === 'javascript') return 'javascript';
    if (v === 'c') return 'c';
    if (v === 'cpp' || v === 'c++') return 'cpp';
    if (v === 'java') return 'java';
    return v || 'python';
  };
  if (list && String(list).trim()) {
    const arr = String(list).split(',').map(map).filter(Boolean);
    return Array.from(new Set(arr));
  }
  return [map(single || 'python')];
}

async function ensureUniqueDir(base) {
  let i = 0;
  // 첫 시도는 base, 이후 base-1, base-2 ...
  while (true) {
    const dir = i === 0 ? base : `${base}-${i}`;
    try {
      await ensureDirSafe(dir);
      return dir;
    } catch (e) {
      if (!String(e.message || '').includes('이미 존재')) throw e;
      i += 1;
      continue;
    }
  }
}

const path = require('path');
const { loadConfig } = require('../config');
const { createAI } = require('../ai/provider');
const { buildTutorMessages } = require('../tutor/prompt');
const { slugify, timestamp, writeFileSafe, ensureDirSafe } = require('../utils/fs');
const { createRunnableLesson, createRunnableBundle } = require('../generate/codegen');

module.exports = (program) => {
  program
    .command('tutor <question>')
    .description('Generate runnable code/README from a question')
    .option('--level <level>', '?�벨(elem|middle|high|college|basic)', 'elem')
    .option('--lang <language>', '주요 ?�어 지??python|javascript ??', 'python')
    .option('--langs <languages>', '?�러 ?�어 ?�시 지??콤마 구분, ?? py,c,java)')
    .option('--basename <name>', '?�성 ?�일??기본 ?�름', 'main')
    .option('--runnable', '?�성 코드가 바로 ?�행 가?�하?�록 ?�플�??�용', false)
    .option('--no-ai', 'AI ?�출 ?�이 ?�일�??�성')
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
          const res = await ai.chat({ model: (cfg.provider === 'gemini') ? cfg.gemini.modelPrimary : (cfg.provider === 'transformers') ? cfg.transformers.modelPrimary : (cfg.transformers && cfg.transformers.modelPrimary) || 'Xenova/Qwen2-0.5B-Instruct', messages, stream: false });
          aiText = res?.message?.content || res?.content || '';
        } catch (e) {
          aiText = `AI ?�결 ?�패: ${e.message}`;
        }
      }
      if (langs.length > 1) {
        await createRunnableBundle({ outDir, title: question, langs, explanation: aiText, baseName: options.basename });
      } else {
        await createRunnableLesson({ outDir, title: question, lang: langs[0], explanation: aiText, baseName: options.basename });
      }
      const usage = [
        '---',
        '?�용�??�약:',
        '- ct chat   # ?�?�형 질문',
        `- ct tutor "${question}" --lang ${langs[0]} --runnable`,
        ''
      ].join('\n');
      await writeFileSafe(path.join(outDir, 'USAGE.txt'), usage);
      console.log(`?�성 ?�료: ${outDir}`);
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
  // �??�도??base, ?�후 base-1, base-2 ...
  while (true) {
    const dir = i === 0 ? base : `${base}-${i}`;
    try {
      await ensureDirSafe(dir);
      return dir;
    } catch (e) {
      if (!String(e.message || '').includes('?��? 존재')) throw e;
      i += 1;
      continue;
    }
  }
}

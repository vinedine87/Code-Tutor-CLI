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
    .option('--level <level>', '?ˆë²¨(elem|middle|high|college|basic)', 'elem')
    .option('--lang <language>', 'ì£¼ìš” ?¸ì–´ ì§€??python|javascript ??', 'python')
    .option('--langs <languages>', '?¬ëŸ¬ ?¸ì–´ ?™ì‹œ ì§€??ì½¤ë§ˆ êµ¬ë¶„, ?? py,c,java)')
    .option('--basename <name>', '?ì„± ?Œì¼??ê¸°ë³¸ ?´ë¦„', 'main')
    .option('--runnable', '?ì„± ì½”ë“œê°€ ë°”ë¡œ ?¤í–‰ ê°€?¥í•˜?„ë¡ ?œí”Œë¦??¬ìš©', false)
    .option('--no-ai', 'AI ?¸ì¶œ ?†ì´ ?Œì¼ë§??ì„±')
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
          aiText = `AI ?°ê²° ?¤íŒ¨: ${e.message}`;
        }
      }
      if (langs.length > 1) {
        await createRunnableBundle({ outDir, title: question, langs, explanation: aiText, baseName: options.basename });
      } else {
        await createRunnableLesson({ outDir, title: question, lang: langs[0], explanation: aiText, baseName: options.basename });
      }
      const usage = [
        '---',
        '?¬ìš©ë²??”ì•½:',
        '- ct chat   # ?€?”í˜• ì§ˆë¬¸',
        `- ct tutor "${question}" --lang ${langs[0]} --runnable`,
        ''
      ].join('\n');
      await writeFileSafe(path.join(outDir, 'USAGE.txt'), usage);
      console.log(`?ì„± ?„ë£Œ: ${outDir}`);
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
  // ì²??œë„??base, ?´í›„ base-1, base-2 ...
  while (true) {
    const dir = i === 0 ? base : `${base}-${i}`;
    try {
      await ensureDirSafe(dir);
      return dir;
    } catch (e) {
      if (!String(e.message || '').includes('?´ë? ì¡´ì¬')) throw e;
      i += 1;
      continue;
    }
  }
}

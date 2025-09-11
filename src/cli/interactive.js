const readline = require('readline');
const chalk = require('chalk');
const { loadConfig, saveUserConfig, hasUserConfig } = require('../config');
const { createAI } = require('../ai/provider');

function banner() {
  if (String(process.env.CT_NO_ASCII || '').toLowerCase() === '1' || String(process.env.CT_NO_ASCII || '').toLowerCase() === 'true') {
    console.log(chalk.yellow('\nCode Tutor CLI'));
    console.log(chalk.yellow('µµ¿ò¸»: /help   ¸ðµå º¯°æ: /mode   Á¾·á: exit'));
    console.log(chalk.yellow('¸ðµå ¾È³»: 1) ÃÊµîÇÐ»ý  2) ÁßÇÐ»ý  3) °íµîÇÐ»ý  4) ´ëÇÐ»ý  5) ÀÏ¹Ý\n'));
    return;
  }
  const title = String.raw`
  _________          __          __________          __               
 /   _____/  ____  _/  |_  ____  \______   \ _____ _/  |_  ____  ____ 
 \_____  \ _/ __ \ \   __\\/  _ \  |       _// __  \\   __\\/  _ \\/  _ \
 /        \\  ___/  |  | (  <_> ) |    |   \\  ___/ |  | (  <_> |  <_> )
/_______  / \___  > |__|  \____/  |____|_  / \___  >|__|  \____/ \____/ 
        \/      \/                         \/      \/                   `;
  console.log('\n' + chalk.yellow(title));
  console.log(chalk.yellow('WELCOME TO CODE TUTOR CLI'));
  console.log(chalk.yellow('µµ¿ò¸»: /help   ¸ðµå º¯°æ: /mode   Á¾·á: exit'));
  console.log(chalk.yellow('¸ðµå ¾È³»: 1) ÃÊµîÇÐ»ý  2) ÁßÇÐ»ý  3) °íµîÇÐ»ý  4) ´ëÇÐ»ý  5) ÀÏ¹Ý'));
  console.log();
}

function modeMap() {
  return {
    1: { key: 'elem', name: 'ì´ˆë“±?™ìƒ', system: '?¹ì‹ ?€ ì´ˆë“±?™ìƒ???„í•œ ì¹œì ˆ??ì½”ë”© ?œí„°?…ë‹ˆ?? ?¬ìš´ ë¹„ìœ ?€ ì§§ì? ì½”ë“œ ?ˆì œë¡??¤ëª…?˜ì„¸??' },
    2: { key: 'middle', name: 'ì¤‘í•™??, system: '?¹ì‹ ?€ ì¤‘í•™?ì„ ?„í•œ ì½”ë”© ?œí„°?…ë‹ˆ?? ê¸°ë³¸ ë¬¸ë²•ê³?ê°œë…??ì°¨ê·¼ì°¨ê·¼ ?¤ëª…?˜ì„¸??' },
    3: { key: 'high', name: 'ê³ ë“±?™ìƒ', system: '?¹ì‹ ?€ ê³ ë“±?™ìƒ???„í•œ ì½”ë”© ?œí„°?…ë‹ˆ?? ?Œê³ ë¦¬ì¦˜ê³??ë£Œêµ¬ì¡°??ê¸°ì´ˆë¥??ˆì œë¡??¤ëª…?˜ì„¸??' },
    4: { key: 'college', name: '?€?™ìƒ', system: '?¹ì‹ ?€ ?€?™ìƒ???„í•œ ì½”ë”© ?œí„°?…ë‹ˆ?? ê°œë…??ëª…í™•???˜ê³  ë³µìž¡?„ë? ?¨ê»˜ ê³ ë ¤???¤ëª…?˜ì„¸??' },
    5: { key: 'adult', name: '?¼ë°˜', system: '?¹ì‹ ?€ ?¤ë¬´ ì¹œí™”?ì¸ ì½”ë”© ì½”ì¹˜?…ë‹ˆ?? ëª¨ë²” ì½”ë“œ ì¤‘ì‹¬?¼ë¡œ ê°„ê²°?˜ê²Œ ?ˆë‚´?˜ì„¸??' }
  };
}

function resolveMode(input) {
  const m = modeMap();
  const t = String(input).trim().toLowerCase();
  if (m[t]) return m[t];
  const byKey = Object.values(m).find(v => v.key === t || v.name === t);
  if (byKey) return byKey;
  if (/^[1-5]$/.test(t)) return m[Number(t)];
  return null;
}

async function ensureFirstRunConfig(cfg, providerOverride) {
  if (hasUserConfig()) return cfg;
  try {
    const inquirer = require('inquirer');
    let provider = providerOverride || cfg.provider || 'transformers';
    if (!providerOverride) {
      const ans1 = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: '?´ë–¤ ëª¨ë¸ ?œê³µ?ë? ?¬ìš©? ê¹Œ??',
          choices: [
            { name: 'Transformers(?´ìž¥, ?ë™ ?¤ìš´ë¡œë“œ)', value: 'transformers' },
            { name: 'Gemini(???„ìš”, ê³ ê¸‰)', value: 'gemini' },
            { name: 'Local(node-llama-cpp, ê³ ê¸‰)', value: 'local' }
          ],
          default: 'transformers'
        }
      ]);
      provider = ans1.provider;
    }

    const next = { ...cfg, provider };
    if (provider === 'gemini') {
      const gemAns = await inquirer.prompt([
        { type: 'input', name: 'modelPrimary', message: 'ê¸°ë³¸ Gemini ëª¨ë¸:', default: cfg.gemini.modelPrimary || 'gemini-1.5-flash' },
        { type: 'password', name: 'apiKey', message: 'GEMINI_API_KEY (ê±´ë„ˆ?°ë ¤ë©?Enter):', mask: '*' }
      ]);
      next.gemini = { ...cfg.gemini, modelPrimary: gemAns.modelPrimary, apiKey: gemAns.apiKey || cfg.gemini.apiKey };
    } else if (provider === 'transformers') {
      next.transformers = { ...cfg.transformers };
    } else if (provider === 'local') {
      next.local = { ...cfg.local };
    }
    saveUserConfig(next);
    console.log('\n[?¤ì • ?€?? ~/.codetutor/config.json ??ê¸°ë³¸ ?¤ì •???€?¥í–ˆ?µë‹ˆ??');
    return next;
  } catch (_) {
    return cfg;
  }
}

async function startInteractiveMode(providerOverride) {
  let cfg = loadConfig();
  cfg = await ensureFirstRunConfig(cfg, providerOverride);
  if (providerOverride) cfg.provider = providerOverride;
  let ai = createAI(cfg);
  const history = [];
  let currentMode = null;

  banner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `ct > `
  });

  async function askMode() {
    try {
      const inquirer = require('inquirer');
      const choices = [
        { name: '1) ì´ˆë“±?™ìƒ', value: '1' },
        { name: '2) ì¤‘í•™??, value: '2' },
        { name: '3) ê³ ë“±?™ìƒ', value: '3' },
        { name: '4) ?€?™ìƒ', value: '4' },
        { name: '5) ?¼ë°˜', value: '5' }
      ];
      const ans = await inquirer.prompt([
        { type: 'list', name: 'mode', message: 'ëª¨ë“œ ? íƒ', choices }
      ]);
      currentMode = resolveMode(ans.mode);
    } catch (_) {
      await new Promise((resolve) => {
        rl.question('ëª¨ë“œ ? íƒ (1-5 ?…ë ¥): ', (ans) => {
          const m = resolveMode(ans);
          if (!m) {
            console.log('? íš¨?˜ì? ?Šì? ?…ë ¥?…ë‹ˆ?? ?¤ì‹œ ? íƒ?˜ì„¸??\n');
            return resolve(askMode());
          }
          currentMode = m;
          resolve();
        });
      });
    }
    history.length = 0;
    history.push({ role: 'system', content: currentMode.system });
    rl.setPrompt(`ct[${currentMode.key}] > `);
    console.log(`\n[${currentMode.name}] ëª¨ë“œê°€ ?œìž‘?˜ì—ˆ?µë‹ˆ??`);
    console.log('?„ì?ë§? /help, ëª¨ë“œ ë³€ê²? /mode, ì¢…ë£Œ: exit');
    console.log('ëª¨ë“œ ?ˆë‚´: 1) ì´ˆë“±?™ìƒ  2) ì¤‘í•™?? 3) ê³ ë“±?™ìƒ  4) ?€?™ìƒ  5) ?¼ë°˜\n');

    if (cfg.provider === 'transformers') {
      console.log('ì°¸ê³ : ì²??¤í–‰ ??ëª¨ë¸ ê°€ì¤‘ì¹˜ë¥??ë™ ?¤ìš´ë¡œë“œ?©ë‹ˆ???¤íŠ¸?Œí¬ ?„ìš”).');
    }
    rl.prompt();
  }

  async function handleUserInput(input) {
    const text = input.trim();
    if (text.length === 0) return rl.prompt();

    if (text === 'exit' || text === '/exit' || text === 'quit' || text === '/quit') {
      rl.close();
      return;
    }
    if (text === '/help') {
      console.log('ëª…ë ¹: /help, /mode, exit');
      return rl.prompt();
    }
    if (text === '/mode') {
      currentMode = null;
      rl.setPrompt('ct > ');
      return askMode();
    }

    history.push({ role: 'user', content: text });

    try {
      const res = await ai.chat({
        model: (cfg.provider === 'gemini') ? cfg.gemini.modelPrimary
          : (cfg.provider === 'transformers') ? cfg.transformers.modelPrimary
          : (cfg.transformers && cfg.transformers.modelPrimary) || 'Xenova/Qwen2-0.5B-Instruct',
        messages: history,
        stream: false
      });
      const assistant = res?.message?.content || res?.content || JSON.stringify(res);
      history.push({ role: 'assistant', content: assistant });
      console.log(`\n${assistant}\n`);
    } catch (err) {
      // ë¹„ì •???¤íŒ¨ ??1???´ìž¥ ëª¨ë¸ë¡??„í™˜ ???¬ì‹œ??      if (cfg.provider !== 'transformers') {
        try {
          console.log('\n[?ë™ ?„í™˜] ?‘ë‹µ ?¤íŒ¨ë¡??´ìž¥ ëª¨ë¸ë¡??„í™˜ ???¬ì‹œ?„í•©?ˆë‹¤.');
          cfg.provider = 'transformers';
          saveUserConfig(cfg);
          ai = createAI(cfg);
          const res2 = await ai.chat({
            model: cfg.transformers.modelPrimary,
            messages: history,
            stream: false
          });
          const assistant2 = res2?.message?.content || res2?.content || JSON.stringify(res2);
          history.push({ role: 'assistant', content: assistant2 });
          console.log(`\n${assistant2}\n`);
          rl.prompt();
          return;
        } catch (_) {
          // ?„ëž˜ ?œí”Œë¦¿ìœ¼ë¡??´ë°±
        }
      }
      // ?œí”Œë¦??´ë°±(?? êµ¬êµ¬?? ?¤í? ?¬í•¨)
      let fallback = '';
      const lower = text.toLowerCase();
      if (lower.includes('êµ¬êµ¬') || lower.includes('gugu')) {
        fallback = `# ?Œì´??êµ¬êµ¬??(1~9)
for i in range(1, 10):
    line = []
    for j in range(1, 10):
        line.append(f"{i} x {j} = {i*j}")
    print('   '.join(line))`;
      } else {
        fallback = `[?¤í”„?¼ì¸] ${currentMode?.name || ''} ëª¨ë“œ ?‘ë‹µ: ${text}`.trim();
      }
      history.push({ role: 'assistant', content: fallback });
      console.log(`\n${fallback}\n`);
    }
    rl.prompt();
  }

  rl.on('line', (line) => {
    if (!currentMode) {
      const m = resolveMode(line);
      if (!m) {
        console.log('? íš¨?˜ì? ?Šì? ?…ë ¥?…ë‹ˆ?? ?¤ì‹œ ? íƒ?˜ì„¸??\n');
        return askMode();
      }
      currentMode = m;
      history.length = 0;
      history.push({ role: 'system', content: m.system });
      rl.setPrompt(`ct[${m.key}] > `);
      console.log(`\n[${m.name}] ëª¨ë“œê°€ ?œìž‘?˜ì—ˆ?µë‹ˆ?? ë°”ë¡œ ì§ˆë¬¸???…ë ¥?˜ì„¸??\n`);
      return rl.prompt();
    }
    handleUserInput(line);
  }).on('close', () => {
    console.log('?€??ëª¨ë“œë¥?ì¢…ë£Œ?©ë‹ˆ??\n');
    process.exit(0);
  });

  askMode();
}

module.exports = startInteractiveMode;

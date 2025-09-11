const readline = require('readline');
const chalk = require('chalk');
const { loadConfig, saveUserConfig, hasUserConfig } = require('../config');
const { createAI } = require('../ai/provider');

function banner() {
  if (String(process.env.CT_NO_ASCII || '').toLowerCase() === '1' || String(process.env.CT_NO_ASCII || '').toLowerCase() === 'true') {
    console.log(chalk.yellow('\nCode Tutor CLI'));
    console.log(chalk.yellow('\uB3C4\uC6C0\uB9D0: /help   \uBAA8\uB4DC \uBCC0\uACBD: /mode   \uC885\uB8CC: exit'));
    console.log(chalk.yellow('\uBAA8\uB4DC \uC548\uB0B4: 1) \uCD08\uB4F1\uD559\uC0DD  2) \uC911\uD559\uC0DD  3) \uACE0\uB4F1\uD559\uC0DD  4) \uB300\uD559\uC0DD  5) \uC77C\uBC18\n'));
    return;
  }
  const title = String.raw`
  _________          __          __________          __               
 /   _____/  ____  _/  |_  ____  \______   \ _____ _/  |_  ____  ____ 
 \_____  \ _/ __ \ \   __\/  _ \  |       _// __  \\   __\/  _ \/  _ \
 /        \\  ___/  |  | (  <_> ) |    |   \\  ___/ |  | (  <_> |  <_> )
/_______  / \___  > |__|  \____/  |____|_  / \___  >|__|  \____/ \____/ 
        \/      \/                         \/      \/                   `;
  console.log('\n' + chalk.yellow(title));
  console.log(chalk.yellow('WELCOME TO CODE TUTOR CLI'));
  console.log(chalk.yellow('\uB3C4\uC6C0\uB9D0: /help   \uBAA8\uB4DC \uBCC0\uACBD: /mode   \uC885\uB8CC: exit'));
  console.log(chalk.yellow('\uBAA8\uB4DC \uC548\uB0B4: 1) \uCD08\uB4F1\uD559\uC0DD  2) \uC911\uD559\uC0DD  3) \uACE0\uB4F1\uD559\uC0DD  4) \uB300\uD559\uC0DD  5) \uC77C\uBC18'));
  console.log();
}

function modeMap() {
  return {
    1: { key: 'elem', name: '\uCD08\uB4F1\uD559\uC0DD', system: '\uB2F9\uC2E0\uC740 \uCD08\uB4F1\uD559\uC0DD\uC744 \uC704\uD55C \uCE5C\uC808\uD55C \uCF54\uB529 \uD29C\uD130\uC785\uB2C8\uB2E4. \uC26C\uC6B4 \uBE44\uC720\uC640 \uC9E7\uACE0 \uAC04\uB2E8\uD55C \uCF54\uB4DC \uC608\uC81C\uB85C \uC124\uBA85\uD558\uC138\uC694.' },
    2: { key: 'middle', name: '\uC911\uD559\uC0DD', system: '\uC911\uD559\uC0DD\uC744 \uC704\uD55C \uCF54\uB529 \uD29C\uD130\uC785\uB2C8\uB2E4. \uAE30\uBCF8 \uBB38\uBC95\uACFC \uAC1C\uB150\uC744 \uCC28\uADFC\uCC28\uADFC \uC124\uBA85\uD558\uC138\uC694.' },
    3: { key: 'high', name: '\uACE0\uB4F1\uD559\uC0DD', system: '\uACE0\uB4F1\uD559\uC0DD\uC744 \uC704\uD55C \uCF54\uB529 \uD29C\uD130\uC785\uB2C8\uB2E4. \uC54C\uACE0\uB9AC\uC998\uACFC \uC790\uB8CC\uAD6C\uC870 \uAE30\uCD08\uB97C \uC608\uC81C\uB85C \uC124\uBA85\uD558\uC138\uC694.' },
    4: { key: 'college', name: '\uB300\uD559\uC0DD', system: '\uB300\uD559\uC0DD\uC744 \uC704\uD55C \uCF54\uB529 \uD29C\uD130\uC785\uB2C8\uB2E4. \uAC1C\uB150\uC744 \uBA85\uD655\uD558\uACE0 \uBCF5\uC7A1\uB3C4\uB3C4 \uD568\uAED8 \uC124\uBA85\uD558\uC138\uC694.' },
    5: { key: 'adult', name: '\uC77C\uBC18', system: '\uC2E4\uBB34 \uCE5C\uD654\uC801\uC778 \uCF54\uB529 \uCF54\uCE58\uC785\uB2C8\uB2E4. \uBAA8\uBCF4\uBCF4\uB4DC \uC911\uC2EC\uC73C\uB85C \uAC04\uAC10\uD558\uAC8C \uC548\uB0B4\uD558\uC138\uC694.' }
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
    const next = { ...cfg, provider: providerOverride || 'transformers' };
    saveUserConfig(next);
    console.log('\n[\uC124\uC815 \uC800\uC7A5] ~/.codetutor/config.json \uC5D0 \uAE30\uBCF8 \uC124\uC815\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.');
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
    await new Promise((resolve) => {
      rl.question('\uBAA8\uB4DC \uC120\uD0DD (1-5 \uC785\uB825): ', (ans) => {
        const m = resolveMode(ans);
        if (!m) {
          console.log('\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC785\uB825\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC120\uD0DD\uD558\uC138\uC694.\n');
          return resolve(askMode());
        }
        currentMode = m;
        resolve();
      });
    });
    history.length = 0;
    history.push({ role: 'system', content: currentMode.system });
    rl.setPrompt(`ct[${currentMode.key}] > `);
    console.log(`\n[${currentMode.name}] \uBAA8\uB4DC\uAC00 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
    console.log('\uB3C4\uC6C0\uB9D0: /help, \uBAA8\uB4DC \uBCC0\uACBD: /mode, \uC885\uB8CC: exit');
    console.log('\uBAA8\uB4DC \uC548\uB0B4: 1) \uCD08\uB4F1\uD559\uC0DD  2) \uC911\uD559\uC0DD  3) \uACE0\uB4F1\uD559\uC0DD  4) \uB300\uD559\uC0DD  5) \uC77C\uBC18\n');
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
      console.log('\uBA85\uB839: /help, /mode, exit');
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
      if (cfg.provider !== 'transformers') {
        try {
          console.log('\n[\uC790\uB3D9 \uC804\uD658] \uC751\uB2F5 \uC2E4\uD328\uB85C \uB0B4\uC7A5 \uBAA8\uB378\uB85C \uC804\uD658 \uD6C4 \uC7AC\uC2DC\uB3C4\uD569\uB2C8\uB2E4.');
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
        } catch (_) {}
      }
      let fallback = '';
      const lower = text.toLowerCase();
      if (lower.includes('\uAD6C\uAD6C') || lower.includes('gugu')) {
        fallback = `# \uD30C\uC774\uC36C \uAD6C\uAD6C\uB2E8 (1~9)
for i in range(1, 10):
    line = []
    for j in range(1, 10):
        line.append(f"{i} x {j} = {i*j}")
    print('   '.join(line))`;
      } else {
        fallback = `[\uC624\uD504\uB77C\uC778] ${(currentMode?.name || '')} \uBAA8\uB4DC \uC751\uB2F5: ${text}`.trim();
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
        console.log('\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC785\uB825\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC120\uD0DD\uD558\uC138\uC694.\n');
        return askMode();
      }
      currentMode = m;
      history.length = 0;
      history.push({ role: 'system', content: m.system });
      rl.setPrompt(`ct[${m.key}] > `);
      console.log(`\n[${m.name}] \uBAA8\uB4DC\uAC00 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC14\uB85C \uC9C8\uBB38\uC744 \uC785\uB825\uD558\uC138\uC694.\n`);
      return rl.prompt();
    }
    handleUserInput(line);
  }).on('close', () => {
    console.log('\uB300\uD654 \uBAA8\uB4DC\uB97C \uC885\uB8CC\uD569\uB2C8\uB2E4.\n');
    process.exit(0);
  });

  askMode();
}

module.exports = startInteractiveMode;


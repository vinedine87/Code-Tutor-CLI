const readline = require('readline');
const chalk = require('chalk');
const { loadConfig, saveUserConfig, hasUserConfig } = require('../config');
const { createAI } = require('../ai/provider');

function banner() {
  if (String(process.env.CT_NO_ASCII || '').toLowerCase() === '1' || String(process.env.CT_NO_ASCII || '').toLowerCase() === 'true') {
    console.log(chalk.yellow('\nCode Tutor CLI'));
    console.log(chalk.yellow('����: /help   ��� ����: /mode   ����: exit'));
    console.log(chalk.yellow('��� �ȳ�: 1) �ʵ��л�  2) ���л�  3) ����л�  4) ���л�  5) �Ϲ�\n'));
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
  console.log(chalk.yellow('����: /help   ��� ����: /mode   ����: exit'));
  console.log(chalk.yellow('��� �ȳ�: 1) �ʵ��л�  2) ���л�  3) ����л�  4) ���л�  5) �Ϲ�'));
  console.log();
}

function modeMap() {
  return {
    1: { key: 'elem', name: '초등?�생', system: '?�신?� 초등?�생???�한 친절??코딩 ?�터?�니?? ?�운 비유?� 짧�? 코드 ?�제�??�명?�세??' },
    2: { key: 'middle', name: '중학??, system: '?�신?� 중학?�을 ?�한 코딩 ?�터?�니?? 기본 문법�?개념??차근차근 ?�명?�세??' },
    3: { key: 'high', name: '고등?�생', system: '?�신?� 고등?�생???�한 코딩 ?�터?�니?? ?�고리즘�??�료구조??기초�??�제�??�명?�세??' },
    4: { key: 'college', name: '?�?�생', system: '?�신?� ?�?�생???�한 코딩 ?�터?�니?? 개념??명확???�고 복잡?��? ?�께 고려???�명?�세??' },
    5: { key: 'adult', name: '?�반', system: '?�신?� ?�무 친화?�인 코딩 코치?�니?? 모범 코드 중심?�로 간결?�게 ?�내?�세??' }
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
          message: '?�떤 모델 ?�공?��? ?�용?�까??',
          choices: [
            { name: 'Transformers(?�장, ?�동 ?�운로드)', value: 'transformers' },
            { name: 'Gemini(???�요, 고급)', value: 'gemini' },
            { name: 'Local(node-llama-cpp, 고급)', value: 'local' }
          ],
          default: 'transformers'
        }
      ]);
      provider = ans1.provider;
    }

    const next = { ...cfg, provider };
    if (provider === 'gemini') {
      const gemAns = await inquirer.prompt([
        { type: 'input', name: 'modelPrimary', message: '기본 Gemini 모델:', default: cfg.gemini.modelPrimary || 'gemini-1.5-flash' },
        { type: 'password', name: 'apiKey', message: 'GEMINI_API_KEY (건너?�려�?Enter):', mask: '*' }
      ]);
      next.gemini = { ...cfg.gemini, modelPrimary: gemAns.modelPrimary, apiKey: gemAns.apiKey || cfg.gemini.apiKey };
    } else if (provider === 'transformers') {
      next.transformers = { ...cfg.transformers };
    } else if (provider === 'local') {
      next.local = { ...cfg.local };
    }
    saveUserConfig(next);
    console.log('\n[?�정 ?�?? ~/.codetutor/config.json ??기본 ?�정???�?�했?�니??');
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
        { name: '1) 초등?�생', value: '1' },
        { name: '2) 중학??, value: '2' },
        { name: '3) 고등?�생', value: '3' },
        { name: '4) ?�?�생', value: '4' },
        { name: '5) ?�반', value: '5' }
      ];
      const ans = await inquirer.prompt([
        { type: 'list', name: 'mode', message: '모드 ?�택', choices }
      ]);
      currentMode = resolveMode(ans.mode);
    } catch (_) {
      await new Promise((resolve) => {
        rl.question('모드 ?�택 (1-5 ?�력): ', (ans) => {
          const m = resolveMode(ans);
          if (!m) {
            console.log('?�효?��? ?��? ?�력?�니?? ?�시 ?�택?�세??\n');
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
    console.log(`\n[${currentMode.name}] 모드가 ?�작?�었?�니??`);
    console.log('?��?�? /help, 모드 변�? /mode, 종료: exit');
    console.log('모드 ?�내: 1) 초등?�생  2) 중학?? 3) 고등?�생  4) ?�?�생  5) ?�반\n');

    if (cfg.provider === 'transformers') {
      console.log('참고: �??�행 ??모델 가중치�??�동 ?�운로드?�니???�트?�크 ?�요).');
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
      console.log('명령: /help, /mode, exit');
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
      // 비정???�패 ??1???�장 모델�??�환 ???�시??      if (cfg.provider !== 'transformers') {
        try {
          console.log('\n[?�동 ?�환] ?�답 ?�패�??�장 모델�??�환 ???�시?�합?�다.');
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
          // ?�래 ?�플릿으�??�백
        }
      }
      // ?�플�??�백(?? 구구?? ?��? ?�함)
      let fallback = '';
      const lower = text.toLowerCase();
      if (lower.includes('구구') || lower.includes('gugu')) {
        fallback = `# ?�이??구구??(1~9)
for i in range(1, 10):
    line = []
    for j in range(1, 10):
        line.append(f"{i} x {j} = {i*j}")
    print('   '.join(line))`;
      } else {
        fallback = `[?�프?�인] ${currentMode?.name || ''} 모드 ?�답: ${text}`.trim();
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
        console.log('?�효?��? ?��? ?�력?�니?? ?�시 ?�택?�세??\n');
        return askMode();
      }
      currentMode = m;
      history.length = 0;
      history.push({ role: 'system', content: m.system });
      rl.setPrompt(`ct[${m.key}] > `);
      console.log(`\n[${m.name}] 모드가 ?�작?�었?�니?? 바로 질문???�력?�세??\n`);
      return rl.prompt();
    }
    handleUserInput(line);
  }).on('close', () => {
    console.log('?�??모드�?종료?�니??\n');
    process.exit(0);
  });

  askMode();
}

module.exports = startInteractiveMode;

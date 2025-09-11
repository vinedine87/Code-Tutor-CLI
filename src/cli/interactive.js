const readline = require('readline');
const { loadConfig, saveUserConfig, hasUserConfig } = require('../config');
const { createAI } = require('../ai/provider');

function banner() {
  console.log('============================================');
  console.log(' Code Tutor CLI - Chat Mode');
  console.log(' 대화형으로 사용하세요. 종료: exit');
  console.log(' 모드 변경: /mode   도움말: /help');
  console.log('============================================\n');
}

function modeMap() {
  return {
    1: { key: 'elem', name: '초등학생', system: '당신은 초등학생 대상으로 설명하는 친절한 코딩 튜터입니다. 쉬운 비유와 예시를 사용하고, 짧고 간단한 코드를 제시하세요.' },
    2: { key: 'middle', name: '중학생', system: '당신은 중학생을 위한 코딩 튜터입니다. 기본 문법과 개념을 차근차근 설명하세요.' },
    3: { key: 'high', name: '고등학생', system: '당신은 고등학생을 위한 코딩 튜터입니다. 알고리즘과 자료구조의 기본을 함께 설명하세요.' },
    4: { key: 'college', name: '대학생', system: '당신은 대학생을 위한 코딩 튜터입니다. 개념을 명확히 하고 시간/공간 복잡도 경계를 언급하세요.' },
    5: { key: 'adult', name: '일반', system: '당신은 일반 성인을 위한 업무 친화 코딩 코치입니다. 모범 사례 중심으로 간결하게 안내하세요.' }
  };
}

function renderModeMenu() {
  console.log('대화 모드를 선택하세요');
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
  // Prompt for provider and model only on first run (no user config file)
  try {
    const inquirer = require('inquirer');
    let provider = providerOverride || cfg.provider || 'ollama';
    if (!providerOverride) {
      const ans1 = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: '어떤 모델 제공자를 사용할까요?',
          choices: [
            { name: 'Ollama (로컬 서버, 권장)', value: 'ollama' },
            { name: 'Gemini (Google API 키 필요)', value: 'gemini' },
            { name: 'Local (node-llama-cpp, 자동 모델 다운로드)', value: 'local' }
          ],
          default: 'ollama'
        }
      ]);
      provider = ans1.provider;
    }

    const next = { ...cfg, provider };
    if (provider === 'ollama') {
      const { modelPrimary } = await inquirer.prompt([
        { type: 'input', name: 'modelPrimary', message: '기본 Ollama 모델 태그:', default: cfg.ollama.modelPrimary || 'qwen2:7b' }
      ]);
      next.ollama = { ...cfg.ollama, modelPrimary };
    } else if (provider === 'gemini') {
      const gemAns = await inquirer.prompt([
        { type: 'input', name: 'modelPrimary', message: '기본 Gemini 모델:', default: cfg.gemini.modelPrimary || 'gemini-1.5-flash' },
        { type: 'password', name: 'apiKey', message: 'GEMINI_API_KEY (건너뛰려면 Enter):', mask: '*' }
      ]);
      next.gemini = { ...cfg.gemini, modelPrimary: gemAns.modelPrimary, apiKey: gemAns.apiKey || cfg.gemini.apiKey };
    } else if (provider === 'local') {
      // Use defaults; local provider auto-downloads when needed
      next.local = { ...cfg.local };
    }
    saveUserConfig(next);
    console.log(`\n[설정 저장] ~/.codetutor/config.json 에 기본 설정을 저장했습니다.`);
    return next;
  } catch (_) {
    // Fallback to defaults when inquirer not available
    return cfg;
  }
}

async function startInteractiveMode(providerOverride) {
  let cfg = loadConfig();
  cfg = await ensureFirstRunConfig(cfg, providerOverride);
  if (providerOverride) cfg.provider = providerOverride;
  const ai = createAI(cfg);
  const history = [];
  let currentMode = null;

  banner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `ct > `
  });

  async function askMode() {
    renderModeMenu();
    try {
      const inquirer = require('inquirer');
      const choices = [
        { name: '1) 초등학생', value: '1' },
        { name: '2) 중학생', value: '2' },
        { name: '3) 고등학생', value: '3' },
        { name: '4) 대학생', value: '4' },
        { name: '5) 일반', value: '5' }
      ];
      const ans = await inquirer.prompt([
        { type: 'list', name: 'mode', message: '모드 선택', choices }
      ]);
      const m = resolveMode(ans.mode);
      currentMode = m;
    } catch (_) {
      // inquirer 미설치 시 텍스트 입력으로 대체
      await new Promise((resolve) => {
        rl.question('모드 선택 (1-5 또는 키워드): ', (ans) => {
          const m = resolveMode(ans);
          if (!m) {
            console.log('유효하지 않은 입력입니다. 다시 선택하세요.\n');
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
    console.log(`\n[${currentMode.name}] 모드가 시작되었습니다.`);
    console.log('핵심 명령어: /help, /mode, exit');
    console.log('예) 파이썬으로 리스트 최대값 구하는 방법 알려줘\n');
    // 연결 점검: ollama 모델 목록 시도
    try {
      if (cfg.provider === 'ollama') {
        await ai.listModels();
      }
    } catch (_) {
      if (cfg.provider === 'ollama') {
        console.log('참고: Ollama 연결이 필요합니다. 설치/실행 가이드:');
        console.log(" - 서버 실행: 'ollama serve'");
        console.log(" - 기본 모델 받기: 'ollama pull qwen2:7b'\n");
      } else if (cfg.provider === 'gemini') {
        console.log('참고: GEMINI_API_KEY 환경변수를 설정하세요. 모델 기본값 gemini-1.5-flash');
      }
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
      console.log('명령어: /help, /mode, exit');
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
          : (cfg.provider === 'transformers') ? (cfg.transformers && cfg.transformers.modelPrimary) || 'Xenova/Qwen2-0.5B-Instruct'
          : cfg.ollama.modelPrimary,
        messages: history,
        stream: false
      });
      const assistant = res?.message?.content || res?.content || JSON.stringify(res);
      history.push({ role: 'assistant', content: assistant });
      console.log(`\n${assistant}\n`);
    } catch (err) {
      const fallback = `[오프라인] ${currentMode?.name || ''} 모드 응답 에코: ${text}`.trim();
      history.push({ role: 'assistant', content: fallback });
      console.log(`\n${fallback}\n`);
    }
    rl.prompt();
  }

  rl.on('line', (line) => {
    if (!currentMode) {
      const m = resolveMode(line);
      if (!m) {
        console.log('유효하지 않은 입력입니다. 다시 선택하세요.\n');
        return askMode();
      }
      currentMode = m;
      history.length = 0;
      history.push({ role: 'system', content: m.system });
      rl.setPrompt(`ct[${m.key}] > `);
      console.log(`\n[${m.name}] 모드가 시작되었습니다. 자연어로 질문을 입력하세요.\n`);
      return rl.prompt();
    }
    handleUserInput(line);
  }).on('close', () => {
    console.log('Code Tutor CLI 대화형 모드를 종료합니다.\n');
    process.exit(0);
  });

  askMode();
}

module.exports = startInteractiveMode;

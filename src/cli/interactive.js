const readline = require('readline');
const chalk = require('chalk');
const { loadConfig, saveUserConfig, hasUserConfig } = require('../config');
const { createAI } = require('../ai/provider');

function banner() {
  const noAscii = String(process.env.CT_NO_ASCII || '').toLowerCase();
  if (noAscii === '1' || noAscii === 'true') {
    console.log(chalk.bgYellow.black.bold('\n Code Tutor '));
    console.log(chalk.bgYellow.black.bold(' 도움말: /help   모드 변경: /mode   종료: exit '));
    console.log(chalk.bgYellow.black.bold(' 모드 안내: 1) 초등학생  2) 중학생  3) 고등학생  4) 대학생  5) 일반 '));
    console.log();
    return;
  }

  // Gemini CLI 스타일의 둥근 상자(rounded box), 노란 배경 + 검정 테두리/텍스트
  const title = 'CODE TUTOR';
  const sub = 'Interactive CLI';
  const innerPadH = 6; // 좌우 여백(내용 기준)
  const innerPadV = 1; // 제목 위/아래 내부 여백
  const contentWidth = Math.max(title.length, sub.length) + innerPadH * 2;
  const width = Math.max(54, contentWidth); // 조금 더 크게(최소 54 컬럼)

  const top    = chalk.bgYellow.black('╭' + '─'.repeat(width - 2) + '╮');
  const bottom = chalk.bgYellow.black('╰' + '─'.repeat(width - 2) + '╯');
  const empty  = chalk.bgYellow.black('│' + ' '.repeat(width - 2) + '│');

  const titleLine = chalk.bgYellow.black.bold('│' + centerText(title, width - 2) + '│');
  const subLine   = chalk.bgYellow.black('│' + centerText(sub,   width - 2) + '│');

  console.log();
  console.log(top);
  for (let i = 0; i < innerPadV; i++) console.log(empty);
  console.log(titleLine);
  console.log(subLine);
  for (let i = 0; i < innerPadV; i++) console.log(empty);
  console.log(bottom);

  // 가이드 라인(노란색 유지)
  console.log(chalk.bgYellow.black.bold(' 도움말: /help   모드 변경: /mode   종료: exit '));
  console.log(chalk.bgYellow.black.bold(' 모드 안내: 1) 초등학생  2) 중학생  3) 고등학생  4) 대학생  5) 일반 '));
  console.log();
}

function centerText(txt, width) {
  const t = ` ${txt} `; // 안쪽 여백
  const left = Math.floor((width - t.length) / 2);
  const right = width - t.length - left;
  return ' '.repeat(left) + t + ' '.repeat(right);
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
    // 첫 저장 시 민감정보(apiToken)는 저장하지 않도록 마스킹
    const masked = {
      ...cfg,
      provider: providerOverride || 'openai',
      openai: {
        ...(cfg.openai || {}),
        apiKey: ''
      }
    };
    // 최초 실행 시에도 설정 저장 안내 문구는 표시하지 않습니다.
    saveUserConfig(masked);
    return masked;
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
  let showUsage = /^1|true$/i.test(String(process.env.CT_SHOW_USAGE || '0'));

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
    console.log(chalk.bgYellow.black.bold(' 도움말: /help   모드 변경: /mode   종료: exit '));
    console.log(chalk.bgYellow.black.bold(' 모드 안내: 1) 초등학생  2) 중학생  3) 고등학생  4) 대학생  5) 일반 '));
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
    if (text.startsWith('/usage')) {
      const arg = text.split(/\s+/)[1] || '';
      if (/^(on|1|true)$/i.test(arg)) {
        showUsage = true;
        console.log('토큰 사용량 표시가 활성화되었습니다.');
      } else if (/^(off|0|false)$/i.test(arg)) {
        showUsage = false;
        console.log('토큰 사용량 표시가 비활성화되었습니다.');
      } else {
        console.log(`사용법: /usage on | /usage off (현재: ${showUsage ? 'on' : 'off'})`);
      }
      return rl.prompt();
    }

    function isGugudanPython(t) {
      const s = t.toLowerCase();
      const hasPython = /(python|파이썬|py)/.test(s);
      const hasGugudan = /(구구\s*단|구구돈|gugudan|multiplication\s*table)/.test(s);
      return hasPython && hasGugudan;
    }

    function randomPyName() {
      const c = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      return `${c}.py`;
    }

    function renderGugudan() {
      const fname = randomPyName();
      const code = [
        `# ${fname} - 파이썬 구구단 (1~9)`,
        `# 각 줄에 1~9까지 곱셈 결과를 출력합니다.`,
        `def main():`,
        `    for i in range(1, 10):`,
        `        line = []`,
        `        for j in range(1, 10):`,
        `            line.append(f"{i} x {j} = {i*j}")`,
        `        print('   '.join(line))`,
        ``,
        `if __name__ == "__main__":`,
        `    main()`,
      ].join('\n');
      const display = `=== ${fname} ===\n${code}`;
      history.push({ role: 'assistant', content: display });
      console.log(`\n${display}\n`);
    }

    function maybeRenderPythonTemplate(t) {
      const s = t.toLowerCase();
      const isPython = /(python|파이썬|py)/.test(s);
      if (!isPython) return false;
      // 버블 정렬
      if (/(버블\s*정렬|bubble\s*sort)/.test(s)) {
        const fname = randomPyName();
        const code = [
          `# ${fname} - 파이썬 버블 정렬 예제`,
          `# 주어진 리스트를 오름차순으로 정렬합니다.`,
          `def bubble_sort(arr):`,
          `    n = len(arr)`,
          `    for i in range(n):`,
          `        for j in range(0, n - i - 1):`,
          `            if arr[j] > arr[j + 1]:`,
          `                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
          `    return arr`,
          ``,
          `def main():`,
          `    data = [5, 2, 9, 1, 5, 6]`,
          `    print('원본:', data)`,
          `    print('정렬:', bubble_sort(data))`,
          ``,
          `if __name__ == "__main__":`,
          `    main()`,
        ].join('\n');
        const display = `=== ${fname} ===\n${code}`;
        history.push({ role: 'assistant', content: display });
        console.log(`\n${display}\n`);
        return true;
      }
      // 피보나치
      if (/(피보나치|fibonacci)/.test(s)) {
        const fname = randomPyName();
        const code = [
          `# ${fname} - 파이썬 피보나치 수열`,
          `# n번째 항까지 피보나치 수열을 출력합니다.`,
          `def fib(n):`,
          `    a, b = 0, 1`,
          `    seq = []`,
          `    for _ in range(n):`,
          `        seq.append(a)`,
          `        a, b = b, a + b`,
          `    return seq`,
          ``,
          `def main():`,
          `    print(fib(10))`,
          ``,
          `if __name__ == "__main__":`,
          `    main()`,
        ].join('\n');
        const display = `=== ${fname} ===\n${code}`;
        history.push({ role: 'assistant', content: display });
        console.log(`\n${display}\n`);
        return true;
      }
      return false;
    }

    // 코드 요청(구구단+파이썬) 즉시 처리
    if (isGugudanPython(text)) {
      history.push({ role: 'user', content: text });
      renderGugudan();
      rl.prompt();
      return;
    }

    // 추가 템플릿 처리 (버블 정렬/피보나치 등)
    if (maybeRenderPythonTemplate(text)) {
      history.push({ role: 'user', content: text });
      rl.prompt();
      return;
    }

    history.push({ role: 'user', content: text });

    try {
      const res = await ai.chat({
        messages: history,
        stream: false
      });
      const assistant = res?.message?.content || res?.content || JSON.stringify(res);
      history.push({ role: 'assistant', content: assistant });
      console.log(`\n${assistant}\n`);
      if (showUsage && res && res.usage) {
        const u = res.usage;
        const model = res.model || (cfg.openai && cfg.openai.modelPrimary) || 'gpt-4o-mini';
        const cost = estimateCostUSD(model, u);
        const parts = [`model=${model}`, `prompt=${u.prompt_tokens||0}`, `completion=${u.completion_tokens||0}`, `total=${u.total_tokens||0}`];
        if (cost != null) parts.push(`est_cost=$${cost.toFixed(6)}`);
        console.log(chalk.gray(`[usage] ${parts.join('  ')}`));
      }
    } catch (err) {
      // 온라인 전용: 실패 시 즉시 오류 메시지를 안내하고 템플릿만 제한적으로 제공
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
        const errMsg = (err && err.message) ? `\n[오류] ${err.message}` : '';
        fallback = `[온라인 오류] ${(currentMode?.name || '')} 모드 응답 불가: ${text}${errMsg}`.trim();
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

// 간단 비용 추정(대략): 모델별 입력/출력 단가(USD per token)
function estimateCostUSD(model, usage) {
  if (!usage) return null;
  const name = String(model || '').toLowerCase();
  const PRICING = [
    { match: /gpt-4o-mini/, inPTok: 0.15/1e6, outPTok: 0.60/1e6 },
  ];
  const p = PRICING.find(p => p.match.test(name));
  if (!p) return null;
  const pin = (usage.prompt_tokens||0) * p.inPTok;
  const pout = (usage.completion_tokens||0) * p.outPTok;
  return pin + pout;
}

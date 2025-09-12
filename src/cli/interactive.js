const readline = require('readline');
const chalk = require('chalk');
const { loadConfig, saveUserConfig, hasUserConfig } = require('../config');
const path = require('path');
const { writeFileSafe } = require('../utils/fs');
const { spawn } = require('child_process');
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

    // 언어/요청 감지
    function detectLang(t) {
      const s = t.toLowerCase();
      if (/(python|파이썬|py)/.test(s)) return 'python';
      if (/(kotlin|코틀린|kt)/.test(s)) return 'kotlin';
      if (/(java|자바)/.test(s)) return 'java';
      if (/(\bc\+\+\b|cpp|c\+\+)/.test(s)) return 'cpp';
      if (/(\bc\b|c언어)/.test(s)) return 'c';
      if (/(typescript|ts)/.test(s)) return 'ts';
      if (/(javascript|자바스크립트|js)/.test(s)) return 'js';
      return null;
    }

    function isGugudan(t) {
      const s = t.toLowerCase();
      return /(구구\s*단|구구돈|gugudan|multiplication\s*table)/.test(s);
    }

    function isExceptionReq(t) {
      const s = t.toLowerCase();
      return /(예외\s*처리|예외|try\s*-?\s*catch|exception|오류\s*처리|error\s*handling)/.test(s);
    }

    function randomName(ext) {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      let base = '';
      for (let i = 0; i < 8; i++) base += letters[Math.floor(Math.random() * letters.length)];
      return `${base}.${ext}`;
    }

    function nextAvailableFile(dir, base, ext) {
      const sanitize = (s) => s.replace(/[^A-Za-z0-9_\-]/g, '_');
      let b = sanitize(base);
      let candidate = path.join(dir, `${b}.${ext}`);
      if (!require('fs').existsSync(candidate)) return candidate;
      let i = 2;
      while (true) {
        candidate = path.join(dir, `${b}-${i}.${ext}`);
        if (!require('fs').existsSync(candidate)) return candidate;
        i++;
      }
    }

    function langToExt(lang) {
      switch (lang) {
        case 'python': return 'py';
        case 'java': return 'java';
        case 'kotlin': return 'kt';
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'js': return 'mjs';
        case 'ts': return 'ts';
        default: return 'txt';
      }
    }

    function gugudanCode(lang, fname) {
      const base = fname.replace(/\.[^.]+$/, '');
      const javaClass = base.length ? (base[0].toUpperCase() + base.slice(1)) : 'Main';
      switch (lang) {
        case 'python':
          return [
            `# ${fname} - 파이썬 구구단 (1~9)`,
            `# 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `def main():  # 프로그램의 시작점이 되는 함수 정의`,
            `    for i in range(1, 10):  # i는 1부터 9까지(행에 해당)`,
            `        line = []  # 한 줄에 출력할 문자열들을 담을 리스트`,
            `        for j in range(1, 10):  # j는 1부터 9까지(열에 해당)`,
            `            line.append(f"{i} x {j} = {i*j}")  # f-문자열로 'i x j = 결과' 형태 추가`,
            `        print('   '.join(line))  # 리스트를 공백 3칸으로 이어서 한 줄로 출력`,
            `
            `,
            `if __name__ == "__main__":  # 이 파일을 직접 실행했을 때만`,
            `    main()  # main() 함수를 호출하여 프로그램 시작`
          ].join('\n');
        case 'java':
          return [
            `// ${fname} - 자바 구구단 (1~9)`,
            `// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `public class ${javaClass} {  // 클래스 이름은 파일명과 동일해야 합니다`,
            `    public static void main(String[] args) {  // 자바 프로그램의 진입점`,
            `        for (int i = 1; i <= 9; i++) {  // i는 1부터 9까지(행)`,
            `            StringBuilder line = new StringBuilder();  // 한 줄을 담을 버퍼`,
            `            for (int j = 1; j <= 9; j++) {  // j는 1부터 9까지(열)`,
            `                line.append(i).append(" x ").append(j).append(" = ")`,
            `                    .append(i*j);  // 'i x j = 결과' 이어 붙이기`,
            `                if (j < 9) line.append("   ");  // 항목 사이 간격 3칸`,
            `            }`,
            `            System.out.println(line.toString());  // 한 줄 출력`,
            `        }`,
            `    }`,
            `}`
          ].join('\n');
        case 'kotlin':
          return [
            `// ${fname} - 코틀린 구구단 (1~9)`,
            `// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `fun main() {  // 코틀린 프로그램의 진입점`,
            `    for (i in 1..9) {  // i는 1부터 9까지(행)`,
            `        val parts = mutableListOf<String>()  // 한 줄을 구성할 문자열 목록`,
            `        for (j in 1..9) {  // j는 1부터 9까지(열)`,
            `            parts.add("$i x $j = ${i*j}")  // 문자열 템플릿으로 항목 추가`,
            `        }`,
            `        println(parts.joinToString("   "))  // 항목 사이 간격 3칸`,
            `    }`,
            `}`
          ].join('\n');
        case 'c':
          return [
            `// ${fname} - C 언어 구구단 (1~9)`,
            `// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `#include <stdio.h>  // 표준 입출력을 사용하기 위한 헤더`,
            `int main(void) {  // C 프로그램의 시작점`,
            `    for (int i = 1; i <= 9; i++) {  // i는 1부터 9까지(행)`,
            `        for (int j = 1; j <= 9; j++) {  // j는 1부터 9까지(열)`,
            `            printf("%d x %d = %d", i, j, i*j);  // 'i x j = 결과' 출력`,
            `            if (j < 9) printf("   ");  // 항목 사이 간격 3칸`,
            `        }`,
            `        printf("\n");  // 줄바꿈`,
            `    }`,
            `    return 0;  // 정상 종료`,
            `}`
          ].join('\n');
        case 'cpp':
          return [
            `// ${fname} - C++ 구구단 (1~9)`,
            `// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `#include <bits/stdc++.h>  // 편의를 위한 헤더(온라인 저지 스타일)`,
            `using namespace std;`,
            `int main(){  // C++ 프로그램의 시작점`,
            `    for(int i=1;i<=9;i++){  // i는 1부터 9까지(행)`,
            `        vector<string> parts;  // 한 줄을 구성할 문자열 벡터`,
            `        for(int j=1;j<=9;j++){  // j는 1부터 9까지(열)`,
            `            parts.push_back(to_string(i)+" x "+to_string(j)+" = "+to_string(i*j));  // 항목 추가`,
            `        }`,
            `        for(size_t k=0;k<parts.size();k++){  // 항목 출력`,
            `            cout << parts[k];`,
            `            if (k+1<parts.size()) cout << "   ";  // 간격 3칸`,
            `        }`,
            `        cout << "\n";  // 줄바꿈`,
            `    }`,
            `    return 0;  // 정상 종료`,
            `}`
          ].join('\n');
        case 'js':
          return [
            `// ${fname} - 자바스크립트(Node.js) 구구단 (1~9)`,
            `// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `for (let i = 1; i <= 9; i++) {  // i는 1부터 9까지(행)`,
            `  const parts = [];  // 한 줄을 구성할 문자열 배열`,
            `  for (let j = 1; j <= 9; j++) {  // j는 1부터 9까지(열)`,
            `    parts.push(\`${'${i}'} x ${'${j}'} = ${'${i*j}'}\`);  // 템플릿 문자열로 항목 추가`,
            `  }`,
            `  console.log(parts.join('   '));  // 항목 사이 간격 3칸`,
            `}`
          ].join('\n');
        case 'ts':
          return [
            `// ${fname} - 타입스크립트 구구단 (1~9)`,
            `// 각 줄에 1부터 9까지의 곱셈 결과를 보기 좋게 출력합니다.`,
            `for (let i: number = 1; i <= 9; i++) {  // i는 1부터 9까지(행)`,
            `  const parts: string[] = [];  // 한 줄을 구성할 문자열 배열`,
            `  for (let j: number = 1; j <= 9; j++) {  // j는 1부터 9까지(열)`,
            `    parts.push(\`${'${i}'} x ${'${j}'} = ${'${i*j}'}\`);  // 템플릿 문자열로 항목 추가`,
            `  }`,
            `  console.log(parts.join('   '));  // 항목 사이 간격 3칸`,
            `}`
          ].join('\n');
        default:
          return `# ${fname} - 구구단 예제 코드 (지원 언어 아님)`;
      }
    }

    function exceptionCode(lang, fname) {
      const base = fname.replace(/\.[^.]+$/, '');
      const javaClass = base.length ? (base[0].toUpperCase() + base.slice(1)) : 'Main';
      switch (lang) {
        case 'java':
          return [
            `// ${fname} - 자바 예외 처리 예제`,
            `// 파일 읽기 과정에서 발생할 수 있는 예외를 try-catch로 처리합니다.`,
            `import java.io.*;`,
            `public class ${javaClass} {`,
            `    public static void main(String[] args) {  // 진입점`,
            `        BufferedReader br = null;  // 파일을 줄 단위로 읽기 위한 리더`,
            `        try {  // 예외가 발생할 수 있는 구간`,
            `            br = new BufferedReader(new FileReader("input.txt"));  // 존재하지 않으면 FileNotFoundException`,
            `            String line = br.readLine();  // IO 예외 가능`,
            `            System.out.println("첫 줄: " + line);`,
            `        } catch (FileNotFoundException e) {  // 특정 예외 처리`,
            `            System.err.println("파일을 찾을 수 없습니다: " + e.getMessage());`,
            `        } catch (IOException e) {  // 그 외 입출력 예외 처리`,
            `            System.err.println("입출력 오류: " + e.getMessage());`,
            `        } finally {  // 예외 발생 여부와 상관없이 실행`,
            `            try { if (br != null) br.close(); } catch (IOException ignore) {}`,
            `        }`,
            `    }`,
            `}`
          ].join('\n');
        case 'kotlin':
          return [
            `// ${fname} - 코틀린 예외 처리 예제`,
            `// 파일 읽기 과정에서 발생할 수 있는 예외를 try-catch로 처리합니다.`,
            `import java.io.BufferedReader`,
            `import java.io.FileReader`,
            `import java.io.FileNotFoundException`,
            `import java.io.IOException`,
            `fun main() {  // 진입점`,
            `    var br: BufferedReader? = null  // 널 가능(나중에 닫기 위해 보관)`,
            `    try {  // 예외가 발생할 수 있는 구간`,
            `        br = BufferedReader(FileReader("input.txt"))  // 없으면 FileNotFoundException`,
            `        val line = br.readLine()  // IO 예외 가능`,
            `        println("첫 줄: $line")`,
            `    } catch (e: FileNotFoundException) {`,
            `        System.err.println("파일을 찾을 수 없습니다: ${'$'}{e.message}")`,
            `    } catch (e: IOException) {`,
            `        System.err.println("입출력 오류: ${'$'}{e.message}")`,
            `    } finally {`,
            `        try { br?.close() } catch (_: IOException) {}`,
            `    }`,
            `}`
          ].join('\n');
        case 'python':
          return [
            `# ${fname} - 파이썬 예외 처리 예제`,
            `# 파일 읽기 과정에서 발생할 수 있는 예외를 try-except로 처리합니다.`,
            `def main():  # 프로그램의 시작점`,
            `    try:  # 예외가 발생할 수 있는 구간`,
            `        with open('input.txt', 'r', encoding='utf-8') as f:  # 파일이 없으면 FileNotFoundError`,
            `            line = f.readline()  # 입출력 중 OSError 가능`,
            `        print('첫 줄:', line)`,
            `    except FileNotFoundError as e:  # 특정 예외 처리`,
            `        print('파일을 찾을 수 없습니다:', e)`,
            `    except OSError as e:  # 그 외 OS/IO 예외`,
            `        print('입출력 오류:', e)`,
            `
            `,
            `if __name__ == '__main__':  # 이 파일을 직접 실행했을 때만`,
            `    main()`
          ].join('\n');
        case 'js':
          return [
            `// ${fname} - 자바스크립트(Node.js) 예외 처리 예제`,
            `// 파일 읽기 과정에서 발생할 수 있는 예외를 try-catch로 처리합니다.`,
            `import { readFileSync } from 'fs';  // 동기 파일 읽기`,
            `try {  // 예외가 발생할 수 있는 구간`,
            `  const txt = readFileSync('input.txt', 'utf-8');  // 없으면 예외 발생`,
            `  console.log('첫 줄:', txt.split('\n')[0]);`,
            `} catch (e) {  // 모든 예외 포착`,
            `  console.error('파일 읽기 실패:', e.message);`,
            `} finally {  // 항상 실행되는 구간(정리 작업 등에 사용)`,
            `  // 리소스 정리 등이 필요할 때 사용`,
            `}`
          ].join('\n');
        case 'ts':
          return [
            `// ${fname} - 타입스크립트 예외 처리 예제`,
            `// 파일 읽기 과정에서 발생할 수 있는 예외를 try-catch로 처리합니다.`,
            `import { readFileSync } from 'fs';`,
            `try {`,
            `  const txt: string = readFileSync('input.txt', 'utf-8');`,
            `  console.log('첫 줄:', txt.split('\n')[0]);`,
            `} catch (e: any) {`,
            `  console.error('파일 읽기 실패:', e?.message ?? e);`,
            `} finally {`,
            `  // 리소스 정리 등이 필요할 때 사용`,
            `}`
          ].join('\n');
        case 'cpp':
          return [
            `// ${fname} - C++ 예외 처리 예제`,
            `// 파일 열기 실패 상황을 예외로 다루고 try-catch로 처리합니다.`,
            `#include <bits/stdc++.h>`,
            `using namespace std;`,
            `int main(){  // 진입점`,
            `    try {  // 예외가 발생할 수 있는 구간`,
            `        ifstream fin("input.txt");`,
            `        if (!fin.is_open()) throw runtime_error("파일을 열 수 없습니다");`,
            `        string line; getline(fin, line);`,
            `        cout << "첫 줄: " << line << "\n";`,
            `    } catch (const exception& e) {  // 표준 예외 처리`,
            `        cerr << "오류: " << e.what() << "\n";`,
            `    }`,
            `    return 0;`,
            `}`
          ].join('\n');
        case 'c':
          return [
            `// ${fname} - C 언어 오류 처리 예제`,
            `// C는 예외가 없으므로 반환값/errno로 오류를 처리합니다.`,
            `#include <stdio.h>`,
            `#include <errno.h>`,
            `#include <string.h>`,
            `int main(void){  // 진입점`,
            `    FILE* fp = fopen("input.txt", "r");  // 없으면 NULL 반환 및 errno 설정`,
            `    if (!fp) {`,
            `        fprintf(stderr, "파일 열기 실패: %s\n", strerror(errno));  // 상세 오류 메시지 출력`,
            `        return 1;  // 비정상 종료 코드`,
            `    }`,
            `    char buf[256]; if (fgets(buf, sizeof(buf), fp)) {`,
            `        printf("첫 줄: %s\n", buf);`,
            `    }`,
            `    fclose(fp);  // 자원 정리`,
            `    return 0;`,
            `}`
          ].join('\n');
        default:
          return `# ${fname} - 예외 처리 예제 (지원 언어 아님)`;
      }
    }

    async function createAndShowGugudan(lang) {
      const ext = langToExt(lang);
      const outDir = process.cwd();
      // 의미 있는 영어 파일명: multiplication_table (Java/Kotlin은 PascalCase)
      const base = (lang === 'java' || lang === 'kotlin') ? 'MultiplicationTable' : 'multiplication_table';
      const full = nextAvailableFile(outDir, base, ext);
      const fname = path.basename(full);
      const code = gugudanCode(lang, fname);
      await writeFileSafe(full, code);
      const display = [`파일 생성: ${full}`, '', code].join('\n');
      history.push({ role: 'assistant', content: display });
      console.log(`\n${display}\n`);
      tryOpenFile(full);
    }

    function maybeRenderPythonTemplate(t) {
      const s = t.toLowerCase();
      const isPython = /(python|파이썬|py)/.test(s);
      if (!isPython) return false;
      // 버블 정렬
      if (/(버블\s*정렬|bubble\s*sort)/.test(s)) {
        const outDir = process.cwd();
        const fname = path.basename(nextAvailableFile(outDir, 'bubble_sort', 'py'));
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
        const full = path.join(outDir, fname);
        return (async () => {
          await writeFileSafe(full, code);
          const display = [`파일 생성: ${full}`, '', code].join('\n');
          history.push({ role: 'assistant', content: display });
          console.log(`\n${display}\n`);
          tryOpenFile(full);
        })().then(() => true);
        return true;
      }
      // 피보나치
      if (/(피보나치|fibonacci)/.test(s)) {
        const outDir = process.cwd();
        const fname = path.basename(nextAvailableFile(outDir, 'fibonacci', 'py'));
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
        const full = path.join(outDir, fname);
        return (async () => {
          await writeFileSafe(full, code);
          const display = [`파일 생성: ${full}`, '', code].join('\n');
          history.push({ role: 'assistant', content: display });
          console.log(`\n${display}\n`);
          tryOpenFile(full);
        })().then(() => true);
        return true;
      }
      return false;
    }

    // 코드 요청(구구단 + 언어) 즉시 파일로 생성 후 표시
    if (isGugudan(text)) {
      const lang = detectLang(text) || 'python';
      history.push({ role: 'user', content: text });
      await createAndShowGugudan(lang);
      rl.prompt();
      return;
    }

    // 코드 요청(예외 처리 + 언어) 즉시 파일로 생성 후 표시
    if (isExceptionReq(text)) {
      const lang = detectLang(text) || 'java';
      const ext = langToExt(lang);
      const outDir = process.cwd();
      const fname = randomName(ext);
      const full = path.join(outDir, fname);
      const code = exceptionCode(lang, fname);
      await writeFileSafe(full, code);
      const display = [`파일 생성: ${full}`, '', code].join('\n');
      history.push({ role: 'assistant', content: display });
      console.log(`\n${display}\n`);
      tryOpenFile(full);
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

// VS Code를 우선 사용하고, 실패 시(Windows) 메모장, 그 외 OS 기본 앱으로 파일 열기
function tryOpenFile(file) {
  try {
    function spawnDetached(cmd, args = [], opts = {}) {
      const child = spawn(cmd, args, { detached: true, stdio: 'ignore', ...opts });
      // 에러 이벤트를 흡수하여 프로세스 크래시/콘솔 출력 방지
      child.on('error', () => {});
      child.unref();
      return child;
    }

    // 1) 사용자 지정 편집기 우선 (CT_EDITOR > EDITOR > VISUAL)
    const editorCmd = process.env.CT_EDITOR || process.env.EDITOR || process.env.VISUAL;
    if (editorCmd && typeof editorCmd === 'string') {
      // 인자 포함 가능하므로 shell 모드에서 전체 커맨드 실행
      const child = spawn(`${editorCmd} "${file}"`, { shell: true, detached: true, stdio: 'ignore' });
      child.on('error', () => {});
      child.unref();
      return true;
    }

    // 2) VS Code(또는 Insiders) 우선 시도 (항상 재사용/라인 열기 옵션)
    try {
      const c = spawnDetached('code', ['-r', '-g', file]);
      // code가 없을 때 ENOENT 등 발생 시: code-insiders → (win) notepad → 기본 앱 순으로 대체
      c.on('error', () => {
        try {
          const ci = spawnDetached('code-insiders', ['-r', '-g', file]);
          ci.on('error', () => {
            if (process.platform === 'win32') {
              try { spawnDetached('notepad', [file]); } catch (_) {}
            }
          });
        } catch (_) {
          if (process.platform === 'win32') {
            try { spawnDetached('notepad', [file]); } catch (_) {}
          }
        }
      });
      return true;
    } catch (_) {
      try {
        const ci = spawnDetached('code-insiders', ['-r', '-g', file]);
        ci.on('error', () => {
          if (process.platform === 'win32') {
            try { spawnDetached('notepad', [file]); } catch (_) {}
          }
        });
        return true;
      } catch (_) {}
    }

    // 3) 플랫폼별 기본 앱/메모장 (최후수단)
    const platform = process.platform;
    if (platform === 'win32') {
      // VS Code가 없는 경우, 메모장으로 열기
      try { spawnDetached('notepad', [file]); return true; } catch (_) {}
      const c = spawnDetached('cmd', ['/c', 'start', '', file]);
      return !!c;
    }
    if (platform === 'darwin') {
      spawnDetached('open', [file]);
      return true;
    }
    spawnDetached('xdg-open', [file]);
    return true;
  } catch (e) {
    // 열기 실패 시 조용히 무시하고 경로만 노출
    return false;
  }
}

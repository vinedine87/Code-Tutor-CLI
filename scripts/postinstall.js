#!/usr/bin/env node
const { execSync } = require('child_process');

function hasOllama() {
  try {
    execSync('ollama --version', { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

function osInfo() {
  const p = process.platform;
  if (p === 'win32') return 'win';
  if (p === 'darwin') return 'mac';
  return 'linux';
}

function printGuide() {
  const os = osInfo();
  console.log('\n[Code Tutor CLI] Ollama 미설치 감지됨. 설치 안내:');
  if (os === 'win') {
    console.log('- Windows: winget install Ollama.Ollama  (또는 https://ollama.com/download)');
  } else if (os === 'mac') {
    console.log('- macOS:   brew install ollama  (또는 https://ollama.com/download)');
  } else {
    console.log('- Linux:   curl -fsSL https://ollama.com/install.sh | sh');
  }
  console.log("설치 후 'ollama serve'를 실행하고, 필요한 모델을 받아주세요. 예: ollama pull qwen2:7b\n");
}

try {
  if (!hasOllama()) printGuide();
} catch (e) {
  // 메시지만 출력하고 실패하지 않음
}


const fs = require('fs');
const path = require('path');
const { ensureDirSafe, writeFileSafe } = require('../utils/fs');

function mainFileFor(lang, baseName = 'main') {
  switch (lang) {
    case 'python':
      return `${baseName}.py`;
    case 'javascript':
    case 'js':
      return `${baseName}.mjs`;
    case 'java':
      return `${capitalizeJavaBase(baseName || 'Main')}.java`;
    case 'c':
      return `${baseName}.c`;
    case 'cpp':
      return `${baseName}.cpp`;
    default:
      return `${baseName}.txt`;
  }
}

function capitalizeJavaBase(name) {
  if (!name) return 'Main';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function boilerplate(lang, title = 'Example') {
  switch (lang) {
    case 'python':
      return `# ${title}\n\n# 예시: 최대값 출력\nnums = [3, 8, 2]\nprint(max(nums))\n`;
    case 'javascript':
    case 'js':
      return `// ${title}\n// 실행: node main.mjs\nconst nums = [3, 8, 2];\nconsole.log(Math.max(...nums));\n`;
    case 'c':
      return `// ${title}\n#include <stdio.h>\nint main(){int a[3]={3,8,2};int m=a[0];for(int i=1;i<3;i++)if(a[i]>m)m=a[i];printf("%d\n",m);return 0;}\n`;
    case 'cpp':
      return `// ${title}\n#include <bits/stdc++.h>\nusing namespace std;int main(){vector<int> v={3,8,2};cout<<*max_element(v.begin(),v.end())<<"\n";}\n`;
    case 'java':
      return `// ${title}\npublic class Main{public static void main(String[] args){int[] a={3,8,2};int m=a[0];for(int i=1;i<a.length;i++)if(a[i]>m)m=a[i];System.out.println(m);}}\n`;
    default:
      return `${title}\n`;
  }
}

async function createRunnableLesson({ outDir, title, lang, explanation, baseName = 'main' }) {
  const fileName = mainFileFor(lang, baseName);
  if (!fs.existsSync(outDir)) await ensureDirSafe(outDir);
  await writeFileSafe(path.join(outDir, fileName), boilerplate(lang, title));
  const readme = `# ${title}\n\n${explanation || ''}\n\n## 실행\n- ${runHint(lang)}\n`;
  await writeFileSafe(path.join(outDir, 'README.md'), readme);
  return { outDir, file: path.join(outDir, fileName) };
}

async function writeCodeFile(outDir, lang, title, baseName = 'main') {
  const fileName = mainFileFor(lang, baseName);
  await writeFileSafe(path.join(outDir, fileName), boilerplate(lang, title));
  return path.join(outDir, fileName);
}

async function createRunnableBundle({ outDir, title, langs = [], explanation, baseName = 'main' }) {
  if (!Array.isArray(langs) || langs.length === 0) throw new Error('langs 배열이 필요합니다');
  if (!fs.existsSync(outDir)) await ensureDirSafe(outDir);
  const files = [];
  for (const l of langs) {
    const f = await writeCodeFile(outDir, l, title, baseName);
    files.push({ lang: l, file: f });
  }
  const lines = [];
  lines.push(`# ${title}`);
  if (explanation) lines.push('', explanation.trim());
  lines.push('', '## 실행');
  for (const l of langs) {
    lines.push(`- ${l}: ${runHint(l)}`);
  }
  await writeFileSafe(path.join(outDir, 'README.md'), lines.join('\n'));
  return { outDir, files };
}

function runHint(lang) {
  switch (lang) {
    case 'python':
      return 'python main.py';
    case 'javascript':
    case 'js':
      return 'node main.mjs';
    case 'c':
      return 'gcc -O2 -std=c11 -o main main.c && ./main';
    case 'cpp':
      return 'g++ -O2 -std=c++17 -o main main.cpp && ./main';
    case 'java':
      return 'javac Main.java && java Main';
    default:
      return '실행 방법을 확인하세요';
  }
}

module.exports = { createRunnableLesson, createRunnableBundle, writeCodeFile, runHint, mainFileFor };

#!/usr/bin/env node
// 이미지에 격자와 좌표 라벨을 얹어 좌표 지정 도움 제공
// 사용: node scripts/image-grid.js --input image.png --output image.grid.png --step 50

const sharp = require('sharp');
const fs = require('fs');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else { args[key] = true; }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const input = args.input || 'image.png';
  const output = args.output || 'image.grid.png';
  const step = Math.max(20, parseInt(args.step || '50', 10));
  if (!fs.existsSync(input)) {
    console.error(`입력 파일 없음: ${input}`);
    process.exit(1);
  }
  const meta = await sharp(input).metadata();
  const { width, height } = meta;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="none"/>`;
  // grid lines
  for (let x = 0; x <= width; x += step) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#00FFFF" stroke-width="1" opacity="0.35"/>`;
    svg += `<text x="${x + 2}" y="12" font-size="12" fill="#00FFFF" opacity="0.7">x=${x}</text>`;
  }
  for (let y = 0; y <= height; y += step) {
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#00FFFF" stroke-width="1" opacity="0.35"/>`;
    svg += `<text x="2" y="${y - 2}" font-size="12" fill="#00FFFF" opacity="0.7">y=${y}</text>`;
  }
  svg += `</svg>`;
  const overlay = Buffer.from(svg);

  await sharp(input).composite([{ input: overlay, left: 0, top: 0 }]).toFile(output);
  console.log(`완료: ${output} (step=${step}px)`);
}

main().catch(err => { console.error(err); process.exit(1); });


#!/usr/bin/env node
// Simple branding overlay: detect yellow highlight region and replace with brand yellow + text
// Usage:
//   node scripts/brand-image.js --text "Your Phrase" --color "#FFC107" --input image.png --output image.final.png
//   수동 좌표: --x 100 --y 200 --w 800 --h 120
//   디버그 마스크 출력: --debug

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function toHexColor(c) {
  if (!c) return null;
  const s = String(c).trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return s;
  // Basic named color fallback map
  const map = { yellow: '#FFFF00', black: '#000000', white: '#FFFFFF' };
  if (map[s.toLowerCase()]) return map[s.toLowerCase()];
  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  const input = args.input || 'image.png';
  const output = args.output || 'image.final.png';
  const text = args.text || '';
  const color = toHexColor(args.color) || '#FFC107';
  const textColor = toHexColor(args.textColor) || '#111111';

  if (!fs.existsSync(input)) {
    console.error(`Input not found: ${input}`);
    process.exit(1);
  }

  const image = sharp(input);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels should be 4

  // RGB -> HSV 변환 및 노란색 판정
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  }

  function isYellow(r, g, b) {
    const { h, s, v } = rgbToHsv(r, g, b);
    // 매우 관대한 하이라이트 후보: H 0~120, S >= 0.02, V >= 0.3
    return (h >= 0 && h <= 120 && s >= 0.02 && v >= 0.3);
  }

  const visited = new Uint8Array(width * height);
  const mask = new Uint8Array(width * height);
  let yellowCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx + 0];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isYellow(r, g, b)) {
        mask[y * width + x] = 1;
        yellowCount++;
      }
    }
  }

  // 마스크 닫힘(클로징): 팽창 2회 후 침식 2회로 구멍 메우기
  function dilate(src) {
    const dst = new Uint8Array(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let on = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (src[ny * width + nx]) { on = 1; break; }
          }
          if (on) break;
        }
        dst[y * width + x] = on;
      }
    }
    return dst;
  }

  function erode(src) {
    const dst = new Uint8Array(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let on = 1;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) { on = 0; break; }
            if (!src[ny * width + nx]) { on = 0; break; }
          }
          if (!on) break;
        }
        dst[y * width + x] = on;
      }
    }
    return dst;
  }

  if (yellowCount > 0) {
    let m = mask;
    m = dilate(m); m = dilate(m);
    m = erode(m); m = erode(m);
    m.forEach((v, i) => { mask[i] = v; });
  }

  // Find largest connected yellow component (4-neighborhood)
  function findLargestComponent() {
    let best = { area: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const stack = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (mask[i] && !visited[i]) {
          let area = 0;
          let minX = x, minY = y, maxX = x, maxY = y;
          stack.length = 0;
          stack.push(i);
          visited[i] = 1;
          while (stack.length) {
            const p = stack.pop();
            const py = Math.floor(p / width);
            const px = p - py * width;
            area++;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
            // neighbors 4-way
            const neighbors = [p - 1, p + 1, p - width, p + width];
            for (const n of neighbors) {
              if (n < 0 || n >= width * height) continue;
              const ny = Math.floor(n / width);
              const nx = n - ny * width;
              if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue; // ensure 4-neigh
              if (!visited[n] && mask[n]) {
                visited[n] = 1;
                stack.push(n);
              }
            }
          }
          if (area > best.area) best = { area, minX, minY, maxX, maxY };
        }
      }
    }
    return best;
  }

  let rect;
  // 수동 좌표 우선
  if (args.x && args.y && args.w && args.h) {
    rect = {
      x: Math.max(0, parseInt(args.x, 10) || 0),
      y: Math.max(0, parseInt(args.y, 10) || 0),
      w: Math.max(1, parseInt(args.w, 10) || 1),
      h: Math.max(1, parseInt(args.h, 10) || 1),
    };
  }

  // 2단계: 행 히스토그램 기반 가로 밴드 탐색
  if (!rect && yellowCount > 50) {
    const rowCounts = new Array(height).fill(0);
    for (let y = 0; y < height; y++) {
      let c = 0;
      for (let x = 0; x < width; x++) c += mask[y * width + x];
      rowCounts[y] = c;
    }
    const rowThreshold = Math.max(10, Math.floor(width * 0.15));
    let bestStart = -1, bestEnd = -1, bestLen = 0;
    let curStart = -1;
    for (let y = 0; y < height; y++) {
      const on = rowCounts[y] >= rowThreshold;
      if (on && curStart === -1) curStart = y;
      if (!on && curStart !== -1) {
        const len = y - curStart;
        if (len > bestLen) { bestLen = len; bestStart = curStart; bestEnd = y - 1; }
        curStart = -1;
      }
    }
    if (curStart !== -1) {
      const len = height - curStart;
      if (len > bestLen) { bestLen = len; bestStart = curStart; bestEnd = height - 1; }
    }

    if (bestLen >= Math.max(20, Math.floor(height * 0.04))) {
      // 좌우 범위 계산
      let minX = width - 1, maxX = 0;
      for (let y = bestStart; y <= bestEnd; y++) {
        let rowMin = width - 1, rowMax = 0;
        for (let x = 0; x < width; x++) {
          if (mask[y * width + x]) { if (x < rowMin) rowMin = x; if (x > rowMax) rowMax = x; }
        }
        if (rowMax >= rowMin) { if (rowMin < minX) minX = rowMin; if (rowMax > maxX) maxX = rowMax; }
      }
      if (maxX > minX) {
        const w = maxX - minX + 1;
        const h = bestEnd - bestStart + 1;
        rect = { x: minX, y: bestStart, w, h };
      }
    }
  }

  // 3단계: 연결요소 기반
  if (!rect && yellowCount > 50) {
    const best = findLargestComponent();
    const minArea = Math.max(1200, Math.floor(width * height * 0.01));
    const w = Math.max(1, best.maxX - best.minX + 1);
    const h = Math.max(1, best.maxY - best.minY + 1);
    const aspect = w / h;
    const centerY = (best.minY + best.maxY) / 2;
    const centerBandOK = centerY >= height * 0.1 && centerY <= height * 0.95;
    if (best.area >= minArea && aspect >= 2.2 && h <= height * 0.5 && centerBandOK) {
      rect = { x: best.minX, y: best.minY, w, h };
    }
  }

  if (!rect) {
    // Fallback: middle band rectangle (80% width, 16% height)
    const w = Math.floor(width * 0.8);
    const h = Math.floor(height * 0.16);
    const x = Math.floor((width - w) / 2);
    const y = Math.floor(height * 0.42);
    rect = { x, y, w, h };
  }

  // Build SVG overlay with brand yellow background and centered text
  const pad = Math.round(Math.min(rect.w, rect.h) * 0.08);
  const innerW = Math.max(1, rect.w - pad * 2);
  const innerH = Math.max(1, rect.h - pad * 2);
  // 폭에 맞춰 글자 크기 자동 조정(대략적) + 더 크게
  const approxCharWidth = 0.58; // fontSize 대비 평균 폭 비율 추정
  const maxByHeight = Math.floor(innerH * 0.72);
  const maxByWidth = text ? Math.floor(innerW / Math.max(1, (text.length * approxCharWidth))) : maxByHeight;
  const fontSize = Math.max(12, Math.min(maxByHeight, maxByWidth));
  const rx = 0; // 스크린샷 스타일: 직각 모서리

  const escapedText = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${rect.w}" height="${rect.h}" viewBox="0 0 ${rect.w} ${rect.h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'BrandFallback';
        src: local('Inter'), local('Arial'), local('Helvetica'), local('Noto Sans'), local('Apple SD Gothic Neo');
      }
    </style>
  </defs>
  <rect x="0" y="0" width="${rect.w}" height="${rect.h}" fill="${color}" rx="${rx}" ry="${rx}" />
  ${escapedText ? `<foreignObject x="${pad}" y="${pad}" width="${innerW}" height="${innerH}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${textColor};font-family:BrandFallback, Arial, sans-serif;font-weight:700;font-size:${fontSize}px;line-height:1.1;text-align:center;">
      <span style="display:block;">${escapedText}</span>
    </div>
  </foreignObject>` : ''}
</svg>`;

  const overlay = Buffer.from(svg);

  const pipeline = sharp(input).composite([{ input: overlay, left: rect.x, top: rect.y }]);
  await pipeline.toFile(output);

  console.log(`Done. Wrote ${output}`);
  const mode = args.x ? 'manual' : (yellowCount>50 ? 'detected' : 'fallback');
  console.log(`Rect used: x=${rect.x}, y=${rect.y}, w=${rect.w}, h=${rect.h} (${mode}); color=${color}`);

  if (args.debug) {
    // 마스크 이미지 저장
    const maskRGBA = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const on = mask[i] ? 255 : 0;
      maskRGBA[i*4+0] = on; // R
      maskRGBA[i*4+1] = on; // G
      maskRGBA[i*4+2] = 0;  // B
      maskRGBA[i*4+3] = 120; // A
    }
    await sharp(maskRGBA, { raw: { width, height, channels: 4 }})
      .png()
      .toFile(output.replace(/\.png$/i, '.mask.png'));
    console.log('Debug mask saved.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
// Simple branding overlay: detect yellow highlight region and replace with brand yellow + text
// Usage: node scripts/brand-image.js --text "Your Phrase" --color "#FFC107" --input image.png --output image.final.png

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

  // Threshold for yellow detection (tuned for typical highlight)
  function isYellow(r, g, b) {
    return (
      r >= 200 && g >= 180 && b <= 140 &&
      Math.abs(r - g) <= 70 && // r and g similar
      r >= b + 60 && g >= b + 40
    );
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
  if (yellowCount > 100) {
    const best = findLargestComponent();
    if (best.area > 100) {
      rect = {
        x: best.minX,
        y: best.minY,
        w: Math.max(1, best.maxX - best.minX + 1),
        h: Math.max(1, best.maxY - best.minY + 1),
      };
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
  const fontSize = Math.max(12, Math.floor(innerH * 0.6));
  const rx = Math.round(Math.min(rect.w, rect.h) * 0.12);

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

  await sharp(input)
    .composite([{ input: overlay, left: rect.x, top: rect.y }])
    .toFile(output);

  console.log(`Done. Wrote ${output}`);
  console.log(`Rect used: x=${rect.x}, y=${rect.y}, w=${rect.w}, h=${rect.h}${yellowCount>100? ' (detected)': ' (fallback)'}; color=${color}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


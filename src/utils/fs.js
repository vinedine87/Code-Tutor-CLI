const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) + '-' +
    pad(d.getHours()) + pad(d.getMinutes())
  );
}

async function ensureDirSafe(dir, { overwrite = false } = {}) {
  if (fs.existsSync(dir)) {
    if (!overwrite) throw new Error(`경로가 이미 존재합니다: ${dir} (--overwrite 필요)`);
    await fse.emptyDir(dir);
  } else {
    await fse.mkdirp(dir);
  }
}

async function writeFileSafe(file, content) {
  await fse.mkdirp(path.dirname(file));
  await fse.writeFile(file, content);
}

module.exports = { slugify, timestamp, ensureDirSafe, writeFileSafe };


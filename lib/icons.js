const fs = require('fs');
const path = require('path');
const { COLORS } = require('./utils');

const ICONS_DIR = path.join(__dirname, '..', 'node_modules', 'simple-icons', 'icons');

const ICON_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'simple-icons', 'data', 'simple-icons.json'), 'utf8')
);

// simple-icons svg 파일에서 path와 공식 브랜드 색상(hex) 추출
function getIconInfo(slug) {
  // slug는 영문 소문자/숫자만 허용 (path traversal 방어)
  if (!/^[a-z0-9]+$/.test(slug)) return null;
  const file = path.join(ICONS_DIR, `${slug}.svg`);
  if (!fs.existsSync(file)) return null;
  const svg = fs.readFileSync(file, 'utf8');
  const match = svg.match(/<path d="([^"]+)"/);
  if (!match) return null;
  const meta = ICON_DATA.find((i) => i.slug === slug);
  return {
    path: match[1],
    color: meta ? `#${meta.hex}` : COLORS.light.fg,
  };
}

module.exports = { getIconInfo };
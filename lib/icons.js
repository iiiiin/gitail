const fs = require('fs');
const path = require('path');
const { COLORS } = require('./utils');

const ICONS_DIR = path.join(__dirname, '..', 'node_modules', 'simple-icons', 'icons');

const ICON_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'simple-icons', 'data', 'simple-icons.json'), 'utf8')
);

// slug -> 메타데이터 조회를 O(1)로 만들기 위한 인덱스 (모듈 로드 시 1회만 구성)
const ICON_META_BY_SLUG = new Map(ICON_DATA.map((i) => [i.slug, i]));

// 한 번 읽은 아이콘 결과를 재사용하기 위한 메모리 캐시.
// 같은 함수 인스턴스가 여러 요청을 처리하는(warm) 동안 디스크 I/O를 줄여준다.
const iconCache = new Map();

// simple-icons svg 파일에서 path와 공식 브랜드 색상(hex) 추출
function getIconInfo(slug) {
  if (iconCache.has(slug)) return iconCache.get(slug);

  // slug는 영문 소문자/숫자만 허용 (path traversal 방어)
  if (!/^[a-z0-9]+$/.test(slug)) {
    iconCache.set(slug, null);
    return null;
  }

  const file = path.join(ICONS_DIR, `${slug}.svg`);
  if (!fs.existsSync(file)) {
    iconCache.set(slug, null);
    return null;
  }

  const svg = fs.readFileSync(file, 'utf8');
  const match = svg.match(/<path d="([^"]+)"/);
  if (!match) {
    iconCache.set(slug, null);
    return null;
  }

  const meta = ICON_META_BY_SLUG.get(slug);
  const result = {
    path: match[1],
    color: meta ? `#${meta.hex}` : COLORS.light.fg,
  };
  iconCache.set(slug, result);
  return result;
}

module.exports = { getIconInfo };
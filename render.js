const { generateFlagSVG } = require('./lib/styles/flag');
const { generateStairsSVG } = require('./lib/styles/stairs');
const { getIconInfo } = require('./lib/icons');
const { dateToX } = require('./lib/utils');

function generateSVG(data, style = 'flag') {
  const MAX_ITEMS = 5;
  let items = data.items || [];
  if (items.length === 0) {
    return `<svg width="680" height="160" viewBox="0 0 680 160" xmlns="http://www.w3.org/2000/svg"><text x="40" y="80" font-size="14">No items</text></svg>`;
  }

  // 5개 초과 시 날짜 기준 최신 5개만 사용
  if (items.length > MAX_ITEMS) {
    items = [...items].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_ITEMS);
  }

  if (style === 'stairs') {
    // 계단 스타일은 시간순(왼쪽이 오래된 것)으로만 정렬하면 충분
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
    return generateStairsSVG(sorted);
  }

  return generateFlagSVG(items);
}

module.exports = { generateSVG, getIconInfo, dateToX };
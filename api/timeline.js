const { generateSVG } = require('../render');

const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';

function isMobileUA(ua = '') {
  return /Mobile|Android|iPhone|iPad/i.test(ua);
}

// ?items=2025-08,react,코코의숲|2025-11,flutter,pawprint
// 선택적 색상: 2025-08,react,코코의숲,#61DAFB
function parseItemsParam(itemsStr) {
  if (!itemsStr) throw new Error('missing items parameter. usage: ?items=YYYY-MM,icon,title|...');
  const items = itemsStr.split('|').map((seg) => {
    const parts = seg.trim().split(',');
    if (parts.length < 3) throw new Error(`invalid item: "${seg}" (expected YYYY-MM,icon,title)`);
    const [date, icon, title, color] = parts;
    if (!/^\d{4}-\d{2}$/.test(date.trim())) throw new Error(`invalid date: "${date}" (expected YYYY-MM)`);
    return {
      date: date.trim(),
      icon: icon.trim(),
      title: title.trim(),
      ...(color ? { color: color.trim() } : {}),
    };
  });
  return { items };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const ua = req.headers['user-agent'] || '';
  if (isMobileUA(ua)) {
    return res.status(200).send(EMPTY_SVG);
  }

  try {
    const data = parseItemsParam((req.query || {}).items);
    const svg = generateSVG(data);
    return res.status(200).send(svg);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><!-- error: ${String(err.message).replace(/--/g, '-')} --></svg>`
    );
  }
};
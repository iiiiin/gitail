const { generateSVG } = require('../render');
const fetch = require('node-fetch');

const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';

function isMobileUA(ua = '') {
  return /Mobile|Android|iPhone|iPad/i.test(ua);
}

// gist ID 또는 raw URL에서 첫 번째 JSON 파일 내용을 가져옴
async function fetchTimelineData(query) {
  let url;
  if (query.url) {
    url = query.url; // 직접 raw URL 지정
  } else if (query.gist) {
    // Gist API로 파일 목록 조회 후 .json 파일의 raw_url 사용
    const apiRes = await fetch(`https://api.github.com/gists/${query.gist}`);
    if (!apiRes.ok) throw new Error('gist not found');
    const gistData = await apiRes.json();
    const files = Object.values(gistData.files || {});
    const jsonFile = files.find((f) => f.filename.endsWith('.json'));
    if (!jsonFile) throw new Error('no json file in gist');
    url = jsonFile.raw_url;
  } else {
    throw new Error('missing gist or url parameter');
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('failed to fetch data');
  return res.json();
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const ua = req.headers['user-agent'] || '';
  if (isMobileUA(ua)) {
    return res.status(200).send(EMPTY_SVG);
  }

  try {
    const data = await fetchTimelineData(req.query || {});
    const svg = generateSVG(data);
    return res.status(200).send(svg);
  } catch (err) {
    // 에러 시 빈 SVG + 주석으로 디버그 정보 (캐시는 짧게)
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><!-- error: ${String(err.message).replace(/--/g, '-')} --></svg>`);
  }
};

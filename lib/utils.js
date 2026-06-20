// 두 스타일이 공유하는 색상 팔레트 (라이트/다크)
const COLORS = {
    light: {
      fg: '#1a1a1a',
      bg: '#ffffff',
      muted: '#888780',
      line: '#6e6d68',
    },
    dark: {
      fg: '#e8e8e8',
      bg: '#2b2b2b',
      muted: '#9a9a9a',
      line: '#6e6d68',
      label: '#f0f0f0',
    },
  };
  
  const FONT_FAMILY = "-apple-system, 'Segoe UI', 'Noto Sans KR', Helvetica, Arial, sans-serif";
  
  // SVG 문서 전체를 감싸는 공통 wrapper (width/height/viewBox/font, body는 각 스타일이 채움)
  function wrapSVG(width, height, body) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" color="${COLORS.light.fg}">
  ${body}
  </svg>`;
  }
  
  // "YYYY-MM" -> "YYYY.MM" 라벨
  function formatDateLabel(dateStr) {
    const [year, month] = dateStr.split('-');
    return `${year}.${month}`;
  }
  
  // 마크업 인젝션 방지를 위한 텍스트 이스케이프
  function escapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }
  
  // "YYYY-MM" -> x좌표 변환 (트랙 범위 내 비례 배치)
  function dateToX(dateStr, allDates, trackStart, trackEnd) {
    const toMonths = (d) => {
      const [y, m] = d.split('-').map(Number);
      return y * 12 + m;
    };
    const values = allDates.map(toMonths);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1); // 0 division 방지
    const ratio = (toMonths(dateStr) - min) / span;
    return Math.round((trackStart + ratio * (trackEnd - trackStart)) * 10) / 10;
  }
  
  // 텍스트의 픽셀 폭 추정 (한글/전각 11px, 영문/숫자 5.5px 가정)
  function estimateTextWidth(title) {
    let textWidth = 0;
    for (const ch of title) {
      textWidth += /[\u3000-\u9fff\uac00-\ud7a3]/.test(ch) ? 11 : 5.5;
    }
    return textWidth;
  }
  
  module.exports = {
    COLORS,
    FONT_FAMILY,
    wrapSVG,
    formatDateLabel,
    escapeText,
    dateToX,
    estimateTextWidth,
  };
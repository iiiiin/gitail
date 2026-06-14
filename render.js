const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'node_modules', 'simple-icons', 'icons');

const ICON_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'node_modules', 'simple-icons', 'data', 'simple-icons.json'), 'utf8')
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
    color: meta ? `#${meta.hex}` : '#1a1a1a',
  };
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

const TRACK_Y = 120;
const TRACK_START = 60;
const TRACK_END = 540;
const ICON_BOX = 24;

// 항목의 핀 너비 추정 (충돌 감지 및 렌더링 양쪽에서 사용)
function estimatePinW(title) {
  let textWidth = 0;
  for (const ch of title) {
    textWidth += /[\u3000-\u9fff\uac00-\ud7a3]/.test(ch) ? 11 : 5.5;
  }
  const padding = 8;
  const iconSize = 24 * 0.55;
  const iconTextGap = 6;
  return Math.round(padding + iconSize + iconTextGap + textWidth + padding);
}

function buildPin(item, x, side) {
  const iconInfo = getIconInfo(item.icon);
  const iconColor = item.color || (iconInfo ? iconInfo.color : '#1a1a1a');
  const iconPath = iconInfo ? iconInfo.path : null;
  const titleEscaped = item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const [year, month] = item.date.split('-');
  const dateLabel = `${year}.${month}`;

  const padding = 8;
  const iconScale = 0.55;
  const iconSize = 24 * iconScale;
  const iconTextGap = 6;
  const pinW = estimatePinW(item.title);
  const pinH = 40;
  const gap = 14; // 트랙과 박스 사이 간격
  const tailLen = 10;

  const pinX = x - pinW / 2;
  const isUp = side === 'up';
  const pinY = isUp ? TRACK_Y - gap - pinH - tailLen : TRACK_Y + gap + tailLen;

  const iconX = pinX + padding;
  const rowCenterY = pinY + pinH / 2;
  const iconY = rowCenterY - iconSize / 2;
  const textX = iconX + iconSize + iconTextGap;

  // 박스(rounded rect)+꼬리를 하나의 외곽선 path로 결합
  // up: 꼬리가 아래(트랙 쪽)로, down: 꼬리가 위(트랙 쪽)로
  const r = 10;
  const left = pinX;
  const top = pinY;
  const right = pinX + pinW;
  const bottom = pinY + pinH;
  const tailHalf = 6;

  let balloonPath;
  if (isUp) {
    const tailTip = bottom + tailLen;
    balloonPath = `M${left + r} ${top}
      H${right - r} A${r} ${r} 0 0 1 ${right} ${top + r}
      V${bottom - r} A${r} ${r} 0 0 1 ${right - r} ${bottom}
      H${x + tailHalf}
      L${x} ${tailTip}
      L${x - tailHalf} ${bottom}
      H${left + r} A${r} ${r} 0 0 1 ${left} ${bottom - r}
      V${top + r} A${r} ${r} 0 0 1 ${left + r} ${top} Z`;
  } else {
    const tailTip = top - tailLen;
    balloonPath = `M${left + r} ${top}
      H${x - tailHalf}
      L${x} ${tailTip}
      L${x + tailHalf} ${top}
      H${right - r} A${r} ${r} 0 0 1 ${right} ${top + r}
      V${bottom - r} A${r} ${r} 0 0 1 ${right - r} ${bottom}
      H${left + r} A${r} ${r} 0 0 1 ${left} ${bottom - r}
      V${top + r} A${r} ${r} 0 0 1 ${left + r} ${top} Z`;
  }
  balloonPath = balloonPath.replace(/\s+/g, ' ').trim();

  // 연도 라벨: up이면 점 아래, down이면 점 위
  const yearY = isUp ? TRACK_Y + 22 : TRACK_Y - 14;

  return `
  <g class="c-pin">
    <circle cx="${x}" cy="${TRACK_Y}" r="5" stroke-width="0.5"/>
    <text class="year" x="${x}" y="${yearY}" text-anchor="middle">${dateLabel}</text>
    <path class="balloon" d="${balloonPath}" stroke-width="1.5"/>
    ${iconPath ? `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})"><path class="icon" d="${iconPath}" fill="${iconColor}"/></g>` : ''}
    <text class="ts label" x="${textX}" y="${rowCenterY}" dominant-baseline="central">${titleEscaped}</text>
  </g>`;
}

// 달리는 캐릭터: 사용자가 제공한 스틱맨 애니메이션 (path 모핑, viewBox 100x100 기준)
function buildRunner(x) {
  const scale = 0.5; // 100px -> 50px
  // 발이 트랙 라인(y=TRACK_Y)에 닿도록 y 오프셋 조정. 원본에서 발끝 최대 y ≈ 90
  const offsetX = x - 100 * scale * 0.55; // 캐릭터 중심을 x에 맞춤
  const offsetY = TRACK_Y - 90 * scale;
  return `
  <g class="runner" transform="translate(${offsetX}, ${offsetY}) scale(${scale})" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,3; 0,0; 0,3; 0,0; 0,3" dur="1.2s" repeatCount="indefinite"/>
      <path d="M55,30 L40,33 L53,42">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite"
          values="M55,30 L40,33 L53,42; M55,30 L55,46 L70,46; M55,30 L70,33 L82,23; M55,30 L55,46 L70,46; M55,30 L40,33 L53,42"/>
      </path>
      <path d="M45,60 L35,75 L20,70">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite"
          values="M45,60 L35,75 L20,70; M45,60 L55,70 L45,80; M45,60 L65,65 L70,85; M45,60 L45,80 L35,90; M45,60 L35,75 L20,70"/>
      </path>
      <path d="M55,30 L45,60" stroke-width="7"/>
      <circle cx="58" cy="18" r="9" fill="#1a1a1a" stroke="none"/>
      <path d="M45,60 L65,65 L70,85">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite"
          values="M45,60 L65,65 L70,85; M45,60 L45,80 L35,90; M45,60 L35,75 L20,70; M45,60 L55,70 L45,80; M45,60 L65,65 L70,85"/>
      </path>
      <path d="M55,30 L70,33 L82,23">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite"
          values="M55,30 L70,33 L82,23; M55,30 L55,46 L70,46; M55,30 L40,33 L53,42; M55,30 L55,46 L70,46; M55,30 L70,33 L82,23"/>
      </path>
    </g>
  </g>`;
}

function generateSVG(data) {
  const items = data.items || [];
  if (items.length === 0) {
    return `<svg width="680" height="160" viewBox="0 0 680 160" xmlns="http://www.w3.org/2000/svg"><text x="40" y="80" font-size="14">No items</text></svg>`;
  }

  const dates = items.map((it) => it.date);
  const placed = items.map((item) => ({
    item,
    x: dateToX(item.date, dates, TRACK_START, TRACK_END),
    w: estimatePinW(item.title),
  }));

  // 같은 side에서 이전 핀과 겹치면 반대 side로 배치
  const SAFETY_GAP = 8;
  const lastRight = { up: -Infinity, down: -Infinity };
  placed.forEach((p) => {
    const left = p.x - p.w / 2;
    const right = p.x + p.w / 2;
    if (left > lastRight.up + SAFETY_GAP) {
      p.side = 'up';
    } else if (left > lastRight.down + SAFETY_GAP) {
      p.side = 'down';
    } else {
      // 양쪽 다 겹치면 더 여유 있는 쪽 선택
      p.side = lastRight.up <= lastRight.down ? 'up' : 'down';
    }
    lastRight[p.side] = right;
  });

  const pins = placed.map((p) => buildPin(p.item, p.x, p.side)).join('\n');

  const height = 240; // 위/아래 핀 모두 수용
  const width = 680;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Segoe UI', 'Noto Sans KR', Helvetica, Arial, sans-serif" color="#1a1a1a">
  <style>
    .c-pin path.balloon { fill: #ffffff; stroke: #1a1a1a; }
    .c-pin path.icon { stroke: none; }
    .c-pin circle { fill: #1a1a1a; stroke: none; }
    .c-pin text.label { fill: #1a1a1a; font-size: 11px; font-weight: 500; }
    .c-pin text.year { fill: #888780; font-size: 11px; font-weight: 400; }
    .track { stroke: #6e6d68; }

    @media (prefers-color-scheme: dark) {
      .c-pin path.balloon { fill: #2b2b2b; stroke: #e8e8e8; }
      .c-pin circle { fill: #e8e8e8; }
      .c-pin text.label { fill: #f0f0f0; }
      .c-pin text.year { fill: #9a9a9a; }
      .track { stroke: #6e6d68; }
      .runner { stroke: #e8e8e8; }
      .runner circle { fill: #e8e8e8; }
    }
  </style>
  <line class="track" x1="${TRACK_START}" y1="${TRACK_Y}" x2="${width - 20}" y2="${TRACK_Y}" stroke-width="2"/>
  ${pins}
  ${buildRunner(width - 40)}
</svg>`;
}

module.exports = { generateSVG, getIconInfo, dateToX };
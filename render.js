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

// 텍스트의 픽셀 폭 추정 (한글/전각 11px, 영문/숫자 5.5px 가정)
function estimateTextWidth(title) {
  let textWidth = 0;
  for (const ch of title) {
    textWidth += /[\u3000-\u9fff\uac00-\ud7a3]/.test(ch) ? 11 : 5.5;
  }
  return textWidth;
}

// 깃발(flag) 핀의 너비 추정: 우측 V자 노치를 위한 여유 공간 포함
function estimatePinW(title) {
  const textWidth = estimateTextWidth(title);
  const padding = 8;
  const iconSize = 24 * 0.55;
  const iconTextGap = 6;
  const notch = 8; // 우측 V자 노치만큼 텍스트와의 여유 공간 추가 필요
  return Math.round(padding + iconSize + iconTextGap + textWidth + padding + notch);
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
  const flagW = estimatePinW(item.title); // 깃발 천의 너비 (기존 핀 폭 추정치 재사용)
  const flagH = 36;
  const poleLen = 64; // 점에서 깃발 천 시작까지의 막대 길이
  const notch = 8; // 우측 V자 노치 깊이

  const isUp = side === 'up';
  // 막대: 점(x, TRACK_Y)에서 위 또는 아래로 poleLen만큼
  const poleTopY = isUp ? TRACK_Y - poleLen : TRACK_Y;
  const poleBottomY = isUp ? TRACK_Y : TRACK_Y + poleLen;

  // 깃발 천은 막대의 "먼 쪽 끝"에 위치 (up: 막대 위쪽 끝, down: 막대 아래쪽 끝)
  const flagTop = isUp ? poleTopY : poleBottomY - flagH;
  const flagBottom = flagTop + flagH;
  const flagLeft = x;
  const flagRight = x + flagW;
  const flagMidY = flagTop + flagH / 2;

  // 깃발 천 path: 좌상 -> 우상 -> (우측 중앙으로 V자 노치) -> 우하 -> 좌하 -> 닫기
  const flagPath = `M${flagLeft} ${flagTop}
    H${flagRight}
    L${flagRight - notch} ${flagMidY}
    L${flagRight} ${flagBottom}
    H${flagLeft}
    Z`.replace(/\s+/g, ' ').trim();

  const iconX = flagLeft + padding;
  const iconY = flagMidY - iconSize / 2;
  const textX = iconX + iconSize + iconTextGap;

  // 연도 라벨: 점 근처, 막대 반대쪽(점 바로 아래/위)
  const yearY = isUp ? TRACK_Y + 22 : TRACK_Y - 14;

  return `
  <g class="c-pin">
    <circle cx="${x}" cy="${TRACK_Y}" r="5" stroke-width="0.5"/>
    <text class="year" x="${x}" y="${yearY}" text-anchor="middle">${dateLabel}</text>
    <line class="pole" x1="${x}" y1="${poleTopY}" x2="${x}" y2="${poleBottomY}" stroke-width="2"/>
    <path class="balloon" d="${flagPath}" stroke-width="1.5"/>
    ${iconPath ? `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})"><path class="icon" d="${iconPath}" fill="${iconColor}"/></g>` : ''}
    <text class="ts label" x="${textX}" y="${flagMidY}" dominant-baseline="central">${titleEscaped}</text>
  </g>`;
}

// 달리는 캐릭터: 사용자가 제공한 스틱맨 애니메이션 (path 모핑, viewBox 100x100 기준)
// baseY: 캐릭터의 발이 닿아야 할 y좌표 (기준선)
function buildRunnerAt(x, baseY) {
  const scale = 0.5; // 100px -> 50px
  // 발이 기준선(baseY)에 닿도록 y 오프셋 조정. 원본에서 발끝 최대 y ≈ 90
  const offsetX = x - 100 * scale * 0.55; // 캐릭터 중심을 x에 맞춤
  const offsetY = baseY - 90 * scale;
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

function buildRunner(x) {
  return buildRunnerAt(x, TRACK_Y);
}

// 점프하는 캐릭터: 계단 스타일에서 사용 (path 모핑, viewBox 100x100 기준)
// baseY: 캐릭터의 발(그림자)이 닿아야 할 y좌표 (기준선)
function buildJumperAt(x, baseY) {
  const scale = 0.5; // 100px -> 50px
  // 원본에서 그림자 cy=95가 발이 닿는 기준이므로, 그 지점이 baseY에 오도록 오프셋 조정
  const offsetX = x - 50 * scale;
  const offsetY = baseY - 95 * scale;
  return `
  <g class="runner" transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
    <ellipse class="shadow" cx="50" cy="95" rx="15" ry="3">
      <animate attributeName="rx" values="15; 20; 5; 20; 15" keyTimes="0; 0.2; 0.5; 0.8; 1" dur="1.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1; 1; 0.2; 1; 1" keyTimes="0; 0.2; 0.5; 0.8; 1" dur="1.2s" repeatCount="indefinite"/>
    </ellipse>
    <g class="runner-body" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <animateTransform attributeName="transform" type="translate" values="0,0; 0,10; 0,-30; 0,10; 0,0" keyTimes="0; 0.2; 0.5; 0.8; 1" dur="1.2s" repeatCount="indefinite"/>
      <circle class="runner-head" stroke="none" cx="50" cy="20" r="9"/>
      <path stroke-width="7" d="M50,29 L50,60"/>
      <path d="M50,35 L40,50 L35,65">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite" keyTimes="0; 0.2; 0.5; 0.8; 1"
          values="M50,35 L40,50 L35,65; M50,35 L35,45 L40,60; M50,35 L30,20 L25,5; M50,35 L35,45 L40,60; M50,35 L40,50 L35,65"/>
      </path>
      <path d="M50,35 L60,50 L65,65">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite" keyTimes="0; 0.2; 0.5; 0.8; 1"
          values="M50,35 L60,50 L65,65; M50,35 L65,45 L60,60; M50,35 L70,20 L75,5; M50,35 L65,45 L60,60; M50,35 L60,50 L65,65"/>
      </path>
      <path d="M50,60 L40,75 L35,90">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite" keyTimes="0; 0.2; 0.5; 0.8; 1"
          values="M50,60 L40,75 L35,90; M50,60 L35,70 L30,90; M50,60 L40,75 L45,90; M50,60 L35,70 L30,90; M50,60 L40,75 L35,90"/>
      </path>
      <path d="M50,60 L60,75 L65,90">
        <animate attributeName="d" dur="1.2s" repeatCount="indefinite" keyTimes="0; 0.2; 0.5; 0.8; 1"
          values="M50,60 L60,75 L65,90; M50,60 L65,70 L70,90; M50,60 L60,75 L55,90; M50,60 L65,70 L70,90; M50,60 L60,75 L65,90"/>
      </path>
    </g>
  </g>`;
}

// 계단 한 칸을 그림 (블록 + 아이콘 + 텍스트 + 연도, 한 줄)
// drawLeftEdge: false면 좌측 변을 그리지 않음 (이전 계단과 겹쳐 중복 선 방지)
function buildStair(item, blockX, blockW, blockTop, blockBottom, drawLeftEdge) {
  const iconInfo = getIconInfo(item.icon);
  const iconColor = item.color || (iconInfo ? iconInfo.color : '#1a1a1a');
  const iconPath = iconInfo ? iconInfo.path : null;
  const titleEscaped = item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const [year, month] = item.date.split('-');
  const dateLabel = `${year}.${month}`;

  const padding = 8;
  const iconScale = 0.5;
  const iconSize = 24 * iconScale;
  const iconTextGap = 6;

  const blockH = blockBottom - blockTop;
  const labelRowY = blockTop + blockH / 2; // 판 두께 중앙에 아이콘+텍스트+연도 한 줄 배치

  const iconX = blockX + padding;
  const iconY = labelRowY - iconSize / 2;
  const textX = iconX + iconSize + iconTextGap;
  const yearX = blockX + blockW - padding; // 우측 끝, 패딩만큼 안쪽

  const left = blockX;
  const right = blockX + blockW;
  const top = blockTop;
  const bottom = blockBottom;

  // 외곽선: 상단 -> 우측 -> 하단 (-> 좌측, drawLeftEdge일 때만)
  const outlinePath = drawLeftEdge
    ? `M${left} ${top} H${right} V${bottom} H${left} Z`
    : `M${left} ${top} H${right} V${bottom} H${left}`;

  return `
  <g class="c-stair">
    <rect class="step-fill" x="${blockX}" y="${blockTop}" width="${blockW}" height="${blockH}"/>
    <path class="step-outline" d="${outlinePath}" fill="none" stroke-width="1.5"/>
    ${iconPath ? `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})"><path class="icon" d="${iconPath}" fill="${iconColor}"/></g>` : ''}
    <text class="ts label" x="${textX}" y="${labelRowY}" dominant-baseline="central">${titleEscaped}</text>
    <text class="year" x="${yearX}" y="${labelRowY}" text-anchor="end" dominant-baseline="central">${dateLabel}</text>
  </g>`;
}

function generateStairsSVG(items) {
  const width = 680;
  const stepThickness = 36; // 모든 계단 판의 두께(고정)
  const n = items.length;

  // 캐릭터 점프 최고점(-30) + 머리 반경까지 고려한 안전 여백
  const jumpClearance = 70;
  const groundY = jumpClearance + stepThickness + (n - 1) * stepThickness + 10;
  const sideMargin = 30;
  const overlap = 0.2; // 블록끼리 가로로 겹쳐서 가로 변이 한 선처럼 이어지게 함

  const usableWidth = width - sideMargin * 2;
  const blockW = Math.round(usableWidth / (1 + (n - 1) * (1 - overlap)));
  const step = Math.round(blockW * (1 - overlap));

  // 계단마다 올라가는 높이(rise) = 판 두께와 정확히 일치시켜,
  // i번째 블록의 상단 변이 i+1번째 블록의 하단 변과 한 선으로 맞물리게 함
  const riseStep = stepThickness;

  const stairs = items
    .map((item, i) => {
      const blockX = sideMargin + i * step;
      const blockBottom = groundY - riseStep * i; // 이 계단 판의 바닥(아래쪽 변)
      const blockTop = blockBottom - stepThickness;
      const drawLeftEdge = i === 0; // 첫 계단만 좌측 변을 그림 (나머지는 이전 계단과 겹쳐 생략)
      return buildStair(item, blockX, blockW, blockTop, blockBottom, drawLeftEdge);
    })
    .join('\n');

  // 러너는 가장 높은(마지막) 계단 위, 우측 끝에 배치
  const lastBlockX = sideMargin + (n - 1) * step;
  const lastBlockBottom = groundY - riseStep * (n - 1);
  const lastBlockTop = lastBlockBottom - stepThickness;
  const runnerX = Math.min(lastBlockX + blockW - 20, width - 40);
  const runnerBaseY = lastBlockTop; // 계단 상단에 발이 닿도록

  const height = groundY + 30; // 가장 낮은 계단 아래 연도 라벨까지 여유 포함

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Segoe UI', 'Noto Sans KR', Helvetica, Arial, sans-serif" color="#1a1a1a">
  <style>
    .c-stair rect.step-fill { fill: #ffffff; }
    .c-stair path.step-outline { stroke: #1a1a1a; }
    .c-stair path.icon { stroke: none; }
    .c-stair text.label { fill: #1a1a1a; font-size: 11px; font-weight: 500; }
    .c-stair text.year { fill: #888780; font-size: 10px; font-weight: 400; }
    .ground { stroke: #6e6d68; }
    .runner-body { stroke: #1a1a1a; }
    .runner-head { fill: #1a1a1a; }
    .shadow { fill: #1a1a1a; opacity: 0.15; }

    @media (prefers-color-scheme: dark) {
      .c-stair rect.step-fill { fill: #2b2b2b; }
      .c-stair path.step-outline { stroke: #e8e8e8; }
      .c-stair text.label { fill: #f0f0f0; }
      .c-stair text.year { fill: #9a9a9a; }
      .ground { stroke: #6e6d68; }
      .runner-body { stroke: #e8e8e8; }
      .runner-head { fill: #e8e8e8; }
      .shadow { fill: #e8e8e8; opacity: 0.2; }
    }
  </style>
  ${stairs}
  ${buildJumperAt(runnerX, runnerBaseY)}
</svg>`;
}

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

function generateFlagSVG(items) {
  const dates = items.map((it) => it.date);
  const placed = items.map((item) => ({
    item,
    x: dateToX(item.date, dates, TRACK_START, TRACK_END),
    w: estimatePinW(item.title),
  }));

  const height = 240; // 위/아래 핀 모두 수용
  const width = 680;

  // 같은 side에서 이전 핀과 겹치면 반대 side로 배치
  const SAFETY_GAP = 8;
  const lastRight = { up: -Infinity, down: -Infinity };
  placed.forEach((p) => {
    const left = p.x;
    const right = p.x + p.w;
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

  // 러너는 항상 우측 끝 up 위치에 그려지므로, 마지막 항목이 up이면서 러너와 겹치면 down으로 전환
  const RUNNER_X = width - 40;
  const RUNNER_HALF_W = 25;
  const runnerLeft = RUNNER_X - RUNNER_HALF_W;
  const lastPin = placed[placed.length - 1];
  if (lastPin.side === 'up' && lastPin.x + lastPin.w + SAFETY_GAP > runnerLeft) {
    lastPin.side = 'down';
  }

  const pins = placed.map((p) => buildPin(p.item, p.x, p.side)).join('\n');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Segoe UI', 'Noto Sans KR', Helvetica, Arial, sans-serif" color="#1a1a1a">
  <style>
    .c-pin path.balloon { fill: #ffffff; stroke: #1a1a1a; }
    .c-pin path.icon { stroke: none; }
    .c-pin circle { fill: #1a1a1a; stroke: none; }
    .c-pin line.pole { stroke: #1a1a1a; }
    .c-pin text.label { fill: #1a1a1a; font-size: 11px; font-weight: 500; }
    .c-pin text.year { fill: #888780; font-size: 11px; font-weight: 400; }
    .track { stroke: #6e6d68; }

    @media (prefers-color-scheme: dark) {
      .c-pin path.balloon { fill: #2b2b2b; stroke: #e8e8e8; }
      .c-pin circle { fill: #e8e8e8; }
      .c-pin line.pole { stroke: #e8e8e8; }
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
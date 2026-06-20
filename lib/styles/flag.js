const { getIconInfo } = require('../icons');
const { buildRunnerAt } = require('../characters');
const { COLORS, wrapSVG, formatDateLabel, escapeText, dateToX, estimateTextWidth } = require('../utils');

const TRACK_Y = 120;
const TRACK_START = 60;
const TRACK_END = 540;

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
  const iconColor = item.color || (iconInfo ? iconInfo.color : COLORS.light.fg);
  const iconPath = iconInfo ? iconInfo.path : null;
  const titleEscaped = escapeText(item.title);
  const dateLabel = formatDateLabel(item.date);

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

  const style = `
  <style>
    .c-pin path.balloon { fill: ${COLORS.light.bg}; stroke: ${COLORS.light.fg}; }
    .c-pin path.icon { stroke: none; }
    .c-pin circle { fill: ${COLORS.light.fg}; stroke: none; }
    .c-pin line.pole { stroke: ${COLORS.light.fg}; }
    .c-pin text.label { fill: ${COLORS.light.fg}; font-size: 11px; font-weight: 500; }
    .c-pin text.year { fill: ${COLORS.light.muted}; font-size: 11px; font-weight: 400; }
    .track { stroke: ${COLORS.light.line}; }

    @media (prefers-color-scheme: dark) {
      .c-pin path.balloon { fill: ${COLORS.dark.bg}; stroke: ${COLORS.dark.fg}; }
      .c-pin circle { fill: ${COLORS.dark.fg}; }
      .c-pin line.pole { stroke: ${COLORS.dark.fg}; }
      .c-pin text.label { fill: ${COLORS.dark.label}; }
      .c-pin text.year { fill: ${COLORS.dark.muted}; }
      .track { stroke: ${COLORS.dark.line}; }
      .runner { stroke: ${COLORS.dark.fg}; }
      .runner circle { fill: ${COLORS.dark.fg}; }
    }
  </style>`;

  const body = `${style}
  <line class="track" x1="${TRACK_START}" y1="${TRACK_Y}" x2="${width - 20}" y2="${TRACK_Y}" stroke-width="2"/>
  ${pins}
  ${buildRunnerAt(width - 40, TRACK_Y)}`;

  return wrapSVG(width, height, body);
}

module.exports = { generateFlagSVG };
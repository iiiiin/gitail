const { getIconInfo } = require('../icons');
const { buildJumperAt } = require('../characters');
const { COLORS, wrapSVG, formatDateLabel, escapeText } = require('../utils');

// 계단 한 칸을 그림 (블록 + 아이콘 + 텍스트 + 연도, 한 줄)
// drawLeftEdge: false면 좌측 변을 그리지 않음 (이전 계단과 겹쳐 중복 선 방지)
function buildStair(item, blockX, blockW, blockTop, blockBottom, drawLeftEdge) {
  const iconInfo = getIconInfo(item.icon);
  const iconColor = item.color || (iconInfo ? iconInfo.color : COLORS.light.fg);
  const iconPath = iconInfo ? iconInfo.path : null;
  const titleEscaped = escapeText(item.title);
  const dateLabel = formatDateLabel(item.date);

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
      const drawLeftEdge = false; // 모든 계단의 좌측 변을 생략해 열린 형태로 통일
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

  const style = `
  <style>
    .c-stair rect.step-fill { fill: ${COLORS.light.bg}; }
    .c-stair path.step-outline { stroke: ${COLORS.light.fg}; }
    .c-stair path.icon { stroke: none; }
    .c-stair text.label { fill: ${COLORS.light.fg}; font-size: 11px; font-weight: 500; }
    .c-stair text.year { fill: ${COLORS.light.muted}; font-size: 10px; font-weight: 400; }
    .ground { stroke: ${COLORS.light.line}; }
    .runner-body { stroke: ${COLORS.light.fg}; }
    .runner-head { fill: ${COLORS.light.fg}; }
    .shadow { fill: ${COLORS.light.fg}; opacity: 0.15; }

    @media (prefers-color-scheme: dark) {
      .c-stair rect.step-fill { fill: ${COLORS.dark.bg}; }
      .c-stair path.step-outline { stroke: ${COLORS.dark.fg}; }
      .c-stair text.label { fill: ${COLORS.dark.label}; }
      .c-stair text.year { fill: ${COLORS.dark.muted}; }
      .ground { stroke: ${COLORS.dark.line}; }
      .runner-body { stroke: ${COLORS.dark.fg}; }
      .runner-head { fill: ${COLORS.dark.fg}; }
      .shadow { fill: ${COLORS.dark.fg}; opacity: 0.2; }
    }
  </style>`;

  const body = `${style}
  ${stairs}
  ${buildJumperAt(runnerX, runnerBaseY)}`;

  return wrapSVG(width, height, body);
}

module.exports = { generateStairsSVG };
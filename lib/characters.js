// 달리는 캐릭터: 스틱맨 애니메이션 (path 모핑, viewBox 100x100 기준). 깃발 스타일에서 사용.
// baseY: 캐릭터의 발이 닿아야 할 y좌표 (기준선)
function buildRunnerAt(x, baseY) {
  const scale = 0.5; // 100px -> 50px
  // 발이 기준선(baseY)에 닿도록 y 오프셋 조정. 원본에서 발끝 최대 y ≈ 90
  const offsetX = x - 100 * scale * 0.55; // 캐릭터 중심을 x에 맞춤
  const offsetY = baseY - 90 * scale;
  return `
  <g class="runner" transform="translate(${offsetX}, ${offsetY}) scale(${scale})" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
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
      <circle class="runner-head" cx="58" cy="18" r="9" stroke="none"/>
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

module.exports = { buildRunnerAt, buildJumperAt };
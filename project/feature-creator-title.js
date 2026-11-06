const START = 394.96;
const OPEN_SOURCE = 402.22;
const END = 405.48;
const PAPER = '#eee9df';
const ACCENT = '#c45b50';
const SERIF = '"Noto Serif SC", serif';

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function ink(ctx, text, x, y, size, weight, color) {
  ctx.font = `${weight} ${size}px ${SERIF}`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function drawCreatorTitle(ctx, time, clip) {
  if (clip !== 'p1c1' || time < START || time >= END) return null;
  const age = time - START;
  const reveal = smooth((age - .24) / .88);
  const title = smooth((age - .96) / .92);
  const shared = smooth((time - OPEN_SOURCE) / .48);
  const fade = smooth((END - time) / .58);
  const x = 225;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.rect(105, 105, 1035, 510);
  ctx.clip();
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.globalAlpha = fade * reveal;
  const shade = ctx.createLinearGradient(110, 0, 1115, 0);
  shade.addColorStop(0, '#08090b00');
  shade.addColorStop(.16, '#08090bc9');
  shade.addColorStop(.67, '#08090b9b');
  shade.addColorStop(1, '#08090b00');
  ctx.fillStyle = shade;
  ctx.fillRect(110, 118, 1005, 488);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.translate(0, 21 * (1 - reveal));

  ctx.fillStyle = ACCENT;
  ctx.fillRect(x, 202, 46 + 612 * title, 2);
  ctx.fillRect(x, 202, 3, 28);
  ink(ctx, '越来越多人开始成为', x + 21, 263, 49, 600, PAPER);

  ctx.save();
  ctx.globalAlpha *= title;
  ctx.translate(0, 31 * (1 - title));
  ctx.shadowColor = '#09090b';
  ctx.shadowBlur = 14;
  ink(ctx, '创造者', x + 11, 407, 158, 900, PAPER);
  ctx.shadowColor = 'transparent';
  ctx.restore();

  ctx.globalAlpha *= shared;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(x + 7, 554, 4, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, '成为开源平台的一份子', x + 25, 554 + 12 * (1 - shared), 44, 650, PAPER);
  ctx.restore();
  return {title: '创造者', openSourceLine: shared > .001, opacity: fade * reveal, bounds: [105,105,1035,510]};
}

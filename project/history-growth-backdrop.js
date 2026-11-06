const DAY = 86400000;
const epoch = Date.UTC(2026, 3, 24);
const day = (month, date) => (Date.UTC(2026, month - 1, date) - epoch) / DAY;
const points = [
  [day(9, 30), 27.1, '09.30'], [day(10, 7), 42.9, '10.07'],
  [day(10, 14), 66.5, '10.14'], [day(10, 21), 113, '10.21'],
  [day(10, 28), 140, '10.28'], [day(11, 4), 154, '11.04'],
];
const firstDay = points[0][0];
const lastDay = points.at(-1)[0];
const PAPER = '#efe9dd';
const RED = '#bd6b60';
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;
function ease(time, start, end) {
  const t = clamp((time - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function growthShotAt(time) {
  // The music clock starts 4.5 seconds into the opening.
  if (time < 6.5 || time >= 15.05) return null;
  const push = ease(time, 6.5, 8.9);
  const wide = ease(time, 9.75, 11.55);
  return {
    phase: time < 8.9 ? 'push-in' : time < 9.75 ? 'close' : wide < 1 ? 'pull-back' : 'overview',
    opacity: mix(.13, 1, ease(time, 6.5, 7.08)) * (1 - ease(time, 13.95, 15.05)),
    zoom: mix(mix(.65, 1.62, push), 1, wide),
    wide,
    head: mix(firstDay, lastDay, ease(time, 6.72, 10.75)),
  };
}

function createProjection(camera, shot) {
  const yaw = mix(.58 + camera.yaw * .16, .12 + camera.yaw * .035, shot.wide);
  const pitch = mix(.53, .29, shot.wide);
  const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
  const sinP = Math.sin(pitch), cosP = Math.cos(pitch);
  const pivot = mix(255, 0, shot.wide);
  return (date, value = 0, side = 0) => {
    // Separate the release history from the dated DAU series.
    const x = date < firstDay
      ? mix(-830, -173, date / firstDay)
      : mix(-118, 730, (date - firstDay) / (lastDay - firstDay));
    const horizontal = x * cosY - side * sinY;
    const depth = x * sinY + side * cosY;
    const height = value * 3.35;
    const scale = 2280 / (2280 / shot.zoom - depth * cosP - height * sinP);
    return [
      mix(1165, 951, shot.wide) + (horizontal - pivot) * scale,
      mix(738, 797, shot.wide) - (height * cosP + depth * sinP) * scale,
      scale,
    ];
  };
}

function stroke(ctx, a, b, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

function type(ctx, text, at, size, color = PAPER, align = 'left') {
  ctx.font = size + 'px "PV Mono","Microsoft YaHei",sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, at[0], at[1]);
}

function drawTimeline(ctx, map, wide) {
  for (const offset of [-250, -125, 0, 125, 250]) {
    stroke(ctx, map(0, 0, offset), map(lastDay, 0, offset), '#efe9dd30', offset ? 1 : 2);
  }
  for (const date of [0, day(6, 1), day(7, 1), day(8, 13), day(9, 29)]) {
    const base = map(date), top = map(date, 22);
    stroke(ctx, map(date, 0, -250), map(date, 0, 250), '#efe9dd24', 1);
    stroke(ctx, base, top, '#bd6b60b0', 2);
  }
  ctx.save();
  ctx.globalAlpha *= wide;
  for (const [date, title] of [
    [0, '04.24  V4 发布'], [day(8, 13), '08.13  HARNESS'], [day(9, 29), '09.29  桌面端'],
  ]) {
    const [x, y] = map(date);
    stroke(ctx, [x, y + 5], [x, 882], '#efe9dd40', 1);
    type(ctx, title, [x, 905], 21, PAPER, 'center');
  }
  ctx.restore();
}

function drawSeries(ctx, map, head) {
  const revealed = points.filter(([date]) => date <= head);
  const [fromDate, fromValue] = revealed.at(-1);
  const next = points[revealed.length];
  const trace = revealed.map(([date, value]) => [date, value]);
  if (next && head > fromDate) {
    trace.push([head, mix(fromValue, next[1], (head - fromDate) / (next[0] - fromDate))]);
  }
  for (let index = 1; index < trace.length; index++) {
    const [dateA, valueA] = trace[index - 1], [dateB, valueB] = trace[index];
    const a = map(dateA, valueA), b = map(dateB, valueB), floorA = map(dateA), floorB = map(dateB);
    const fill = ctx.createLinearGradient(0, Math.min(a[1], b[1]), 0, Math.max(floorA[1], floorB[1]));
    fill.addColorStop(0, '#bd6b6070');
    fill.addColorStop(1, '#bd6b6005');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(floorB[0], floorB[1]);
    ctx.lineTo(floorA[0], floorA[1]);
    ctx.closePath();
    ctx.fill();
    ctx.setLineDash(index === points.length - 1 ? [13, 8] : []);
    stroke(ctx, a, b, '#bd6b604d', 12);
    stroke(ctx, a, b, PAPER, 3.7);
  }
  ctx.setLineDash([]);
  for (const [date, value, label] of revealed) {
    const end = date === lastDay;
    const point = map(date, value), base = map(date);
    stroke(ctx, map(date, 0, -250), map(date, 0, 250), '#efe9dd2e', 1);
    stroke(ctx, base, point, '#efe9dd52', 1.5);
    type(ctx, label, [base[0], base[1] + 28], 23, PAPER, 'center');
    ctx.fillStyle = end || label === '10.14' ? RED : PAPER;
    ctx.beginPath();
    ctx.arc(point[0], point[1], end ? 9 : 5.5, 0, Math.PI * 2);
    ctx.fill();
    type(ctx, value + '万', [point[0], point[1] - 29], end ? 42 : 28, PAPER, 'center');
  }
}

export function drawGrowthBackdrop(ctx, camera, shot) {
  const map = createProjection(camera, shot);
  ctx.save();
  ctx.globalAlpha *= shot.opacity;
  const shade = ctx.createLinearGradient(0, 120, 0, 1020);
  shade.addColorStop(0, '#080a0c08');
  shade.addColorStop(.45, '#080a0c19');
  shade.addColorStop(1, '#080a0cd6');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 1920, 1080);
  drawTimeline(ctx, map, shot.wide);
  drawSeries(ctx, map, shot.head);
  type(ctx, 'HARNESS   /   API 用户日活', [126, 118], 34);
  if (shot.wide > 0) {
    ctx.globalAlpha *= shot.wide;
    type(ctx, '04—09  发布节点  /  09.30 起展示 DAU 数据', [126, 994], 22, '#d5cec0');
    type(ctx, '11.04 为单日值 · 其余为连续 7 天均值', [1794, 994], 22, '#d5cec0', 'right');
  }
  ctx.restore();
}

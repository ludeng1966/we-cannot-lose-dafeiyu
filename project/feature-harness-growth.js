export const growthWindow = {start: 360.68, end: 370.44};

const dates = ['9月30日', '10月7日', '10月14日', '10月21日', '10月28日', '11月4日'];
const values = [27.1, 42.9, 66.5, 113, 140, 154];
const x = i => 266 + i * 288;
const y = value => 750 - value * 2.86;

export function drawHarnessGrowth(ctx, time) {
  const progress = Math.max(0, Math.min(5, (time - growthWindow.start) * 1.75));
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#090d12';
  ctx.fillRect(0, 0, 1920, 952);
  ctx.textBaseline = 'middle';
  function label(value, x, y, size, color = '#edf3fa', align = 'left', weight = 500) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  }
  label('DeepSeek Harness  /  用户增长', 110, 98, 32, '#8dbaff');
  label('活跃用户数', 110, 173, 66, '#edf3fa', 'left', 700);
  label('548万', 1790, 134, 78, '#94c2ff', 'right', 700);
  label('月活跃用户 · 截至11月4日', 1790, 199, 29, '#aebdce', 'right');

  ctx.lineWidth = 1;
  for (const tick of [0, 50, 100, 150]) {
    ctx.strokeStyle = '#394653';
    ctx.beginPath();
    ctx.moveTo(216, y(tick));
    ctx.lineTo(1790, y(tick));
    ctx.stroke();
    label(tick ? tick + '万' : '0', 194, y(tick), 27, '#aebdce', 'right');
  }

  dates.forEach((date, i) => label(date, x(i), 794, 29, '#c8d5e4', 'center'));
  ctx.strokeStyle = '#86b8ff';
  ctx.lineWidth = 5;
  for (let i = 0; i < values.length - 1; i++) {
    const step = Math.min(1, progress - i);
    if (step <= 0) break;
    ctx.setLineDash(i === 4 ? [15, 11] : []);
    ctx.beginPath();
    ctx.moveTo(x(i), y(values[i]));
    ctx.lineTo(x(i) + (x(i + 1) - x(i)) * step, y(values[i] + (values[i + 1] - values[i]) * step));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  values.forEach((value, i) => {
    if (progress < i) return;
    ctx.fillStyle = '#94c2ff';
    ctx.beginPath();
    ctx.arc(x(i), y(value), i === 5 ? 10 : 7, 0, Math.PI * 2);
    ctx.fill();
    label(value + '万', x(i), y(value) - 37, i === 5 ? 48 : 34, i === 5 ? '#94c2ff' : '#edf3fa', 'center', 700);
  });
  label('各点为自标注日期起连续7天的日均值，11月4日为单日值。', 110, 891, 27, '#aebdce');
  label('数据来源  DeepSeek Harness 用户增长图', 1790, 891, 25, '#aebdce', 'right');
  ctx.restore();
}

function ease(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function drawTuiPanel(ctx, plate, clock) {
  const video = plate?.video;
  if (!video || video.readyState < 2) return null;
  const arrive = ease((clock - 379.45) / 2.2);
  const settle = ease((clock - 384.05) / 6.7);
  const opacity = ease((clock - 379.45) / .7) * ease((392 - clock) / 1.15);
  const w = 700 + 560 * arrive - 130 * settle;
  const h = w * 9 / 16;
  const x = 1040 - 754 * arrive - 38 * settle;
  const y = 155 - 67 * arrive + 62 * settle;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.rect(0, 0, 1920, 952);
  ctx.clip();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = opacity;
  ctx.filter = 'none';
  ctx.fillStyle = '#090b0d';
  ctx.shadowColor = '#000a';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillRect(x - 7, y - 7, w + 14, h + 14);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(video, x, y, w, h);
  ctx.strokeStyle = '#c8c9c55c';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 7, y - 7, w + 14, h + 14);
  ctx.fillStyle = '#a74843';
  ctx.fillRect(x - 7, y - 7, 46, 2);
  ctx.restore();
  return {key: plate.key, box: [x, y, w, h], opacity};
}

// V23 narration seconds, before the inserted PV is added to display time.
const cues = [
  { id: 'g051', start: 2157.95, reveal: 0.48, fade: 2160.38, end: 2161.16, x: 1288, y: 743 },
  { id: 'g052', start: 2202.5, reveal: 0.58, fade: null, end: 2207.04, x: 1280, y: 737, prefix: '西方不能失去' },
];
const commune = '巴黎公社';

function ease(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function paintTitle(ctx, x, y, opacity, fontSize, textAlign = 'center') {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.font = `900 ${fontSize}px "Noto Serif SC", serif`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#250c10';
  ctx.fillStyle = '#a2323a';
  ctx.strokeText(commune, x, y);
  ctx.fillText(commune, x, y);
  ctx.restore();
}

function paintClosingTitle(ctx, prefix, x, y, opacity) {
  const suffixSize = 78, gap = 12;
  ctx.save();
  ctx.font = `900 ${suffixSize}px "Noto Serif SC", serif`;
  const suffixWidth = ctx.measureText(commune).width;
  ctx.font = '650 60px "Noto Serif SC", serif';
  const prefixWidth = ctx.measureText(prefix).width;
  const left = x - (prefixWidth + gap + suffixWidth) / 2;

  ctx.globalAlpha *= opacity;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#13110f';
  ctx.fillStyle = '#e5dfd6';
  ctx.strokeText(prefix, left, y);
  ctx.fillText(prefix, left, y);
  ctx.restore();
  paintTitle(ctx, left + prefixWidth + gap, y, opacity, suffixSize, 'left');
}

function drawPhotoTitle(ctx, sceneTime, audioTime) {
  if (sceneTime < 69.62 || sceneTime >= 72.2) return null;
  // The conform jumps to the next shot at 309.90, before the source aperture closes.
  const opacity = ease((sceneTime - 69.62) / 0.30) * ease((309.90 - audioTime) / 0.42);
  if (opacity <= 0) return null;

  const x = 448, y = 785;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const ink = ctx.createLinearGradient(x - 28, 0, x + 365, 0);
  ink.addColorStop(0, '#16100e00');
  ink.addColorStop(0.09, '#16100ed9');
  ink.addColorStop(0.84, '#16100ec4');
  ink.addColorStop(1, '#16100e00');
  ctx.fillStyle = ink;
  ctx.fillRect(x - 28, y - 54, 393, 105);
  ctx.restore();
  paintTitle(ctx, x, y, opacity, 80, 'left');
  return { id: 'g008', text: commune, photo: true, x, y, opacity };
}

export function drawFeatureCommune(ctx, audioTime) {
  const cue = cues.find(({ start, end }) => audioTime >= start && audioTime <= end);
  if (!cue) return null;

  const enter = ease((audioTime - cue.start) / cue.reveal);
  const exit = cue.fade === null ? 1 : ease((cue.end - audioTime) / (cue.end - cue.fade));
  const opacity = enter * exit;
  if (opacity <= 0) return null;

  const y = cue.y + 10 * (1 - enter);
  if (cue.prefix) paintClosingTitle(ctx, cue.prefix, cue.x, y, opacity);
  else paintTitle(ctx, cue.x, y, opacity, 112);
  return { id: cue.id, text: (cue.prefix || '') + commune, photo: false, x: cue.x, y, opacity };
}

export function installFeatureCommune({ intro, outro, filmKit, getAudioTime }) {
  let audit = null;
  const drawIntro = intro.draw;
  const drawOutro = outro.draw;
  intro.draw = function (ctx, sceneTime, api) {
    drawIntro.call(this, ctx, sceneTime, api);
    audit = drawPhotoTitle(ctx, sceneTime, getAudioTime());
  };
  outro.draw = function (ctx, sceneTime, api) {
    const photo = filmKit.photo;
    // Remove only the repeated print, preserving the next desktop screenshot and live layer.
    filmKit.photo = (key, ...args) => key === 'commune' ? false : photo(key, ...args);
    try {
      drawOutro.call(this, ctx, sceneTime, api);
    } finally {
      filmKit.photo = photo;
    }
    audit = drawFeatureCommune(ctx, getAudioTime());
  };
  return { get audit() { return audit; }, resetAudit() { audit=null; } };
}

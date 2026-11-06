const shotId = 'opening-enforcement-close';
const source = '/feature/assets/user-evidence-v5/evidence-takedown.jpg';
const panel = { x: 832, y: 166, w: 1000, h: 600 };

function ease(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export async function createOpeningEvidence() {
  const image = new Image();
  image.src = source;
  try { await image.decode(); } catch { return null; }

  // Keep the notice legible in the same low-key palette as the gate and model.
  const crop = { x: 56, y: 28, w: 958, h: 517 };
  const print = document.createElement('canvas');
  print.width = crop.w;
  print.height = crop.h;
  const ink = print.getContext('2d', { alpha: false });
  ink.filter = 'grayscale(1) invert(1) contrast(.89) brightness(.86)';
  ink.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

  function opacityAt(shot, time) {
    if (shot?.id !== shotId) return 0;
    return ease((time - shot.start) / shot.fade) * ease((shot.end - time) / shot.fade);
  }

  function draw(ctx, shot, time) {
    const opacity = opacityAt(shot, time);
    if (opacity <= .001) return null;
    const { x, y, w, h } = panel;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= opacity;
    ctx.translate(0, 12 * (1 - opacity));
    ctx.fillStyle = 'rgba(13,14,16,.93)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(169,168,164,.34)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);

    ctx.fillStyle = '#a34e48';
    ctx.fillRect(x, y + 21, 3, 30);
    ctx.fillRect(x + w - 31, y + h - 2, 31, 2);
    ctx.font = '650 24px "Noto Serif SC", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#bdb8af';
    ctx.fillText('稿件处理通知', x + 25, y + 36);
    ctx.fillStyle = 'rgba(169,168,164,.24)';
    ctx.fillRect(x + 25, y + 66, w - 50, 1);
    ctx.drawImage(print, x + 24, y + 75, w - 48, (w - 48) * crop.h / crop.w);
    ctx.restore();
    return { id: shotId, asset: source, box: [x, y, w, h], opacity };
  }

  return { draw, opacityAt };
}

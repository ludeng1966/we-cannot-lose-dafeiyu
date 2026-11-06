const WIDTH = 1920;
const HEIGHT = 1080;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
export const CHAPTER_APPROACH_SECONDS = 3;

const smoothstep = (value) => value * value * (3 - 2 * value);

// Expand the next chapter through the PV's center while its camera settles
// on the original chapter framing. The last frame needs no overlay.
export function createChapterHandoff() {
  const layer = document.createElement('canvas');
  layer.width = WIDTH;
  layer.height = HEIGHT;
  const overlay = layer.getContext('2d');

  return function draw(ctx, renderer, localTime, secondsRemaining, chapter) {
    const progress = Math.max(0, Math.min(1, 1 - secondsRemaining / CHAPTER_APPROACH_SECONDS));
    const eased = smoothstep(progress);
    const feather = 155;
    const radius = 38 + 1240 * eased;
    const scale = 1 + .24 * (1 - eased);
    const strength = smoothstep(Math.min(1, progress * 5));

    const audit = renderer.draw(overlay, localTime);
    overlay.save();
    overlay.setTransform(1, 0, 0, 1, 0, 0);
    overlay.globalCompositeOperation = 'destination-out';
    const edge = overlay.createRadialGradient(
      CENTER_X, CENTER_Y, Math.max(0, radius - feather),
      CENTER_X, CENTER_Y, radius,
    );
    edge.addColorStop(0, `rgba(0,0,0,${strength})`);
    edge.addColorStop(1, 'transparent');
    overlay.fillStyle = edge;
    overlay.fillRect(0, 0, WIDTH, HEIGHT);
    overlay.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.drawImage(ctx.canvas, CENTER_X * (1 - scale), CENTER_Y * (1 - scale), WIDTH * scale, HEIGHT * scale);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    return { ...audit, chapterHandoff: { progress, scale, radius, targetClip: chapter.clip } };
  };
}

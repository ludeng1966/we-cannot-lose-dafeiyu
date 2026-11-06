const W = 1920;
const H = 1080;
const mix = (a, b, u) => a + (b - a) * u;

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function feather(ctx, start, end, width, horizontal) {
  const ramp = horizontal
    ? ctx.createLinearGradient(start, 0, end, 0)
    : ctx.createLinearGradient(0, start, 0, end);
  const edge = Math.min(.45, width / (end - start));
  ramp.addColorStop(0, 'transparent');
  ramp.addColorStop(edge, '#000');
  ramp.addColorStop(1 - edge, '#000');
  ramp.addColorStop(1, 'transparent');
  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, W, H);
}

export function createPVEntrance() {
  const layer = document.createElement('canvas');
  layer.width = W;
  layer.height = H;
  const world = layer.getContext('2d');
  const plate = document.createElement('canvas');
  plate.width = W;
  plate.height = H;
  const previous = plate.getContext('2d', {alpha: false});

  return function draw(ctx, pv, local, duration) {
    const elapsed = duration + local;
    if (elapsed <= 0 || local >= 0) return null;
    const camera = smooth(elapsed / duration);
    const gate = smooth((elapsed - .22) / (duration - .40));
    const stageX = mix(960, 1450, camera);
    const stageY = mix(540, 486, camera);
    const stageZoom = 960 / (W - stageX);
    const gateX = 960 + (1450 - stageX) * stageZoom;
    const gateY = 540 + (486 - stageY) * stageZoom;
    const gateWidth = mix(130, 2250, gate);
    const gateHeight = mix(350, 1360, gate);

    previous.drawImage(ctx.canvas, 0, 0);
    const audit = pv.draw(world, local, {preroll: duration});
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.drawImage(plate, 960 - stageX * stageZoom, 540 - stageY * stageZoom, W * stageZoom, H * stageZoom);

    // The gate opens on the same moving PV world that plays after the beat.
    // Apply the mask to that world only. Its transform reaches identity at zero.
    const approach = 1 - camera;
    const worldZoom = 1 + .13 * approach;
    const worldX = (gateX - 960) * .28 - (worldZoom - 1) * 960;
    const worldY = (gateY - 540) * .28 - (worldZoom - 1) * 540;
    world.save();
    world.globalCompositeOperation = 'destination-in';
    const left = (gateX - gateWidth / 2 - worldX) / worldZoom;
    const top = (gateY - gateHeight / 2 - worldY) / worldZoom;
    feather(world, left, left + gateWidth / worldZoom, 56, true);
    feather(world, top, top + gateHeight / worldZoom, 72, false);
    world.restore();
    ctx.globalAlpha = smooth(elapsed / .80);
    ctx.drawImage(layer, worldX, worldY, W * worldZoom, H * worldZoom);
    ctx.restore();

    return {local, camera, gate, stageZoom, worldZoom, incomingAvatar: audit.avatar?.opacity || 0};
  };
}

const WIDTH = 1920;
const HEIGHT = 952;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const sources = {
  portrait: { url: '/assets/fish-portrait-v1.png', focus: [.34, .45] },
  full: { url: '/assets/fish-full-v1.png', focus: [.63, .18] },
  future: { url: '/assets/new/fish-future-v3.png', focus: [.49, .21] },
};

// These ranges use the V23 narration clock, before insertion of the inner PV.
const narrativeShots = [
  { id: 'opening-testimony', start: 0, end: 17.52, side: 'left', asset: 'portrait', fade: .72, motionEnd: 27.8 },
  { id: 'opening-enforcement-close', start: 17.52, end: 24.74, side: 'left', asset: 'native-close', fade: .72 },
  { id: 'opening-testimony-return', start: 24.74, end: 27.8, side: 'left', asset: 'portrait', fade: .72, motionStart: 0 },
  { id: 'opening-question', start: 40.3, end: 59.4, side: 'right', asset: 'full' },
  { id: 'conditions-for-change', start: 1992.5, end: 2018.3, side: 'left', asset: 'portrait' },
  { id: 'closing-address', start: 2129, end: 2207.04, side: 'right', asset: 'future' },
];
const rhythmPortraits = new Set(['rhythm-03', 'rhythm-04', 'rhythm-07', 'rhythm-15', 'rhythm-21']);
const recordedScenes = new Set(['manual-labour', 'factory-work', 'dsh-creative-plugin', 'ownership-question']);
const softwareScenes = new Set(['side-v12_dsh_cloud', 'side-v12_flowise_agentflow', 'side-v12_msg_locator', 'side-v12_share_room']);

function safeStrip(rects, side) {
  if (!rects.length) {
    return { x: side === 'left' ? 0 : WIDTH - 980, width: 980, side };
  }
  const left = Math.max(0, Math.min(...rects.map(rect => rect.x)) - 18);
  const rightEdge = Math.min(WIDTH, Math.max(...rects.map(rect => rect.x + rect.width)) + 18);
  const right = WIDTH - rightEdge;
  return left >= right
    ? { x: 0, width: left, side: 'left' }
    : { x: rightEdge, width: right, side: 'right' };
}

function stripForShot(shot, protectedRects) {
  if (shot.asset !== 'native-close') return safeStrip(protectedRects, shot.side);
  // The opening evidence cards are staged in the right half of the frame.
  const evidenceSide = { x: 748, y: 0, width: WIDTH - 748, height: HEIGHT };
  return safeStrip([...protectedRects, evidenceSide], 'left');
}

export async function createFeatureCharacter({ director, originalLayer, avatar, narrationEnergy = () => 0 }) {
  const assets = Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([name, source]) => {
    const image = new Image();
    image.src = source.url;
    await image.decode();
    return [name, { ...source, image }];
  })));

  // A selected backdrop replaces any foreground copies of the model for that
  // frame. Its transparent surface also catches legacy scene-level draws.
  const surface = document.createElement('canvas');
  surface.width = avatar.canvas.width;
  surface.height = avatar.canvas.height;
  const plate = document.createElement('canvas');
  plate.width = WIDTH;
  plate.height = HEIGHT;
  const plateContext = plate.getContext('2d');
  const nativeCanvas = avatar.canvas;
  const nativeDraw = avatar.draw;
  let background = null;

  function applyAvatar(backdropOnly) {
    if (!backdropOnly) return;
    avatar.canvas = surface;
    avatar.draw = () => surface;
  }

  function restoreAvatar() {
    avatar.canvas = nativeCanvas;
    avatar.draw = nativeDraw;
  }

  function select({ audioTime, contentKind, protectedRects, presenceWindow, rhythm, supplied }) {
    let shot = contentKind === 'animation'
      ? narrativeShots.find(row => audioTime >= row.start && audioTime < row.end)
      : null;

    const portraitRhythm = contentKind === 'footage' && !supplied && rhythm?.kind === 'portrait' && rhythmPortraits.has(rhythm.id);
    const recorded = contentKind === 'footage' && recordedScenes.has(supplied?.id);
    const software = contentKind === 'software' && softwareScenes.has(presenceWindow?.subject);
    const sourceWindow = portraitRhythm ? rhythm : recorded ? supplied : software ? presenceWindow : null;
    if (sourceWindow) {
      const range = director.rangesForVisual(sourceWindow.start, sourceWindow.end)
        .find(row => audioTime >= row.start && audioTime < row.end);
      if (range) shot = { id: sourceWindow.id, start: range.start, end: range.end, side: 'left', asset: 'portrait' };
    }
    if (!shot) return null;
    const strip = stripForShot(shot, protectedRects);
    return strip.width >= (shot.asset === 'native-close' ? 500 : 250) ? { ...shot, strip } : null;
  }

  function drawBackground(ctx, time, descriptor) {
    const shot = descriptor.characterV4;
    if (!shot) {
      background = null;
      return originalLayer.drawBackground(ctx, time, descriptor);
    }

    // Put the image on the plate before the original scene paints its titles,
    // diagrams and source media. An extra strip guard handles inherited media.
    const nativeModel = shot.asset === 'native-close';
    const strip = stripForShot(shot, descriptor.protectedRects);
    if (strip.width < (nativeModel ? 500 : 250)) {
      background = { id: shot.id, drawn: false, reason: 'protected content fills the frame' };
      return background;
    }
    const elapsed = descriptor.audioTime - shot.start;
    const duration = shot.end - shot.start;
    const fadeTime = Math.min(shot.fade ?? 1.25, duration / 3);
    const opacity = ease(elapsed / fadeTime) * ease((duration - elapsed) / fadeTime) * (nativeModel ? .89 : .46);
    const motionStart = shot.motionStart ?? shot.start;
    const motionEnd = shot.motionEnd ?? shot.end;
    const progress = ease((descriptor.audioTime - motionStart) / (motionEnd - motionStart));
    const sign = strip.side === 'left' ? 1 : -1;
    let artwork;
    if (nativeModel) {
      nativeDraw.call(avatar, descriptor.audioTime, {
        framing: 'close', motionTime: descriptor.animationTime ?? descriptor.audioTime,
        energy: narrationEnergy(), mood: 'concerned', lookX: .16,
      });
      artwork = { image: nativeCanvas, focus: [.50, .50] };
    } else {
      artwork = assets[shot.asset];
    }
    const { image, focus } = artwork;
    const base = nativeModel ? Math.min(630, strip.width * .92) : shot.asset === 'portrait' ? 850 : 1090;
    const width = base * (1 + (nativeModel ? .035 : .11) * progress);
    const height = width * (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
    const motionTime = descriptor.audioTime - motionStart;
    const drift = nativeModel ? 14 * progress : 32 * (2 * progress - 1) + 13 * Math.sin(motionTime * .47);
    const x = strip.x + strip.width * .48 + sign * drift;
    const y = nativeModel ? 500 - 12 * progress : (strip.width < 460 ? 470 : 370) - 38 * progress + 12 * Math.sin(motionTime * .33);

    plateContext.clearRect(0, 0, WIDTH, HEIGHT);
    plateContext.save();
    plateContext.filter = nativeModel ? 'grayscale(1) brightness(.77) contrast(.93)' : 'grayscale(1) brightness(.62) contrast(.9)';
    plateContext.translate(x - strip.x, y);
    if (!nativeModel) plateContext.rotate(sign * (.015 - .035 * progress));
    plateContext.drawImage(image, -focus[0] * width, -focus[1] * height, width, height);
    plateContext.restore();

    // Feather the inside edge so the portrait recedes into the stage instead
    // of ending abruptly beside the protected recording.
    const fadeWidth = Math.min(95, strip.width * .23);
    const edge = strip.side === 'left' ? strip.width : 0;
    const mask = plateContext.createLinearGradient(edge - sign * fadeWidth, 0, edge, 0);
    mask.addColorStop(0, '#fff');
    mask.addColorStop(1, '#fff0');
    plateContext.save();
    plateContext.globalCompositeOperation = 'destination-in';
    plateContext.fillStyle = mask;
    plateContext.fillRect(0, 0, strip.width, HEIGHT);
    plateContext.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(plate, 0, 0, strip.width, HEIGHT, strip.x, 0, strip.width, HEIGHT);
    ctx.restore();

    background = { id: shot.id, drawn: opacity > .001, asset: shot.asset, layer: 'under-content',
      opacity, strip, pose: { x, y, width, height }, nativeModel, framing: nativeModel ? 'close' : null, subtitlePixelsTouched: false };
    return background;
  }

  return {
    select,
    applyAvatar,
    restoreAvatar,
    layer: {
      drawBackground,
      drawSide: (ctx, time, descriptor) => descriptor.characterV4 ? null : originalLayer.drawSide(ctx, time, descriptor),
      get audit() {
        const audit = originalLayer.audit;
        return background ? { ...audit, background, side: null, revision: 'V4' } : audit;
      },
      destroy() {
        restoreAvatar();
        plate.width = 1;
        plate.height = 1;
        originalLayer.destroy();
      },
    },
  };
}

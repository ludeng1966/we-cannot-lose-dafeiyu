/* Spatial motifs adapted from the embedded V23 PV's pv-opening.js.
 * Its sphere projection, oblique code tracks, and depth travel share the opener clock.
 */
const TAU = Math.PI * 2;
const PAPER = '#efe9dd';
const RED = '#bd6b60';
const SERIF = '"PV Serif", "Noto Serif SC", serif';
const MONO = '"PV Mono", "Microsoft YaHei", sans-serif';

const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;
const frac = value => value - Math.floor(value);
function ease(time, start, end) {
  const t = clamp((time - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function poly(ctx, points, color, width, opacity) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
  ctx.restore();
}

function text(ctx, value, x, y, size, family, color) {
  ctx.font = '500 ' + size + 'px ' + family;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

export function createOpeningPVStage(space, questions) {
  const tokens = ['{}', '</>', '[]', '=>', 'λ', '()', '&&', '::', '01', '+=', 'return', '...'];
  const codeTextures = tokens.map((token, index) => {
    const image = document.createElement('canvas');
    image.width = 220;
    image.height = 104;
    const ctx = image.getContext('2d');
    text(ctx, token, 110, 52, 48, MONO, index % 5 === 0 ? RED : PAPER);
    ctx.fillStyle = 'rgba(239,233,221,.30)';
    ctx.fillRect(48, 89, 124, 1);
    return image;
  });

  // V23 drawOrrery: one rotating unit sphere, three oblique exterior rings,
  // and small type orbiting in the same projected space.
  function drawOrrery(ctx, time, camera) {
    const t = time * 2.12;
    const voyage = ease(time, 2.4, 5.5) * (1 - ease(time, 10.6, 14.25));
    const coda = ease(time, 13.2, 16.45);
    const cx = mix(1080 + Math.sin(t * .29 + 1.0) * 415, 960, coda) + camera.x * .24;
    const cy = 540 + Math.sin(t * .42) * 78 + camera.y * .29;
    const radius = mix(mix(490 + Math.sin(t * .38) * 160, 705 + Math.sin(t * .31) * 94, voyage), 850, coda);
    const yaw = t * .115 + Math.sin(t * .11) * .35 + camera.yaw * .40;
    const pitch = .38 + Math.sin(t * .19) * .13 + camera.pitch * .24;
    const roll = -.20 + t * .013 + Math.sin(t * .2) * .07 + camera.roll;
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    function project(x, y, z) {
      const xx = x * cyaw - z * syaw;
      const zz = x * syaw + z * cyaw;
      const yy = y * cp - zz * sp;
      const depth = y * sp + zz * cp;
      const scale = 1 / (1 + depth * .33);
      return [cx + (xx * cr - yy * sr) * radius * scale, cy + (xx * sr + yy * cr) * radius * scale];
    }
    const visibility = ease(time, -.75, .7);
    ctx.save();
    ctx.globalAlpha *= mix(.55, .82, voyage) * (1 - .59 * coda) * visibility;
    for (let meridian = 0; meridian < 20; meridian++) {
      const phi = meridian / 20 * TAU;
      const points = [];
      for (let step = 0; step <= 64; step++) {
        const theta = -Math.PI / 2 + step / 64 * Math.PI;
        points.push(project(Math.cos(theta) * Math.cos(phi), Math.sin(theta), Math.cos(theta) * Math.sin(phi)));
      }
      poly(ctx, points, PAPER, .75, meridian % 4 === 0 ? .36 : .14);
    }
    for (let band = 1; band < 13; band++) {
      const theta = -Math.PI / 2 + band / 13 * Math.PI;
      const points = [];
      for (let step = 0; step <= 88; step++) {
        const phi = step / 88 * TAU;
        points.push(project(Math.cos(theta) * Math.cos(phi), Math.sin(theta), Math.cos(theta) * Math.sin(phi)));
      }
      poly(ctx, points, PAPER, .8, band % 3 === 0 ? .38 : .16);
    }
    for (let ring = 0; ring < 3; ring++) {
      const points = [];
      for (let step = 0; step <= 126; step++) {
        const a = step / 126 * TAU;
        points.push(project(Math.cos(a) * (1.24 + ring * .09), Math.sin(a) * .18, Math.sin(a) * (1.24 + ring * .09)));
      }
      poly(ctx, points, ring === 0 ? RED : PAPER, ring === 0 ? 1.7 : .6, ring === 0 ? .8 : .30);
    }
    if (time >= 0) questions.forEach((q, i) => {
      const a = i / questions.length * TAU + t * .06;
      const p = project(Math.cos(a) * 1.5, Math.sin(a) * .9, Math.sin(a) * .65);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(a + Math.PI / 2 + roll);
      ctx.globalAlpha *= .31;
      text(ctx, q.keyword, 0, 0, 20, SERIF, PAPER);
      ctx.restore();
    });
    ctx.restore();
    return {x:cx, y:cy, radius, yaw, pitch, roll};
  }

  // V23 drawRadialDepth: wrapped depth is invisible at the seam.
  function drawRadialDepth(ctx, time, camera) {
    if (time < 0) return;
    const t = time * 2.12;
    const alpha = ease(time, 0, .82) * (1 - .76 * ease(time, 12.25, 16));
    const cx = 1190 + Math.sin(t * .23) * 170 + camera.x * .28;
    const cy = 520 + Math.cos(t * .27) * 65 + camera.y * .29;
    const angle = -.12 - t * .045 + camera.roll;
    ctx.save();
    for (let ring = 0; ring < 9; ring++) {
      const z = 1 - frac((ring * 230 + t * 120) / 2100);
      const radius = 70 + z * z * 1650;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * .44, angle + ring * .025, 0, TAU);
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = .7;
      ctx.globalAlpha = alpha * .14 * Math.sin(Math.PI * z) ** 2;
      ctx.stroke();
    }
    questions.forEach((q, i) => {
      const a = i / questions.length * TAU + angle;
      const z = frac(i * .37 + t * .045);
      const radius = 440 + z * 1150;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * .65);
      ctx.rotate(a + (Math.cos(a) < 0 ? Math.PI : 0));
      ctx.globalAlpha = alpha * .14 * Math.sin(Math.PI * z) ** 2;
      text(ctx, q.text, 0, 0, 28 + z * 20, SERIF, PAPER);
      ctx.restore();
    });
    ctx.restore();
  }

  // V23 drawCodePassage: three angled tracks, with 2D textures depth-sorted
  // before their perspective pass. The same projection drives the track lines.
  function drawCodePassage(ctx, time, camera) {
    const passage = ease(time, 2.75, 4.38) * (1 - ease(time, 11.55, 14.3));
    const coda = .15 * ease(time, 12.3, 13.3) * (1 - ease(time, 16.1, 17.8));
    const opacity = passage * .72 + coda;
    if (opacity < .001) return null;
    const age = (time - 3.7) * 2.12;
    const camYaw = age * .155 - .32 + camera.yaw * .27;
    const camPitch = .25 + Math.sin(age * .19) * .13 + camera.pitch * .22;
    const cyaw = Math.cos(camYaw), syaw = Math.sin(camYaw);
    const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
    const cx = 960 + Math.sin(age * .21) * 125 + camera.x * .36;
    const cy = 525 + Math.cos(age * .17) * 38 + camera.y * .37;
    function project(x, y, z) {
      const xx = x * cyaw - z * syaw;
      const zz = x * syaw + z * cyaw;
      const yy = y * cp - zz * sp;
      const depth = 1370 + (camera.depth - 1300) * .52 + y * sp + zz * cp;
      return {x: cx + xx * 1100 / depth, y: cy + yy * 1100 / depth, depth};
    }
    const frontArcs = [];
    for (let ring = 0; ring < 3; ring++) {
      const points = [];
      let near = [];
      for (let step = 0; step <= 96; step++) {
        const a = step / 96 * TAU, tilt = (ring - 1) * .44, r = 650 + ring * 90;
        const p = project(Math.cos(a) * r, Math.sin(a) * Math.sin(tilt) * r, Math.sin(a) * Math.cos(tilt) * r);
        points.push([p.x, p.y]);
        if (p.depth < 1040) near.push([p.x, p.y]);
        else if (near.length) {
          if (near.length > 1) frontArcs.push({points:near, accent:ring === 1});
          near = [];
        }
      }
      if (near.length > 1) frontArcs.push({points:near, accent:ring === 1});
      poly(ctx, points, ring === 1 ? RED : PAPER, ring === 1 ? 1.8 : .8, opacity * (ring === 1 ? .58 : .30));
    }
    const entries = codeTextures.map((image, i) => {
      const ring = i % 3;
      const a = i / codeTextures.length * TAU + age * (.105 + ring * .027);
      const r = 650 + ring * 90, tilt = (ring - 1) * .44;
      const p = project(Math.cos(a) * r, Math.sin(a) * Math.sin(tilt) * r, Math.sin(a) * Math.cos(tilt) * r);
      const back = clamp((p.depth - 700) / 1700);
      return {image, pose: {x:p.x, y:p.y, width:220, height:104, depth:p.depth,
        yaw:Math.sin(a - camYaw) * .48, pitch:camPitch * .22, roll:Math.sin(a) * .075,
        opacity:opacity * mix(.76, .25, back)}};
    }).sort((a,b) => b.pose.depth - a.pose.depth);
    const rear = entries.filter(entry => entry.pose.depth >= 1040);
    const front = entries.filter(entry => entry.pose.depth < 1040);
    function paint(planes) {
      if (space.drawPlanes) space.drawPlanes(ctx, planes);
      else for (const entry of planes) space.drawPlane(ctx, entry.image, entry.pose);
    }
    paint(rear);
    return {
      audit:{planes:entries.length, frontPlanes:front.length, rearPlanes:rear.length,
        opacity, cameraYaw:camYaw, cameraPitch:camPitch,
        depthRange:[entries.at(-1).pose.depth, entries[0].pose.depth]},
      drawFront() {
        ctx.save();
        ctx.globalAlpha *= .63;
        frontArcs.forEach(arc => poly(ctx, arc.points, arc.accent ? RED : PAPER,
          arc.accent ? 1.9 : .8, opacity * (arc.accent ? .72 : .36)));
        paint(front);
        ctx.restore();
      }
    };
  }

  return {drawOrrery, drawRadialDepth, drawCodePassage,
    destroy: () => codeTextures.forEach(texture => {texture.width = 1; texture.height = 1;})};
}

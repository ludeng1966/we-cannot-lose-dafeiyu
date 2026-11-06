/* Opening V5. The embedded PV's spatial grammar on the 18-second music clock. */
import {createPVSpace} from './pv-space.js';
import {drawGrowthBackdrop, growthShotAt} from './history-growth-backdrop.js?v=4';
import {createOpeningPVStage} from './opening-pv-motion.js?v=5';

const WIDTH = 1920;
const HEIGHT = 1080;
const INK = '#080a0c';
const PAPER = '#efe9dd';
const MUTED = '#beb9ad';
const ACCENT = '#bd6b60';
const SERIF = '"PV Serif", "Noto Serif SC", serif';
const MONO = '"PV Mono", "Microsoft YaHei", sans-serif';
const characterShots = [
  {asset:'fish-portrait-v1.png', role:'archive-close', layer:'background', start:0, end:4,
    xFrom:1750, xTo:1390, y:596, width:1070, depth:1430, approach:365, tint:.32, opacity:.88},
  {asset:'fish-full-v1.png', role:'orbital-crossing', layer:'foreground', start:4, end:8.14,
    xFrom:1870, xTo:1190, y:555, width:675, depth:1550, approach:545, tint:.12, opacity:.95},
  {asset:'new/fish-singing-v3.png', role:'singing', layer:'foreground', start:8.14, end:10.66,
    xFrom:1880, xTo:1380, y:604, width:920, depth:1460, approach:430, tint:.15, opacity:.92},
  {asset:'new/fish-future-v3.png', role:'reach', layer:'foreground', start:10.66, end:14,
    xFrom:1870, xTo:1390, y:620, width:1010, depth:1490, approach:484, tint:.16, opacity:.92}
];

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;
function ease(time, start, end) {
  const t = clamp((time - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function cameraAt(time) {
  const approach = ease(time, -.4, 3.8);
  const sweep = ease(time, 3.45, 7.9);
  const turn = ease(time, 7.55, 12.45);
  const settle = ease(time, 12.3, 16.6);
  const closePass = ease(time, 6.92, 7.82) * (1 - ease(time, 8.35, 9.42));
  return {
    x: -145 + approach * 227 - sweep * 350 + turn * 510 - settle * 239,
    y: 30 - approach * 73 + sweep * 111 - turn * 116 + settle * 47,
    depth: 1630 - approach * 563 + sweep * 265 - closePass * 202 - turn * 410 + settle * 280,
    yaw: -.65 + approach * .96 - sweep * .81 + turn * 1.19 - settle * .39,
    pitch: .13 + approach * .16 + sweep * .22 - turn * .35 + settle * .08,
    roll: -.08 + approach * .12 - sweep * .18 + turn * .24 - settle * .16
  };
}

function label(ctx, value, x, y, size, color = PAPER, family = SERIF, weight = 600, align = 'left') {
  ctx.font = weight + ' ' + size + 'px ' + family;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function rule(ctx, x, y, length, color, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, length, 1);
  ctx.restore();
}

function imageCover(ctx, image, camera, alpha, travel) {
  if (!image || alpha <= .001) return;
  const zoom = 1.24 + travel * .13;
  const scale = Math.max(WIDTH / image.width, HEIGHT / image.height) * zoom;
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(WIDTH / 2 - camera.x * .50, HEIGHT / 2 - camera.y * .63);
  ctx.rotate(camera.roll * .15);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawWorld(ctx, time, camera, archive, workshop) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const workshopIn = ease(time, 3.0, 5.0);
  const workshopOut = ease(time, 9.4, 12.55);
  const workshopAmount = workshopIn * (1 - workshopOut);
  const travel = ease(time, -4.5, 18);
  imageCover(ctx, archive, camera, .45 - .26 * workshopAmount, travel);
  imageCover(ctx, workshop, camera, .48 * workshopAmount, travel);

  const light = ctx.createLinearGradient(0, 0, WIDTH, 0);
  light.addColorStop(0, 'rgba(5,8,11,.79)');
  light.addColorStop(.38, 'rgba(5,8,11,.48)');
  light.addColorStop(.71, 'rgba(5,8,11,.13)');
  light.addColorStop(1, 'rgba(5,8,11,.37)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const edge = ctx.createRadialGradient(1220, 470, 280, 1080, 505, 1230);
  edge.addColorStop(0, 'rgba(3,5,8,0)');
  edge.addColorStop(1, 'rgba(3,5,8,.57)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function buildPlate(question, count) {
  const plate = document.createElement('canvas');
  plate.width = 1050;
  plate.height = 640;
  const ctx = plate.getContext('2d');
  label(ctx, '形 象 史', 6, 43, 26, MUTED, SERIF, 650);
  label(ctx, question.date, 4, 130, 91, PAPER, MONO, 550);
  rule(ctx, 7, 190, 180, ACCENT, .86);
  rule(ctx, 187, 190, 300, PAPER, .22);
  label(ctx, question.before, 7, 286, 55, PAPER, SERIF, 600);

  const size = Math.min(170, 955 / Math.max(1, [...question.keyword].length));
  label(ctx, question.keyword, 1, 427, size, PAPER, SERIF, 900);
  if (question.after) label(ctx, question.after, 9, 549, 56, PAPER, SERIF, 600);
  label(ctx, String(question.index).padStart(2, '0') + ' / ' + String(count).padStart(2, '0'),
    10, 617, 22, MUTED, MONO, 500);
  return plate;
}

function tintPortrait(image, amount) {
  if (!image) return null;
  const texture = document.createElement('canvas');
  texture.width = image.width;
  texture.height = image.height;
  const ctx = texture.getContext('2d');
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(8,11,16,' + amount + ')';
  ctx.fillRect(0, 0, texture.width, texture.height);
  return texture;
}

function drawNearArch(ctx, time) {
  const seam = characterShots.slice(1).find(shot => Math.abs(time - shot.start) < .36);
  if (!seam) return null;
  const at = clamp((time - seam.start + .36) / .72);
  const opacity = Math.sin(at * Math.PI) ** 2;
  const edge = mix(1970, 1060, at);
  ctx.save();
  ctx.transform(1, 0, -.15, 1, 74, 0);
  const shade = ctx.createLinearGradient(edge - 250, 0, edge + 570, 0);
  shade.addColorStop(0, 'rgba(5,7,9,0)');
  shade.addColorStop(.28, 'rgba(5,7,9,' + opacity * .83 + ')');
  shade.addColorStop(.68, 'rgba(5,7,9,' + opacity * .94 + ')');
  shade.addColorStop(1, 'rgba(5,7,9,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(edge - 250, 0, 820, HEIGHT);
  ctx.restore();
  return {time:seam.start, opacity, edge};
}

function drawTitle(ctx, time, camera, title) {
  const arrive = ease(time, 14, 15.42);
  if (arrive <= .001) return;
  ctx.save();
  ctx.globalAlpha = arrive;
  const center = ctx.createRadialGradient(958, 553, 210, 958, 553, 955);
  center.addColorStop(0, 'rgba(7,9,11,.63)');
  center.addColorStop(1, 'rgba(7,9,11,0)');
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.translate(960 + camera.x * .10 + (1 - arrive) * 108, 540 + camera.y * .14 + (1 - arrive) * 57);
  ctx.rotate((1 - arrive) * -.07);
  const scale = mix(.57, 1.018, arrive) + .012 * ease(time, 15.45, 16.12);
  ctx.scale(scale, scale);
  ctx.save();
  ctx.globalAlpha *= .17 * (1 - arrive);
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 2;
  for (let ring = 0; ring < 7; ring++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 270 + ring * 125, 60 + ring * 76, time * .17, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  label(ctx, title.before, 0, -118, 137, PAPER, SERIF, 680, 'center');
  label(ctx, title.keyword, 0, 150, 287, PAPER, SERIF, 900, 'center');
  const lineWidth = 522 * ease(time, 14.5, 15.85);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(-lineWidth / 2, 347, lineWidth, 3);
  ctx.restore();
}

export async function createHistoryOpening(options = {}) {
  const response = await fetch('/history-data.json', {cache: 'no-store'});
  if (!response.ok) throw new Error('开场资料尚未就绪');
  const data = await response.json();
  const duration = Number(data.duration) || 18;
  const title = data.questions.at(-1);
  const questions = data.questions.slice(0, -1);
  const loadAsset = options.loadAsset || (src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  }));
  const fonts = [
    new FontFace('PV Serif', 'url(/assets/fonts/revolution-serif.ttf)', {weight: '100 900'}),
    new FontFace('PV Mono', 'url(/assets/fonts/bahnschrift.ttf)', {weight: '100 900'})
  ];
  const [archive, workshop, images] = await Promise.all([
    loadAsset('/assets/generated-archive-v1.png'),
    loadAsset('/assets/generated-workshop-v1.png'),
    Promise.all(characterShots.map(shot => loadAsset('/assets/' + shot.asset))),
    ...fonts.map(async face => document.fonts.add(await face.load()))
  ]);
  await document.fonts.ready;
  const space = options.space || createPVSpace({width: WIDTH, height: HEIGHT});
  const plates = questions.map(q => buildPlate(q, questions.length));
  const stage = createOpeningPVStage(space, questions);
  const textures = images.map((image,index) => tintPortrait(image, characterShots[index].tint));

  function drawCharacter(ctx, time, camera, growth) {
    const index = characterShots.findIndex(shot => time >= shot.start && time < shot.end);
    if (index < 0 || !textures[index]) return null;
    const shot = characterShots[index];
    const portrait = textures[index];
    const enter = ease(time, shot.start, shot.start + (index === 0 ? .72 : .35));
    const exit = ease(time, shot.end - (index === 3 ? .78 : .43), shot.end);
    const opacity = shot.opacity * enter * (1 - exit) * (1 - .85 * (growth?.wide ?? 0));
    if (opacity <= .001) return null;
    const travel = clamp((time - shot.start) / (shot.end - shot.start));
    const arc = Math.sin(travel * Math.PI);
    // The PV's orbit crossing advances from the right through a sine depth arc.
    const width = shot.width + (index === 3 ? 95 * travel : 0);
    const pose = {
      x: mix(shot.xFrom, shot.xTo, travel) + camera.x * .21 - exit * 92,
      y: shot.y - arc * 44 + camera.y * .29 + exit * 30,
      width,
      height: width * portrait.height / portrait.width,
      depth: shot.depth - arc * shot.approach + exit * 155,
      yaw: -.21 + travel * .40 + camera.yaw * .10,
      pitch: .025 * arc + camera.pitch * .09,
      roll: -.025 + travel * .05 + camera.roll * .19,
      opacity
    };
    space.drawPlane(ctx, portrait, pose);
    return {asset:shot.asset, role:shot.role, layer:shot.layer, ...pose};
  }

  function drawDateAndCopy(ctx, time, camera) {
    const index = questions.findIndex(q => time >= q.start && time < q.end);
    if (index < 0) return null;
    const q = questions[index];
    const age = time - q.start;
    const arrive = ease(age, 0, .50);
    const depart = ease(time, q.end - .41, q.end);
    const opacity = (index === 0 ? mix(.51, 1, arrive) : ease(age, 0, .37)) * (1 - depart);
    if (opacity <= .001) return null;
    // A single PV typography plane arrives from depth, settles, then passes the lens.
    const scale = mix(.82, 1, arrive) * (1 + depart * .35);
    space.drawPlane(ctx, plates[index], {
      x: 650 + (1 - arrive) * 790 - depart * 930 - camera.x * .10,
      y: 541 + (1 - arrive) * 146 + depart * 94,
      width:1050 * scale,
      height:640 * scale,
      depth: 1100 + (1 - arrive) * 850 - depart * 415,
      yaw: (1 - arrive) * .75 - depart * .79 + camera.yaw * .035,
      pitch: (1 - arrive) * .18 + camera.pitch * .041,
      roll: (1 - arrive) * .16 - depart * .20 + camera.roll * .09,
      opacity
    });
    return q;
  }

  function drawEnvironment(ctx, time, camera) {
    drawWorld(ctx, time, camera, archive, workshop);
    return stage.drawOrrery(ctx, time, camera);
  }

  function drawBackdrop(ctx, openingTime = 0) {
    const t = openingTime - 4.5;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    drawEnvironment(ctx, t, cameraAt(t));
    ctx.restore();
  }

  function draw(ctx, value) {
    const t = clamp(Number(value) || 0, 0, duration);
    const camera = cameraAt(t);
    const growth = growthShotAt(t);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    const orbits = drawEnvironment(ctx, t, camera);
    stage.drawRadialDepth(ctx, t, camera);
    const passage = stage.drawCodePassage(ctx, t, camera);
    const character = drawCharacter(ctx, t, camera, growth);
    passage?.drawFront();
    const occlusion = drawNearArch(ctx, t);
    if (growth) drawGrowthBackdrop(ctx, camera, growth);
    const question = drawDateAndCopy(ctx, t, camera);
    drawTitle(ctx, t, camera, title);
    ctx.restore();

    const audit = {
      version: 'V5-embedded-pv-motion', time: t, duration, sourceMusicTime: t, camera,
      chapter: t >= title.start ? 'final-title' : 'history',
      shot: t < 4 ? 'archive-approach' : t < 8.14 ? 'orbital-crossing' : t < 14 ? 'turn-and-reach' : 'title-settle',
      visibleQuestions: question ? [question.id] : [],
      date: question?.date || null,
      characterCount: character ? 1 : 0,
      currentCharacter: character?.asset || null,
      generatedCharacter: character,
      foregroundCharacterCount: character?.layer === 'foreground' ? 1 : 0,
      backgroundCharacterCount: character?.layer === 'background' ? 1 : 0,
      orbits, occlusion, growth,
      codePassage: passage?.audit || null,
      deterministic: true,
      renderLayer: space.available ? 'webgl2-perspective-planes+canvas2d' : 'canvas2d-fallback'
    };
    if (ctx.canvas?.dataset) ctx.canvas.dataset.pv = JSON.stringify(audit);
    return audit;
  }

  return {duration, data, draw, drawBackdrop, destroy: () => {
    stage.destroy();
    space.destroy();
  }};
}

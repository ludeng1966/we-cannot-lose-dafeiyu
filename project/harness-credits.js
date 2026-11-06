import {createPVSpace} from '/feature/pv-space.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const INK = '#191919', DARK = '#101112', IVORY = '#f3efe5';
const LIGHT_RED = '#cf6570';
const MONO = '"Bahnschrift", "Consolas", monospace';
const SERIF = '"PV Serif", "SimSun", serif';
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = value => { const x = clamp(value); return x * x * (3 - 2 * x); };
const nameOf = person => person.login ?? person.name;
const countOf = count => count.toLocaleString('en-US');

export const HARNESS_CUES = {
  dossier: 8.917,
  interlude: 42.55,
  community: 54.36,
  assembly: 150.465,
  close: 159.784,
  decay: 169.20
};

const CUE = HARNESS_CUES;

const HISTORY = [
  ['1956', '人工智能诞生', '达特茅斯夏季研讨会确立研究方向'],
  ['1983', 'GNU计划宣布', '以自由软件重建共享与协作'],
  ['1993', '万维网向公众开放', 'CERN 将万维网软件放入公共领域'],
  ['1998', '开源运动正式命名', '“Open Source”成为开放开发的共同名称'],
  ['2005', 'Git诞生', '分布式版本控制让全球开发者并行协作'],
  ['2012', 'AlexNet深度学习突破', '公开论文与 ImageNet 共享评测'],
  ['2024', '开源AI定义1.0发布', '使用、研究、修改、分享'],
  ['2025', 'DeepSeek-R1发布', '开放权重与技术报告']
];

const STATEMENTS = [
  '开源是互联网最重要的精神',
  '很长一段时间',
  '开源意识在国内十分微薄',
  '随着越来越多人接触开源社区',
  '这种开源精神逐渐发扬',
  '更重要的是',
  '在平凡的互联网精神之下',
  '是无数劳动人民对自由劳动的追求',
  '代码与知识本是全人类共同的财富',
  '却被资本筑起高墙与专利的藩篱',
  '今天，我们团结在一起',
  '共同抵抗这种打压',
  '这是我们所做的宣言',
  '我们力量弱小',
  '但我们势不可挡',
  '团结的人民永远不被击败！',
  '团结的人民永远不被击败！',
  '团结的人民永远不被击败！'
];


function label(ctx, value, x, y, size, {
  color = INK, align = 'left', family = MONO, weight = 500, max = Infinity
} = {}) {
  ctx.font = `${weight} ${size}px ${family}`;
  const width = ctx.measureText(value).width;
  if (width > max) ctx.font = `${weight} ${size * max / width}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`片尾素材加载失败 ${url}`));
    image.src = url;
  });
}

function newCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function figureMask(character) {
  const width = 1000, height = Math.round(width * character.height / character.width);
  const mask = newCanvas(width, height);
  const ctx = mask.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(character, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const rows = [];
  for (let y = 16; y < height - 11; y += 24) {
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const inside = x < width && [y - 9, y, y + 9].every(row => pixels[(row * width + x) * 4 + 3] > 215);
      if (inside && start < 0) start = x;
      if (!inside && start >= 0) {
        if (x - start >= 65) rows.push({y, start: start + 4, end: x - 4});
        start = -1;
      }
    }
  }
  return {mask, rows};
}

function makeFigure(mask, rows, names, first) {
  const {width, height} = mask;
  const canvas = newCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.globalAlpha = .54;
  ctx.drawImage(mask, 0, 0);
  ctx.globalAlpha = 1;
  let index = first;
  for (const {y, start, end} of rows) {
    let x = start;
    while (end - x >= 58 && index < names.length) {
      const name = names[index];
      const max = end - x;
      const color = index % 7 === 0 ? '#ffc0c6' : '#f8eddf';
      label(ctx, name, x, y, 19, {color, weight: 700, max});
      x += ctx.measureText(name).width + 13;
      index++;
    }
  }
  return {canvas, first, lastName: index};
}

function orbit(ctx, t, x, y, radius, foreground, dark) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate(-.78 + i * .72 + .20 * Math.sin(t * .22 + i));
    ctx.setLineDash(i === 1 ? [5, 9] : []);
    ctx.strokeStyle = i === 1 ? (dark ? '#cf6570c4' : '#8e2634ae') : (dark ? '#f3efe5ad' : '#392c2979');
    ctx.lineWidth = i === 1 ? 2 : 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (1 - i * .08), radius * (.28 + .09 * i), 0,
      foreground ? 0 : Math.PI, foreground ? Math.PI : TAU);
    ctx.stroke();
    const angle = t * .49 + i * 2.5;
    if ((Math.sin(angle) >= 0) === foreground) {
      ctx.setLineDash([]);
      ctx.fillStyle = dark ? IVORY : RED;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius * (1 - i * .08),
        Math.sin(angle) * radius * (.28 + .09 * i), 4.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function creditTexture(people, core, canvas = newCanvas(core ? 960 : 318, core ? 368 : 300)) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const half = Math.ceil(people.length / 2);
  for (const [i, person] of people.entries()) {
    const side = core && i >= half ? 1 : 0;
    const row = core ? i % half : i;
    const x = 452 * side + 29 + 14 * Math.sin(i * 2.4);
    const y = (core ? 63 : 35) * row + (core ? 34 : 27) + side * 25;
    ctx.shadowColor = '#09090a';
    ctx.shadowBlur = 9;
    const size = core ? 51 - (row % 3) * 5 : 33 - (row % 3) * 2;
    const color = i === 0 ? '#f09498' : IVORY;
    label(ctx, nameOf(person), x, y, size, {color, weight: 700, max: core ? 405 : 260});
    if (core && person.contributions != null) {
    label(ctx, countOf(person.contributions), x + 14, y + 27, 17, {color: '#bcb1a6'});
    }
  }
  return canvas;
}

function historyTexture(image, [year, title, note], credit) {
  const canvas = newCanvas(860, 735);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111012f0';
  ctx.fillRect(0, 0, 860, 735);

  const scale = Math.min(812 / image.width, 501 / image.height);
  const width = image.width * scale, height = image.height * scale;
  ctx.drawImage(image, (860 - width) / 2, 17 + (501 - height) / 2, width, height);
  line(ctx, 28, 530, 832, 530, '#ceaca277');
  label(ctx, year + '年', 28, 581, 64, {color: '#f09498', weight: 700});
  label(ctx, title, 252, 584, 46, {family: SERIF, color: IVORY, weight: 700, max: 575});
  label(ctx, note, 30, 652, 31, {family: SERIF, color: '#f1e0cf', max: 802});
  const annotation = year === '2012' ? credit + ' · 2012年原始代码于2025年公开' : credit;
  label(ctx, annotation, 30, 705, 21, {family: SERIF, color: '#c9b9b3', max: 802});
  return canvas;
}

async function loadHistory() {
  const base = '/assets/harness-history';
  const sources = await Promise.all(['early', 'late'].map(async part => {
    const response = await fetch(`${base}/${part}-sources.json`, {cache: 'no-store'});
    if (!response.ok) throw new Error('历史图像来源表加载失败');
    const data = await response.json();
    return Array.isArray(data) ? data : data.entries;
  }));
  const byYear = new Map(sources.flat().map(row => [String(row.year), row]));
  return Promise.all(HISTORY.map(async event => {
    const [year] = event;
    const image = await loadImage(`${base}/${year}.png`);
    const source = byYear.get(year);
    return {year, image: historyTexture(image, event, source?.credit || '')};
  }));
}

export async function createHarnessCredits() {
  const root = '/assets/pv-opening';
  const [response, character, portrait, archive, workshop, history] = await Promise.all([
    fetch('/harness-outro-catalog.json', {cache: 'no-store'}),
    loadImage(`${root}/fish-full-v1.png`),
    loadImage(`${root}/fish-portrait-v1.png`),
    loadImage(`${root}/generated-archive-v1.png`),
    loadImage(`${root}/generated-workshop-v1.png`),
    loadHistory()
  ]);
  if (!response.ok) throw new Error('DeepSeek Harness 片尾名录加载失败');
  const {contributors, owners, pluginCount, featured} = await response.json();
  if (!contributors?.length || !owners?.length || !featured?.length) throw new Error('片尾名录不完整');

  const space = createPVSpace({width: W, height: H});
  const names = [
    ...owners.filter((_, index) => index % 4 !== 0).map(nameOf),
    ...contributors.map(nameOf),
    ...owners.filter((_, index) => index % 4 === 0).map(nameOf)
  ];
  const {mask, rows} = figureMask(character);
  const figureCues = [[15, 21], [29, 38], [60, 70], [76, 87], [93, 105], [110, 123], [130, 144]];
  let firstName = 0;
  const cameoFigures = figureCues.map(([start, end]) => {
    const figure = makeFigure(mask, rows, names, firstName);
    firstName = figure.lastName;
    return {...figure, start, end};
  });
  const coreSize = 10, ownerSize = 8;
  const coreClusters = Math.ceil(contributors.length / coreSize);
  const ownerClusters = Math.ceil(owners.length / ownerSize);
  const coreCache = new Map(), ownerCache = new Map();
  const coreTotal = countOf(contributors.length), ownerTotal = countOf(owners.length);
  const figureWidth = height => height * character.width / character.height;
  const projection = (x, y, depth, camera) => ({
    x: 960 + (x - camera.x) * 1100 / depth,
    y: 540 + (y - camera.y) * 1100 / depth,
    depth,
    yaw: -camera.yaw,
    pitch: camera.pitch,
    roll: -camera.roll
  });
  const heading = (ctx, text, x, y, size, color = IVORY) =>
    label(ctx, text, x, y, size, {family: SERIF, weight: 700, color});

  function cameraAt(t) {
    return {
      x: 143 * Math.sin(t * .113) + 44 * Math.sin(t * .261),
      y: 49 * Math.sin(t * .151 + .7),
      yaw: .20 * Math.sin(t * .099 + .7),
      pitch: .10 * Math.sin(t * .124),
      roll: .044 * Math.sin(t * .096 + .1),
      dolly: 53 * Math.sin(t * .17) + 21 * Math.sin(t * .36)
    };
  }

  function boards(ctx, t, camera) {
    ctx.fillStyle = DARK;
    ctx.fillRect(0, 0, W, H);
    const cross = (start, end) => ease((t - start) / 3) * (1 - ease((t - end) / 3));
    const workshopWeight = Math.max(cross(24, 48), cross(74.737, 105), cross(132, 151));
    space.drawPlanes(ctx, [
      {image: archive, pose: {...projection(-camera.x * .22, 4, 1470 + camera.dolly, camera), width: 3370,
        height: 3370 * archive.height / archive.width, opacity: .43 * (1 - workshopWeight)}},
      {image: workshop, pose: {...projection(camera.x * .14, 0, 1340 + camera.dolly * 1.2, camera), width: 3080,
        height: 3080 * workshop.height / workshop.width, opacity: .47 * workshopWeight}}
    ]);

    const vignette = ctx.createRadialGradient(960, 480, 280, 960, 500, 1130);
    vignette.addColorStop(0, '#13131514');
    vignette.addColorStop(1, '#08080bd8');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function presence(t, camera) {
    const swing = Math.sin(t * .115);
    const portraitY = 72 + 92 * Math.sin(t * .136);
    const phase = ease((t - 7) / 3);
    const quiet = 1 - ease((t - 148) / 4);
    return [
      {image: portrait, pose: {...projection(475 * swing + 420, portraitY, 1460, camera),
        width: 1020, height: 1020 * portrait.height / portrait.width, opacity: mix(.29, .17, phase) * quiet}},
      {image: character, pose: {...projection(-590 - 170 * swing, 55, 1360 - 110 * swing, camera),
        width: figureWidth(900), height: 900, yaw: camera.yaw - .14, roll: .05 * swing,
        opacity: (.09 + .11 * Math.sin(t * .19) ** 2) * phase * quiet}}
    ];
  }

  function figureCameo(t, camera) {
    const index = cameoFigures.findIndex(figure => t > figure.start && t < figure.end);
    if (index < 0) return null;
    const {canvas, start, end, first, lastName} = cameoFigures[index];
    const span = end - start;
    const progress = (t - start) / span;
    const opacity = ease((t - start) / 1.65) * (1 - ease((t - end + 1.8) / 1.8));
    const direction = index % 2 === 0 ? -1 : 1;
    const x = index < 2 ? -98 + 125 * Math.sin(progress * Math.PI)
      : direction * mix(532, 294, ease(progress));
    const height = mix(900, 1150, progress);
    return {image: canvas, first, lastName, pose: {
      ...projection(x, 40 - 81 * progress, 1480 - 165 * progress, camera),
      width: figureWidth(height), height, opacity: .36 * opacity,
      yaw: direction * mix(-.22, .17, progress) - camera.yaw
    }};
  }

  function historyPlanes(t, camera) {
    const segment = (CUE.interlude - CUE.dossier) / history.length;
    const position = (t - CUE.dossier) / segment;
    const active = [];
    for (const [index, card] of history.entries()) {
      const age = position - index;
      const opacity = ease((age + .13) / .24) * (1 - ease((age - .86) / .24));
      if (opacity < .001) continue;
      const entry = ease((age + .13) / .30);
      const exit = ease((age - .75) / .37);
      const focus = clamp(age);
      const x = 485 + mix(166, -45, entry) + exit * 91 + 22 * Math.sin(t * .46);
      const y = 5 + mix(62, -6, entry) - exit * 56;
      const depth = mix(1460, 1050, entry) - focus * 72 + exit * 122;
      const pose = projection(x, y, depth, {...camera, x: camera.x * .22, y: camera.y * .55});
      pose.x = Math.min(pose.x, W - 70 - 380 * 1100 / depth);
      active.push({year: card.year, image: card.image, pose: {
        ...pose, width: 760, height: 760 * card.image.height / card.image.width,
        yaw: mix(-.29, .03, entry) - camera.yaw * .36, opacity
      }});
    }
    return active;
  }

  function namePlanes(t, camera, core) {
    const people = core ? contributors : owners;
    const size = core ? coreSize : ownerSize;
    const count = core ? coreClusters : ownerClusters;
    const cache = core ? coreCache : ownerCache;
    const start = core ? CUE.dossier : CUE.community;
    const end = core ? CUE.interlude : CUE.assembly;
    const age = (t - start) / (end - start) * count;
    const first = Math.max(0, Math.floor(age - (core ? 1.1 : 5.0)));
    const last = Math.min(count - 1, Math.ceil(age + (core ? 1.6 : 6.5)));
    const active = [];
    for (let index = first; index <= last; index++) {
      const delta = age - index;
      const span = core ? 1.22 : 12.5;
      const progress = (delta + (core ? .22 : 6.2)) / span;
      const opacity = ease(progress / .20) * (1 - ease((progress - .67) / .33));
      if (opacity < .002) continue;
      // At most thirteen adjacent community groups can overlap in flight.
      const slot = core ? index : index % 16;
      const cached = cache.get(slot);
      const dynamic = cached?.index !== index;
      const image = dynamic
        ? creditTexture(people.slice(index * size, (index + 1) * size), core, cached?.image)
        : cached.image;
      if (dynamic) cache.set(slot, {index, image});
      const lane = core ? index % 3 - 1 : (index * 3) % 7 - 3;
      const direction = lane < 0 ? -1 : 1;
      const approach = clamp(progress);
      const depth = mix(core ? 1690 : 2260, core ? 925 : 1060, approach);
      const x = core ? -381 + lane * 91 + 52 * (approach - .5)
        : lane * 246 + direction * 53 * approach;
      const y = core ? (index % 2 ? 1 : -1) * 195 + 19 * Math.sin(t * .8)
        : ((Math.floor(index / 7) % 3) - 1) * 242 + Math.sin(index * 2.4) * 66 + (approach - .40) * 150;
      const scale = core ? .78 : 1;
      const pose = projection(x, y, depth, core ? {...camera, x: camera.x * .22} : camera);
      if (core) {
        const halfWidth = image.width * scale * 550 / depth;
        pose.x = Math.max(halfWidth + 56, Math.min(pose.x, 1030 - halfWidth));
      }
      active.push({image, pose: {...pose, width: image.width * scale,
        height: image.height * scale, dynamic, yaw: -camera.yaw + direction * .17 * (1 - approach),
        roll: direction * .048 * (1 - approach) - camera.roll,
        opacity: opacity * mix(.62, 1, approach)}});
    }
    return {active, first, last};
  }

  function drawStatement(ctx, t) {
    const refrainStart = CUE.assembly - 13.4;
    const isRefrain = t >= refrainStart;
    const start = isRefrain ? refrainStart : CUE.community;
    const end = isRefrain ? CUE.assembly : refrainStart;
    const refrainCount = 3;
    const leadCount = STATEMENTS.length - refrainCount;
    const count = isRefrain ? refrainCount : leadCount;
    const position = clamp((t - start) / (end - start)) * count;
    const index = Math.min(count - 1, Math.floor(position));
    const fraction = position - index;
    const entry = ease(fraction / .14);
    const exit = 1 - ease((fraction - .87) / .13);
    const refrain = isRefrain ? index : 0;
    ctx.save();
    ctx.globalAlpha = entry * exit;
    ctx.shadowColor = '#08080b';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 3;
    label(ctx, STATEMENTS[index + (isRefrain ? leadCount : 0)], mix(96, 117, entry), 907,
      isRefrain ? 58 + refrain * 8 : 51,
      {family: SERIF, weight: 700, color: isRefrain && index === 2 ? '#fa4b58' : IVORY, max: 1640});
    ctx.restore();
  }

  function stageLabels(ctx, t) {
    if (t < CUE.dossier) {
      const u = ease((t - .75) / 2);
      const alpha = u * (1 - ease((t - CUE.dossier + 1.5) / 1.5));
      ctx.save();
      ctx.globalAlpha = alpha;
      const x = mix(320, 144, u);
      heading(ctx, '演员表', x, 357, 135);
      heading(ctx, '【部分未给出】', x, 468, 33, '#e6b0a8');
      const dedication = '——致所有参与Deepseek Harness建设的贡献者';
      ctx.font = `700 48px ${SERIF}`;
      let row = '';
      let y = 564;
      for (const word of dedication.match(/[A-Za-z]+(?: [A-Za-z]+)*|./gu)) {
        if (ctx.measureText(row + word).width > 755) {
          heading(ctx, row, x, y, 48);
          row = '';
          y += 60;
        }
        row += word;
      }
      heading(ctx, row, x, y, 48);
      line(ctx, x, y + 51, x + 570, y + 51, '#e8ded06a');
      ctx.restore();
      return 'aperture';
    }
    if (t < CUE.interlude) {
      const elapsed = t - CUE.dossier;
      const opacity = ease(elapsed / .45) * (1 - ease((elapsed - 2.35) / 1.20));
      if (opacity > .001) {
        ctx.save();
        ctx.globalAlpha = opacity;
        heading(ctx, '以下是参与仓库建设的一部分参与者', 108, 117, 43);
        ctx.restore();
      }
      return 'core';
    }
    if (t < CUE.community) {
      const elapsed = t - CUE.interlude;
      const remaining = CUE.community - t;
      const drift = 18 * Math.sin(t * .18);
      const x = 981 + drift;
      const fade = ease(remaining / .56);
      ctx.save();
      ctx.globalAlpha = ease(elapsed / .55) * fade;
      ctx.shadowColor = '#08080b';
      ctx.shadowBlur = 15;
      label(ctx, '以下是社区插件建设的一部分参与者', x, 383, 47,
        {family: SERIF, color: IVORY, weight: 700, max: 831});
      const lines = [
        '他们只是普通的劳动者，',
        '但每一次代码提交都在降低 AI 门槛，',
        '用共享的开源精神构筑了如今的DSH生态，',
        '汇聚成智能生态的漫天星火。'
      ];
      for (const [i, row] of lines.entries()) {
        const reveal = ease((elapsed - .66 - i * 1.66) / .6);
        ctx.globalAlpha = reveal * fade;
        label(ctx, row, x + (1 - reveal) * 27, 484 + 65 * i, i === 3 ? 49 : 39,
          {family: SERIF, color: i === 3 ? '#f3aeb1' : IVORY, weight: 700, max: 822});
      }
      ctx.restore();
      return 'orbits';
    }
    if (t < CUE.assembly) {
      heading(ctx, '社区插件', 110, 120, 55);
      label(ctx, `${ownerTotal} 个仓库账号 · ${countOf(pluginCount)} 个插件条目`, 114, 184, 23,
        {family: SERIF, color: '#e1c9bf'});
      const progress = clamp((t - CUE.community) / (CUE.assembly - CUE.community)) * featured.length;
      const index = Math.min(featured.length - 1, Math.floor(progress));
      const work = featured[index];
      const slide = ease((progress - index) / .18);
      const x = mix(1776, 1804, slide);
      ctx.save();
      ctx.globalAlpha = mix(.55, 1, slide);
      label(ctx, work.project, x, 119, 32, {color: IVORY, weight: 700, max: 640, align: 'right'});
      label(ctx, `@${work.login}    ·    ${work.note}`, x, 174, 20,
        {family: SERIF, color: '#e6b0a8', max: 800, align: 'right'});
      ctx.restore();
      drawStatement(ctx, t);
      label(ctx, 'GitHub 仓库所有者 · 含个人账号与组织', 1804, 1022, 19,
        {family: SERIF, color: '#d8cbc0', align: 'right'});
      return 'community';
    }
    return t < CUE.close ? 'assembly' : 'end-title';
  }

  function communityEntrance(ctx, t, camera) {
    const elapsed = t - CUE.interlude;
    const duration = CUE.community - CUE.interlude;
    const progress = clamp(elapsed / duration);
    const opacity = ease((elapsed + .65) / 1.75) * (1 - ease((elapsed - duration + 1.2) / 2.1));
    if (opacity < .001) return;

    const arrival = ease(progress / .32);
    const departure = ease((progress - .65) / .35);
    const centerX = mix(781, 573, arrival) - 116 * departure;
    const centerY = 555 + 34 * Math.sin(progress * TAU);
    const radius = mix(174, 476, arrival) + departure * 220;
    const turn = progress * 1.5 + camera.yaw;
    const paths = Array.from({length: 5}, (_, ring) => {
      const tilt = -.89 + ring * .43;
      return angle => {
        const orbitRadius = radius * (1 - ring * .08);
        const x = orbitRadius * Math.cos(angle);
        const y = orbitRadius * Math.sin(angle) * Math.cos(tilt);
        const z = orbitRadius * Math.sin(angle) * Math.sin(tilt);
        const side = x * Math.cos(turn) - z * Math.sin(turn);
        const depth = x * Math.sin(turn) + z * Math.cos(turn);
        const perspective = 1160 / (1160 + depth);
        return {x: centerX + side * perspective, y: centerY + y * perspective, depth, perspective};
      };
    });

    function drawTrails(front) {
      ctx.save();
      ctx.globalAlpha *= opacity;
      for (const [ring, project] of paths.entries()) {
        const warm = ring % 2 === 0;
        ctx.strokeStyle = warm ? '#e47e8f91' : '#f4d9bb7f';
        ctx.lineWidth = front ? 1.9 : 1.1;
        ctx.beginPath();
        let visible = false;
        for (let step = 0; step <= 72; step++) {
          const point = project(step * TAU / 72);
          const onSide = (point.depth < 0) === front;
          if (onSide) {
            if (visible) ctx.lineTo(point.x, point.y);
            else ctx.moveTo(point.x, point.y);
          }
          visible = onSide;
        }
        ctx.stroke();
        for (let index = 0; index < 13; index++) {
          const angle = index * TAU / 13 + elapsed * (.39 + ring * .075);
          const point = project(angle);
          if ((point.depth < 0) !== front) continue;
          const bright = index % 4 === 0;
          const size = (bright ? 6 : 2) * point.perspective;
          const color = warm ? '#ffc3c5' : '#f5e9d3';
          if (bright) {
            const tail = project(angle - .28 - departure * .21);
            const flare = ctx.createLinearGradient(tail.x, tail.y, point.x, point.y);
            flare.addColorStop(0, '#edc1b200');
            flare.addColorStop(1, color);
            ctx.strokeStyle = flare;
            ctx.lineWidth = size * .54;
            ctx.beginPath();
            ctx.moveTo(tail.x, tail.y);
            for (let step = 1; step <= 6; step++) {
              const trail = project(angle - (.28 + departure * .21) * (1 - step / 6));
              ctx.lineTo(trail.x, trail.y);
            }
            ctx.stroke();
            ctx.shadowColor = color;
            ctx.shadowBlur = size * 2;
          }
          ctx.fillStyle = color;
          ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
    }

    drawTrails(false);
    const height = mix(690, 995, arrival) + departure * 160;
    space.drawPlane(ctx, character, {x: centerX, y: centerY - 12,
      width: figureWidth(height), height, depth: mix(1580, 1060, arrival) - departure * 100,
      yaw: mix(-.44, .13, arrival) - camera.yaw, roll: -.07 + .13 * progress,
      opacity: opacity * mix(.32, .93, arrival)});
    drawTrails(true);

    const tokens = ['git', 'commit', 'merge', 'fork', 'npm', 'package', 'plugin', 'dsh'];
    if (progress > .53) tokens.push(...owners.slice(0, 5).map(nameOf));
    for (const [index, token] of tokens.entries()) {
      const point = paths[index % paths.length](elapsed * .38 + index * 2.39996);
      ctx.save();
      ctx.globalAlpha *= opacity * arrival * (point.depth < 0 ? .82 : .35) *
        (index < 8 ? 1 : ease((progress - .53) / .18));
      label(ctx, token, point.x, point.y - 14, 21 * point.perspective,
        {color: index % 3 === 0 ? '#f09498' : IVORY, weight: 700, align: 'center'});
      ctx.restore();
    }
  }

  function ending(ctx, t, camera) {
    const progress = ease((t - CUE.assembly) / 8.7);
    const x = mix(1030, 1260, progress) + 65 * Math.sin(t * .24);
    const y = 545 + 21 * Math.sin(t * .18);
    const h = 980;
    space.drawPlane(ctx, character, {x, y, width: figureWidth(h), height: h,
      depth: mix(1600, 1120, progress), yaw: mix(-.52, .04, progress) - camera.yaw,
      roll: -.03 - camera.roll, opacity: mix(.22, .99, progress)});
    ctx.save();
    for (let index = 0; index < 32; index++) {
      const angle = index * 2.39996 + t * .14;
      const radius = mix(93, 390, progress) * (.66 + .16 * (index % 5));
      const size = 2 + index % 3;
      ctx.globalAlpha = (1 - progress) * .66;
      ctx.fillStyle = index % 5 ? IVORY : LIGHT_RED;
      ctx.fillRect(x + Math.cos(angle) * radius * 1.4,
        y + Math.sin(angle) * radius, size, size);
    }
    ctx.restore();
    const close = ease((t - CUE.close) / 3);
    ctx.save();
    ctx.globalAlpha = 1 - close;
    heading(ctx, '漫天星火', 117, 494, 72);
    label(ctx, `${coreTotal} 条核心署名 · ${ownerTotal} 个社区仓库账号`, 121, 606, 27,
      {family: SERIF, color: '#e1c9bf'});
    ctx.globalAlpha = close;
    heading(ctx, '献给共同创造的人', 117, 494, 75, '#f09498');
    label(ctx, 'DeepSeek Harness  /  社区插件生态', 122, 611, 29,
      {family: SERIF, color: '#eadfd0'});
    ctx.restore();
  }

  function draw(ctx, elapsed, duration) {
    const t = clamp(elapsed / duration) * 171.445442;
    const camera = cameraAt(t);
    const x = 960 - camera.x * .85, y = 540 - camera.y * .75;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    boards(ctx, t, camera);
    orbit(ctx, t, x, y, 715 + 78 * Math.sin(t * .16), false, true);
    const core = namePlanes(t, camera, true);
    const community = namePlanes(t, camera, false);
    const historical = historyPlanes(t, camera);
    const cameo = figureCameo(t, camera);
    const characters = presence(t, camera);
    if (cameo) {
      for (const layer of characters) layer.pose.opacity *= 1 - cameo.pose.opacity * 1.8;
    }
    const planes = [...characters, ...historical, ...core.active, ...community.active];
    if (cameo) planes.push(cameo);
    planes.sort((a, b) => b.pose.depth - a.pose.depth);
    space.drawPlanes(ctx, planes);
    communityEntrance(ctx, t, camera);
    if (t >= CUE.assembly) ending(ctx, t, camera);
    ctx.save();
    ctx.globalAlpha = .60;
    orbit(ctx, t, x, y, 715 + 78 * Math.sin(t * .16), true, true);
    ctx.restore();
    const stage = stageLabels(ctx, t);
    if (t > CUE.decay) {
      ctx.globalAlpha = .62 * ease((t - CUE.decay) / (171.445442 - CUE.decay));
      ctx.fillStyle = DARK;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    return {stage, count: contributors.length, pluginOwners: owners.length, featured: featured.length,
      coreRange: [core.first * coreSize, Math.min(contributors.length, (core.last + 1) * coreSize)],
      ownerRange: [community.first * ownerSize, Math.min(owners.length, (community.last + 1) * ownerSize)],
      historyYears: historical.map(card => card.year),
      cameoNameRange: cameo ? [cameo.first, cameo.lastName] : null,
      planes: planes.length, perspective: space.available};
  }

  return {draw, destroy: () => space.destroy()};
}

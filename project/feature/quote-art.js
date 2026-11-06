/*
 * Load an @font-face named "Noto Serif SC" (weight 100 900), await
 * document.fonts.load('900 104px "Noto Serif SC"'), then call:
 * RevolutionQuotes.draw(ctx, { id, duration, lines:[{text, emphasis?, fontWeight?,
 *   semanticRole?, revealGroup?}], entranceDuration?, author,
 *   work, year }, elapsedSeconds). Only the 1920 x 952 picture area is painted.
 * emphasis accepts true, a keyword string, or an array of keyword strings.
 * The returned logical-pixel ink bounds, safe area, and warnings support QA.
 */
(() => {
  'use strict';

  const W = 1920, H = 952, FAMILY = '"Noto Serif SC"';
  const SAFE = Object.freeze({ left: 160, top: 150, right: 1760, bottom: 790 });
  const cache = new Map();
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => { x = clamp(x); return 1 - (1 - x) ** 3; };
  const font = (n, weight = 700) => `${weight} ${n}px ${FAMILY}, "SimSun", serif`;
  const weightOf = row => clamp(Number(row.fontWeight) || (row.emphasis === true ? 900 : 700), 100, 900);
  const INK = Object.freeze({ theme: '#e2e2e2', premise: '#d4d4d4', bridge: '#dddddd',
    conclusion: '#fafafa', omission: '#bcbcbc', author: '#c6c6c6', source: '#b4b4b4' });
  const round = n => Math.round(n * 1000) / 1000;

  function canvas(width, height) {
    const out = document.createElement('canvas');
    out.width = width; out.height = height;
    return out;
  }

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function random(seed) {
    let n = seed || 1;
    return () => {
      n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
      return (n >>> 0) / 4294967296;
    };
  }

  function box(left, top, right, bottom) {
    return { left: round(left), top: round(top), right: round(right),
      bottom: round(bottom), width: round(right - left), height: round(bottom - top) };
  }

  function union(bounds) {
    if (!bounds.length) return box(0, 0, 0, 0);
    return box(Math.min(...bounds.map(b => b.left)), Math.min(...bounds.map(b => b.top)),
      Math.max(...bounds.map(b => b.right)), Math.max(...bounds.map(b => b.bottom)));
  }

  function measure(ctx, text, size, weight) {
    ctx.font = font(size, weight);
    const m = ctx.measureText(text);
    return {
      width: m.width,
      ascent: m.actualBoundingBoxAscent || size * .87,
      descent: m.actualBoundingBoxDescent || size * .13,
      left: m.actualBoundingBoxLeft || 0,
      right: m.actualBoundingBoxRight || m.width
    };
  }

  function runs(text, emphasis) {
    if (emphasis === true) return [{ text, emphasis: true }];
    const words = (Array.isArray(emphasis) ? emphasis : typeof emphasis === 'string' ? [emphasis] : [])
      .filter(x => typeof x === 'string' && x.length).sort((a, b) => b.length - a.length);
    if (!words.length) return [{ text, emphasis: false }];
    const out = []; let offset = 0, plain = '';
    while (offset < text.length) {
      const word = words.find(s => text.startsWith(s, offset));
      if (word) {
        if (plain) { out.push({ text: plain, emphasis: false }); plain = ''; }
        out.push({ text: word, emphasis: true }); offset += word.length;
      } else { plain += text[offset]; offset++; }
    }
    if (plain) out.push({ text: plain, emphasis: false });
    return out;
  }

  function lineMetrics(ctx, row, size) {
    const pieces = runs(row.text, row.emphasis);
    const fontWeight = weightOf(row);
    const semanticRole = row.semanticRole || (row.emphasis === true ? 'conclusion' : 'premise');
    let width = 0, ascent = 0, descent = 0, inkLeft = Infinity, inkRight = -Infinity;
    for (const part of pieces) {
      part.fontWeight = part.emphasis ? 900 : fontWeight;
      part.fill = part.emphasis ? INK.conclusion : (INK[semanticRole] || INK.premise);
      const m = measure(ctx, part.text, size, part.fontWeight);
      part.x = width;
      inkLeft = Math.min(inkLeft, width - m.left);
      inkRight = Math.max(inkRight, width + m.right);
      width += m.width;
      ascent = Math.max(ascent, m.ascent); descent = Math.max(descent, m.descent);
    }
    return { pieces, size, width, ascent, descent, inkLeft, inkRight, fontWeight, semanticRole,
      height: ascent + descent };
  }

  function texture(layer, seed, size) {
    const c = layer.getContext('2d'), rnd = random(seed), area = layer.width * layer.height;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    // Fixed microscopic ink loss: neither paper grain nor a moving/noisy screen.
    const count = Math.ceil(area / 1750);
    for (let i = 0; i < count; i++) {
      c.fillStyle = `rgba(0,0,0,${.035 + rnd() * .105})`;
      const x = rnd() * layer.width, y = rnd() * layer.height;
      const w = .45 + rnd() * .9, h = .35 + rnd() * 1.1;
      c.fillRect(x, y, w, h);
    }
    for (let i = 0; i < Math.ceil(area / 17500); i++) {
      c.fillStyle = `rgba(0,0,0,${.025 + rnd() * .045})`;
      c.fillRect(rnd() * layer.width, rnd() * layer.height, .8 + rnd() * size * .035, .45);
    }
    c.restore();
  }

  function makeLayer(metrics, x, baseline, seed) {
    const pad = 8;
    const left = Math.floor(x + metrics.inkLeft) - pad;
    const top = Math.floor(baseline - metrics.ascent) - pad;
    const right = Math.ceil(x + metrics.inkRight) + pad;
    const bottom = Math.ceil(baseline + metrics.descent) + pad;
    const layer = canvas(Math.max(1, right - left), Math.max(1, bottom - top));
    const c = layer.getContext('2d');
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    for (const part of metrics.pieces) {
      // Use exactly the font that measured this run, including variable weight.
      c.font = font(metrics.size, part.fontWeight);
      c.fillStyle = part.fill;
      c.fillText(part.text, x + part.x - left, baseline - top);
      if (part.emphasis) {
        c.strokeStyle = '#fafafa'; c.lineWidth = .32; c.lineJoin = 'round';
        c.strokeText(part.text, x + part.x - left, baseline - top);
      }
    }
    texture(layer, seed, metrics.size);
    return { layer, x: left, y: top,
      bounds: box(x + metrics.inkLeft, baseline - metrics.ascent,
        x + metrics.inkRight, baseline + metrics.descent) };
  }

  function build(scene, key) {
    const probe = canvas(1, 1).getContext('2d');
    const rows = (scene.lines || []).map(row => typeof row === 'string'
      ? { text: row, emphasis: false } : { ...row, text: String(row?.text || ''), emphasis: row?.emphasis })
      .filter(row => row.text.trim());
    const warnings = [];
    if (!rows.length) warnings.push('The scene has no quotation text.');
    if (rows.length > 6) warnings.push('More than six supplied lines require smaller text.');

    const work = String(scene.work || '').trim();
    const titledWork = work && !/^[《〈「『]/.test(work) ? `《${work}》` : work;
    const sourceText = [titledWork, scene.year == null ? '' : String(scene.year)].filter(Boolean).join(' · ');
    const sourceRows = [String(scene.author || '').trim(), sourceText].filter(Boolean);
    const sourceSizes = sourceRows.map((_, i) => i === 0 && sourceRows.length > 1 ? 38 : 33);
    const sourceMetrics = sourceRows.map((text, i) => {
      const sourceStyle = { text, fontWeight: i === 0 ? 600 : 500,
        semanticRole: i === 0 ? 'author' : 'source' };
      let size = sourceSizes[i], m = lineMetrics(probe, sourceStyle, size);
      while (m.width > 1500 && size > 24) m = lineMetrics(probe, sourceStyle, --size);
      return m;
    });
    const sourceGap = 10;
    const sourceHeight = sourceMetrics.reduce((s, m) => s + m.height, 0)
      + Math.max(0, sourceMetrics.length - 1) * sourceGap;
    const sourceTop = SAFE.bottom - sourceHeight;
    const mainTop = SAFE.top + 4, mainBottom = Math.min(680, sourceTop - 38);
    const mainHeight = Math.max(300, mainBottom - mainTop);
    const count = rows.length;
    const ideal = count <= 2 ? 104 : count === 3 ? 98 : count === 4 ? 90 : count === 5 ? 82 : 76;
    let baseSize = ideal, metrics = [], gaps = [], bodyHeight = 0;
    for (;;) {
      metrics = rows.map(row => lineMetrics(probe, row,
        Math.min(104, baseSize + (row.semanticRole === 'conclusion' || row.emphasis === true ? 3 : 0))));
      const inkHeight = metrics.reduce((s, m) => s + m.height, 0);
      const requestedGaps = rows.slice(1).map((row, i) => baseSize
        * ((row.revealGroup ?? i + 1) === (rows[i].revealGroup ?? i) ? .18 : .29));
      const requestedGapHeight = requestedGaps.reduce((s, n) => s + n, 0);
      const gapScale = requestedGapHeight ? Math.min(1, Math.max(0, mainHeight - inkHeight) / requestedGapHeight) : 1;
      gaps = requestedGaps.map(n => n * gapScale);
      bodyHeight = inkHeight + gaps.reduce((s, n) => s + n, 0);
      const fits = metrics.every(m => m.width <= 1588) && bodyHeight <= mainHeight + .01
        && gaps.every(n => n >= baseSize * .105);
      if (fits || baseSize <= 48) break;
      baseSize -= 1;
    }
    if (baseSize < 76) warnings.push(`Text was reduced to ${baseSize}px; shorten or rebreak the supplied lines for the intended 76–104px treatment.`);
    if (metrics.some(m => m.width > 1588) || bodyHeight > mainHeight + .01)
      warnings.push('Quotation exceeds the intended text area.');

    let top = mainTop + Math.max(0, (mainHeight - bodyHeight) / 2);
    const layers = metrics.map((m, i) => {
      // A common left edge on dense passages; short intertitles sit on the axis.
      const x = count >= 4 ? SAFE.left + 6 : (W - m.width) / 2;
      const baseline = top + m.ascent;
      const layer = makeLayer(m, x, baseline, hash(`${key}:body:${i}`));
      top += m.height + (gaps[i] || 0);
      return { ...layer, text: rows[i].text, fontSize: m.size, baseline,
        fontWeight: m.fontWeight, fontWeights: [...new Set(m.pieces.map(p => p.fontWeight))],
        semanticRole: m.semanticRole, fill: m.pieces[0]?.fill, revealGroup: rows[i].revealGroup ?? i,
        role: 'quotation', index: i };
    });

    top = sourceTop;
    const sources = sourceMetrics.map((m, i) => {
      const x = SAFE.right - 4 - m.width, baseline = top + m.ascent;
      const layer = makeLayer(m, x, baseline, hash(`${key}:source:${i}`));
      top += m.height + sourceGap;
      return { ...layer, text: sourceRows[i], fontSize: m.size, baseline,
        fontWeight: m.fontWeight, fontWeights: [...new Set(m.pieces.map(p => p.fontWeight))],
        semanticRole: m.semanticRole, fill: m.pieces[0]?.fill,
        role: 'attribution', index: i };
    });
    const bodyBounds = union(layers.map(x => x.bounds));
    const sourceBounds = union(sources.map(x => x.bounds));
    const bounds = union([...layers, ...sources].map(x => x.bounds));
    if (bounds.left < SAFE.left || bounds.right > SAFE.right || bounds.top < SAFE.top || bounds.bottom > SAFE.bottom + .01)
      warnings.push('Measured ink extends outside the safe area.');
    return { layers, sources, bounds, bodyBounds, sourceBounds, warnings, fontSize: baseSize };
  }

  function paint(ctx, item, progress) {
    if (progress <= 0) return;
    const p = ease(progress), dy = 8 * (1 - p);
    ctx.save();
    // This low-opacity soft impression remains behind a separate, clear ink pass.
    ctx.globalAlpha = p * .115;
    ctx.filter = `blur(${1.35 + 1.8 * (1 - p)}px)`;
    ctx.drawImage(item.layer, item.x, item.y + dy + .45);
    ctx.globalAlpha = p;
    ctx.filter = p >= .999 ? 'none' : `blur(${.75 * (1 - p)}px)`;
    ctx.drawImage(item.layer, item.x, item.y + dy);
    ctx.restore();
  }

  function draw(ctx, scene, elapsed = 0) {
    if (!ctx || !scene) throw new TypeError('RevolutionQuotes.draw needs a 2D context and scene.');
    const fontLoaded = !document.fonts || [500, 600, 650, 700, 900]
      .every(weight => document.fonts.check(`${weight} 104px ${FAMILY}`));
    const key = JSON.stringify([scene.artKey || scene.id, scene.lines, scene.author, scene.work, scene.year, fontLoaded]);
    let art = cache.get(key);
    if (!art) {
      art = build(scene, key); cache.set(key, art);
      if (cache.size > 40) cache.delete(cache.keys().next().value);
    }
    const duration = Math.max(0, Number(scene.duration) || 0);
    const stableAt = scene.hold ? 0 : clamp(Number(scene.entranceDuration) || 1.12, .9, 1.3);
    const groups = [...new Set(art.layers.map(item => item.revealGroup))];
    const stagger = Math.min(.22, stableAt * .18);
    const lineDuration = Math.max(.06, stableAt - Math.max(0, groups.length - 1) * stagger);
    const time = Math.max(0, Number(elapsed) || 0);
    const sourceStart = Math.min(.28, stableAt * .25);
    ctx.save();
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      art.layers.forEach(item => paint(ctx, item, scene.hold ? 1
        : clamp((time - groups.indexOf(item.revealGroup) * stagger) / Math.max(.001, lineDuration))));
      art.sources.forEach(item => paint(ctx, item, scene.hold ? 1
        : clamp((time - sourceStart) / Math.max(.001, stableAt - sourceStart))));
    } finally { ctx.restore(); }
    return {
      sceneId: scene.id, width: W, height: H, fontFamily: 'Noto Serif SC', fontWeight: 'mixed',
      fontWeights: [...new Set([...art.layers, ...art.sources].flatMap(item => item.fontWeights))].sort((a, b) => a - b),
      fontLoaded, fontSize: art.fontSize, safeArea: { ...SAFE },
      bounds: { ...art.bounds }, bodyBounds: { ...art.bodyBounds }, sourceBounds: { ...art.sourceBounds },
      lines: [...art.layers, ...art.sources].map(({ text, fontSize, fontWeight, fontWeights,
        semanticRole, fill, revealGroup, baseline, bounds, role, index }) =>
        ({ text, fontSize, fontWeight, fontWeights, semanticRole, fill, revealGroup,
          baseline: round(baseline), bounds: { ...bounds }, role, index })),
      revealGroups: groups.map((group, i) => ({ group, start: round(scene.hold ? 0 : i * stagger),
        completeAt: round(scene.hold ? 0 : i * stagger + lineDuration) })),
      stableAt: round(stableAt), stable: time >= stableAt,
      readingFraction: duration > 0 ? round(Math.max(0, duration - stableAt) / duration) : null,
      warnings: [...art.warnings, ...(fontLoaded ? [] : ['Noto Serif SC is not loaded; await document.fonts.load before rendering.'])]
    };
  }

  window.RevolutionQuotes = Object.freeze({
    draw, width: W, height: H, fontFamily: 'Noto Serif SC', version: '2.0.0',
    clearCache() { cache.clear(); }
  });
})();

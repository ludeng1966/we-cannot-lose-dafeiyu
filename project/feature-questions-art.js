/*
 * Transparent 1920 x 952 workstation-question overlay. Load "Noto Serif SC"
 * weights 700 and 900 before rendering. On a separate overlay canvas, clear
 * it each frame, then call WorkstationQuestions.draw(ctx, newGlobalSeconds,
 * sourceSceneSeconds). This module neither clears nor fills the background.
 * Returned line bounds include unclipped projected ink/stroke, a conservative
 * shadow envelope, visible bounds, and effective opacity for visual QA.
 */
(() => {
  'use strict';
  const WIDTH = 1920, HEIGHT = 952;
  const FAMILY = '"Noto Serif SC"';
  const cl = x => Math.max(0, Math.min(1, x));
  const mix = (a, b, p) => a + (b - a) * p;
  const rounded = n => Math.round(n * 10000) / 10000;

  // Exact curve and camera coordinates from V4 scenes/intro3.js creations().
  function bez(x, x1 = .68, y1 = 0, x2 = .27, y2 = 1) {
    x = cl(x); if (x === 0 || x === 1) return x;
    const v = (q, a, b) => 3 * (1 - q) ** 2 * q * a + 3 * (1 - q) * q * q * b + q ** 3;
    let lo = 0, hi = 1;
    for (let i = 0; i < 17; i++) {
      const m = (lo + hi) / 2;
      if (v(m, x1, x2) < x) lo = m; else hi = m;
    }
    return v((lo + hi) / 2, y1, y2);
  }
  const E = (t, a, b) => bez((t - a) / (b - a), b - a > 5 ? .48 : .66, 0, b - a > 5 ? .24 : .25, 1);

  function camera(t) {
    let cx = 480, cy = 330, z = 1.48;
    if (t >= 75.96 && t < 80.6) {
      const p = E(t, 75.96, 80.6);
      cx = mix(480, 1100, p); z = mix(1.48, .86, p); cy = mix(330, 350, p);
    } else if (t >= 80.6 && t < 85.6) {
      cx = 1100; cy = 350; z = .86;
    } else if (t >= 85.6) {
      const p = E(t, 85.6, 88.1);
      cx = mix(1100, 2760, p); cy = mix(350, 360, p); z = mix(.86, 1.12, p);
    }
    return { cx, cy, z };
  }

  const questions = Object.freeze([
    {
      id: 'agent-capability', center: 480, start: 361.0, next: 364.18,
      maxWidth: 1040, stagger: .08,
      lines: [
        { text: 'Agent', baseline: 653, size: 48, weight: 700 },
        { text: '给我们带来了什么？', baseline: 725, size: 62, weight: 700 }
      ]
    },
    {
      id: 'whale-specificity', center: 1690, start: 364.18, next: 369.1,
      maxWidth: 900, stagger: .12,
      lines: [
        { text: '大肥鱼为什么具有特殊性？', baseline: 653, size: 52, weight: 700 },
        { text: '她会怎样改变我们的生活？', baseline: 725, size: 52, weight: 700 }
      ]
    },
    {
      id: 'loss-and-stakes', center: 2990, start: 369.1, next: null,
      maxWidth: 1040, stagger: .08,
      lines: [
        { text: '如果我们失去了大肥鱼，', baseline: 720, size: 46, weight: 700 },
        { text: '究竟会失去什么？', baseline: 792, size: 60, weight: 900 }
      ]
    }
  ]);

  function enter(t, start, duration) {
    const x = cl((t - start) / duration);
    return 1 - (1 - x) ** 3;
  }
  function bounds(left, top, right, bottom) {
    return { left: rounded(left), top: rounded(top), right: rounded(right), bottom: rounded(bottom),
      width: rounded(right - left), height: rounded(bottom - top) };
  }
  function project(b, view) {
    return bounds(960 + view.z * (b.left - view.cx), 456 + view.z * (b.top - view.cy),
      960 + view.z * (b.right - view.cx), 456 + view.z * (b.bottom - view.cy));
  }
  function expand(b, amountX, amountY = amountX) {
    return bounds(b.left - amountX, b.top - amountY, b.right + amountX, b.bottom + amountY);
  }
  function intersection(b) {
    const left = Math.max(0, b.left), top = Math.max(0, b.top);
    const right = Math.min(WIDTH, b.right), bottom = Math.min(HEIGHT, b.bottom);
    return right > left && bottom > top ? bounds(left, top, right, bottom) : null;
  }
  function union(boxes) {
    return boxes.length ? bounds(Math.min(...boxes.map(b => b.left)), Math.min(...boxes.map(b => b.top)),
      Math.max(...boxes.map(b => b.right)), Math.max(...boxes.map(b => b.bottom))) : null;
  }

  function draw(ctx, newGlobalSeconds, sourceSceneSeconds) {
    if (!ctx) throw new TypeError('WorkstationQuestions.draw needs a CanvasRenderingContext2D.');
    const global = Number(newGlobalSeconds), scene = Number(sourceSceneSeconds);
    if (!Number.isFinite(global) || !Number.isFinite(scene)) {
      return { width: WIDTH, height: HEIGHT, lines: [], bounds: null, active: false,
        warnings: ['Both global and source-scene seconds must be finite numbers.'] };
    }
    const view = camera(scene), rows = [];
    const fadeOut = 1 - enter(global, 373.1, .5);
    const inSection = scene >= 72.2 && scene < 93.82 && global < 373.6;
    const fontLoaded = !document.fonts ||
      (document.fonts.check(`700 70px ${FAMILY}`) && document.fonts.check(`900 70px ${FAMILY}`));

    ctx.save();
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      ctx.beginPath(); ctx.rect(0, 0, WIDTH, HEIGHT); ctx.clip();

      for (const question of questions) {
        const dim = question.next == null ? 1 : mix(1, .3, enter(global, question.next, .4));
        question.lines.forEach((line, index) => {
          const start = question.start + index * question.stagger;
          const duration = .4 - question.stagger;
          const progress = enter(global, start, duration);
          const opacity = inSection ? progress * dim * fadeOut : 0;
          const rise = 8 * (1 - progress), baseline = line.baseline + rise;
          const font = `${line.weight} ${line.size}px ${FAMILY}, "SimSun", serif`;
          ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          const measured = ctx.measureText(line.text);
          const width = measured.width;
          const scaleX = Math.min(1, question.maxWidth / Math.max(1, width));
          const ascent = measured.actualBoundingBoxAscent || line.size * .88;
          const descent = measured.actualBoundingBoxDescent || line.size * .12;
          const inkLeft = Number.isFinite(measured.actualBoundingBoxLeft) ? measured.actualBoundingBoxLeft : 0;
          const inkRight = Number.isFinite(measured.actualBoundingBoxRight) ? measured.actualBoundingBoxRight : width;
          const strokeWidth = line.size >= 62 ? 6 : 5.2;
          const worldInk = bounds(question.center + (-width / 2 - inkLeft) * scaleX,
            baseline - ascent, question.center + (-width / 2 + inkRight) * scaleX,
            baseline + descent);
          const projectedInk = project(worldInk, view);
          const projected = expand(projectedInk, strokeWidth * view.z * scaleX / 2, strokeWidth * view.z / 2);
          // Canvas shadow blur is measured in output pixels. Keep a conservative
          // envelope for QA instead of treating its soft edge as clipped ink.
          const visualBounds = expand(projected, 17, 20);
          const visibleBounds = intersection(projected);
          rows.push({ questionId: question.id, index, text: line.text, fontSize: line.size,
            fontWeight: line.weight, worldCenter: question.center, worldBaseline: rounded(baseline),
            settledWorldBaseline: line.baseline, horizontalScale: rounded(scaleX),
            opacity: rounded(opacity), progress: rounded(progress), stable: global >= question.start + .4,
            worldBounds: worldInk, inkBounds: projectedInk, projectedBounds: projected,
            bounds: projected, visualBounds, visibleBounds,
            clipped: projected.left < 0 || projected.top < 0 || projected.right > WIDTH || projected.bottom > HEIGHT,
            visible: opacity > .001 && visibleBounds !== null });

          if (opacity <= .001 || visibleBounds === null) return;
          ctx.save();
          ctx.translate(960, 456); ctx.scale(view.z, view.z); ctx.translate(-view.cx, -view.cy);
          ctx.translate(question.center, baseline); ctx.scale(scaleX, 1);
          ctx.globalAlpha = opacity;
          ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          ctx.lineJoin = 'round'; ctx.miterLimit = 2;
          ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
          ctx.strokeStyle = '#000'; ctx.lineWidth = strokeWidth;
          ctx.strokeText(line.text, -width / 2, 0);
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.fillStyle = '#f5f5f5'; ctx.fillText(line.text, -width / 2, 0);
          ctx.restore();
        });
      }
    } finally { ctx.restore(); }

    return { width: WIDTH, height: HEIGHT, globalSeconds: global, sourceSceneSeconds: scene,
      camera: { cx: rounded(view.cx), cy: rounded(view.cy), z: rounded(view.z) }, fontLoaded,
      lines: rows, bounds: union(rows.filter(row => row.opacity > .001).map(row => row.projectedBounds)),
      visibleBounds: union(rows.filter(row => row.visible).map(row => row.visibleBounds)),
      active: rows.some(row => row.visible),
      warnings: fontLoaded ? [] : ['Await Noto Serif SC font weights 700 and 900 before rendering.'] };
  }

  window.WorkstationQuestions = Object.freeze({ draw, camera, width: WIDTH, height: HEIGHT, version: '1.0.0' });
})();

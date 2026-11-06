const INK = '#e8e4db';
const RED = '#a34742';
const FONT = '"Noto Serif SC", serif';

function ease(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function createG009Edit(manifest, pvStart) {
  const group = manifest.groups.find(row => row.id === 'g009' && row.revision === 7);
  if (!group) return null;
  const cues = manifest.captions.filter(row => row.group === group.id);
  if (cues.length !== 8 || group.end >= pvStart) throw Error('g009 修订 07 的适配时间点不完整。');
  const [preface, agent, specificity, loss, code, share, title, slogan] = cues;
  const entranceStart = Math.max(group.end, pvStart - 3.8);
  // Legacy visual coordinates for the three workstation reveals and intro3 ending.
  const anchors = [
    [preface.start, 336.88001], [agent.start, 341.79],
    [specificity.start, 345.45], [loss.start, 350.35],
    [code.start, 354.44], [title.start, 363.48],
    [group.end, 367.30], [pvStart, 368.14],
  ].map(([time, visualN]) => ({new: time, visualN}));

  function conform(original) {
    const adjust = rows => rows.map(row => row.id === group.id ? {...row, anchors} : row);
    return {...original, segments: adjust(original.segments), speechSegments: adjust(original.speechSegments)};
  }

  function install(scene, getAudioTime) {
    const draw = scene.draw;
    scene.draw = function (ctx, sceneTime, api) {
      const t = getAudioTime();
      if (t < code.start || t >= pvStart) return draw.call(this, ctx, sceneTime, api);
      // Reuse the original Live2D staging and cue its nod on the closing line.
      const stagedTime = t < slogan.start
        ? 104.42 + 1.58 * ease((t - code.start) / (slogan.start - code.start))
        : 106 + 2.5 * ease((t - slogan.start) / (group.end - slogan.start));
      const fillText = ctx.fillText;
      ctx.fillText = function (text, ...args) {
        if (text !== '往左堂' && text !== 'official') fillText.call(this, text, ...args);
      };
      try {
        return draw.call(this, ctx, stagedTime, api);
      } finally {
        ctx.fillText = fillText;
      }
    };
  }

  function drawCard(ctx, t) {
    if (t < code.start || t >= pvStart) return null;
    const closing = t >= title.start;
    const start = closing ? title.start : code.start;
    const opacity = ease((t - start) / .48) * (closing
      ? ease((entranceStart + 1.28 - t) / .84)
      : ease((title.start - t) / .28));
    const accent = ease((t - start) / 1.4);
    const cue = closing ? slogan : share;
    const secondary = ease((t - cue.start) / .42);
    const x = 930;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.rect(0, 0, 1920, 952);
    ctx.clip();
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = opacity;
    const shade = ctx.createLinearGradient(750, 0, 1820, 0);
    shade.addColorStop(0, '#10111400');
    shade.addColorStop(.23, '#101114dd');
    shade.addColorStop(1, '#101114e0');
    ctx.fillStyle = shade;
    ctx.fillRect(750, 254, 1070, 426);
    ctx.translate(0, 16 * (1 - opacity));
    ctx.fillStyle = RED;
    ctx.fillRect(x, 328, 96 + accent * 600, 2);
    ctx.fillRect(x, 328, 3, 34);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = `900 ${closing ? 120 : 86}px ${FONT}`;
    ctx.fillText(closing ? '肥鱼大讲堂' : '本期视频代码开源', x, 436);
    ctx.font = `650 47px ${FONT}`;
    ctx.globalAlpha *= secondary;
    ctx.fillText(closing ? '带你武装保卫大肥鱼' : '分享　下载　转载', x, 566);
    ctx.restore();
    return {stage: closing ? 'signoff' : 'open-source', title: closing ? '肥鱼大讲堂' : '本期视频代码开源', opacity, secondary, musicalTail: t >= group.end};
  }

  return {conform, install, drawCard, entranceStart};
}

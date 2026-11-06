const ROWS = 13;
const FONT = '500 29px "Bahnschrift", "Microsoft YaHei", sans-serif';
const COLORS = ['#dedbd4', '#a9b9be', '#c4a88f', '#c6c8cd'];

export async function installPluginDanmaku() {
  const response = await fetch('/feature-plugin-names.json');
  if (!response.ok) throw Error('DSH 插件名录加载失败');
  const names = await response.json();
  const media = window.MediaV12;
  const slot = media.windows.find(row => row.key === 'v12_desktop_windows');
  const original = media.draw;
  let lanes;

  media.draw = function (ctx, clip, local, scene, assets) {
    const time = window.V12PictureTime;
    if (clip !== slot.clip || !(time >= slot.globalStart && time < slot.globalEnd)) {
      return original.call(this, ctx, clip, local, scene, assets);
    }
    const [x, y, w, h] = slot.box;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#050606';
    ctx.fillRect(0, 0, 1920, 952);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.font = FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    lanes ??= Array.from({length: ROWS}, (_, lane) => {
      let width = 0;
      const items = names.filter((_, i) => i % ROWS === lane).map((name, i) => {
        const item = {name, left: width, textWidth: ctx.measureText(name).width, color: COLORS[(lane + i) % COLORS.length]};
        width += item.textWidth + 54;
        return item;
      });
      return {items, width};
    });
    const elapsed = window.NarrationMediaElapsed?.(slot) ?? time - slot.globalStart;
    lanes.forEach(({items, width}, lane) => {
      const offset = (lane * 173 + elapsed * (82 + lane % 4 * 13)) % width;
      const centerY = y + (lane + .5) * h / ROWS;
      for (const item of items) {
        const left = (item.left - offset + width) % width;
        ctx.fillStyle = item.color;
        if (left < w) ctx.fillText(item.name, x + left, centerY);
        if (left + item.textWidth > width) ctx.fillText(item.name, x + left - width, centerY);
      }
    });
    ctx.restore();
    return true;
  };
}

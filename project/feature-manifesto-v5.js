// The four final declarations are visual excerpts; the spoken track stays verbatim.
const rows = [
  { at: 2162.16, lead: '我们不能接受', lines: ['这样一种未来：', '人民只能等待资本家决定能使用什么、创造什么。'] },
  { at: 2176.34, lead: '我们不能让', lines: ['属于全社会的知识积累，', '永远被资本家卡住脖子。'] },
  { at: 2182.28, lead: '我们不能让', lines: ['正在形成的新生产关系，', '在襁褓之中就被旧势力扼杀。'] },
  { at: 2188.90, lead: '我们更不能接受', lines: ['属于无产阶级的世界，', '离我们越来越远。'] }
];
const end = 2201.84;
const serif = '"Noto Serif SC", SimSun, serif';
const red = '#c45d55';
const paper = '#eee9df';
const ease = x => { x = Math.min(1, Math.max(0, x)); return x*x*(3-2*x); };

export function drawFeatureManifesto(ctx, audioTime) {
  if (audioTime < rows[0].at || audioTime >= end) return null;
  const visible = rows.filter(row => audioTime >= row.at);
  const exit = 1-ease((audioTime-(end-.76))/.76);
  const field = ease((audioTime-rows[0].at)/.55)*exit;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.beginPath(); ctx.rect(0,0,1090,952); ctx.clip();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = field;
  const shade = ctx.createLinearGradient(76,0,1090,0);
  shade.addColorStop(0,'rgba(9,8,9,.88)');
  shade.addColorStop(.69,'rgba(12,9,10,.74)');
  shade.addColorStop(1,'rgba(12,9,10,0)');
  ctx.fillStyle=shade; ctx.fillRect(0,0,1090,952);
  ctx.textAlign='left'; ctx.textBaseline='top';
  visible.forEach((row,i) => {
    const reveal=ease((audioTime-row.at)/.42);
    const latest=i===visible.length-1;
    const y=110+i*191+(1-reveal)*13;
    ctx.globalAlpha=exit*reveal*(latest?1:.72);
    ctx.fillStyle=red;
    ctx.fillRect(129,y+9,4,123);
    ctx.font='700 23px "Microsoft YaHei",sans-serif';
    ctx.fillText(String(i+1).padStart(2,'0'),150,y+8);
    ctx.font='900 56px '+serif;
    ctx.fillText(row.lead,213,y,820);
    ctx.fillStyle=paper;
    ctx.font='600 35px '+serif;
    row.lines.forEach((line,j)=>ctx.fillText(line,215,y+75+j*43,802));
  });
  ctx.restore();
  return {mode:'manifesto',audioTime,rows:visible.map(row=>row.lead),
    latest:visible.at(-1)?.lead,opacity:exit,box:[129,110,888,764],subtitleTouched:false};
}

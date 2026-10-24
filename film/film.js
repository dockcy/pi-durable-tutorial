/* 《先记一笔》· B 寓言 · 全片 156 秒（42 镜 + 片名 + 规矩卡 + 尾卡）。分镜表见同目录 storyboard.md，事实与出处见 facts.md。
 * 论点：AI 智能体扛得住断电，靠的不是更聪明，而是一本账——每件事先记一笔，再动手；重启以后，只信账上写了的。
 * 前 35 秒：停电以后，人不记得自己做到哪了，锅却记得（左上角咸淡表一直量着锅里真实的盐）；后面：老厨子的账本怎么用、电脑里的智能体、pi-durable 的几条规矩，最后回到年轻厨子。
 * 示意：厨房、厨子、账本、咸淡表都是画的比喻；“一勺盐 = 一件做两次就坏事的操作（扣款、发邮件、部署）”。
 * 颜色：金 = 记下的、算数的；红 = 做过头的、危险的。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit;

const T = { s2: 3.8, s3: 6.9, dark: 7.8, on: 8.8, s5: 12.3, s6: 15.6, s7: 18.9, tdip: 21.6, t0: 22.15, tout: 27.6, s8: 28.2, s9: 31.5, end: 156 };
const SUBS = [
  { a: .4,   b: 3.4,  zh: '深夜，灶上熬着一锅汤' },
  { a: 3.9,  b: 6.7,  zh: '厨子舀起一勺盐，倒进锅里' },
  { a: 9.1,  b: 12.0, zh: '灯再亮起，他忘了刚才那一勺' },
  { a: 12.4, b: 15.4, zh: '再放一勺，可能就{!太咸}了' },
  { a: 15.8, b: 18.6, zh: '不放，又可能根本没放过' },
  { a: 19.1, b: 21.3, zh: '到底放没放？', big: 1 },
  { a: 28.6, b: 31.3, zh: '隔壁的老厨子，灶边多一本{账}' },
  { a: 31.7, b: 34.8, zh: '放盐之前，他先写一行：要放盐' },
  { a: 35.4,  b: 38.4,  zh: '写完，才去动盐勺' },
  { a: 38.8,  b: 41.8,  zh: '放完，在这一行后面打个{勾}' },
  { a: 42.3,  b: 45.4,  zh: '先记一笔，再动手，再打勾', tone: 'gold' },
  { a: 46.2,  b: 48.9,  zh: '再来一遍。这次，停电来得正巧' },
  { a: 51.0,  b: 53.6,  zh: '灯亮了。他不靠回忆，先翻{账本}' },
  { a: 54.4,  b: 57.0,  zh: '有“要放盐”，却没有{勾}' },
  { a: 57.8,  b: 60.2,  zh: '那就是：{!可能放过了}' },
  { a: 61.0,  b: 63.8,  zh: '他不放第二勺，先尝一口' },
  { a: 64.6,  b: 67.2,  zh: '要是这一行写的是“搅一搅”呢？' },
  { a: 68.0,  b: 70.8,  zh: '多搅一次也无妨，放心再搅' },
  { a: 71.6,  b: 74.4,  zh: '能不能重做，写在每行的开头' },
  { a: 77.0,  b: 79.8,  zh: '拉远一看，这间厨房在一台{电脑}里' },
  { a: 80.6,  b: 83.4,  zh: 'AI 智能体，就是这个厨子' },
  { a: 84.2,  b: 87.0,  zh: '它的“盐”，是扣款、发邮件、部署上线' },
  { a: 87.8,  b: 90.6,  zh: '它的“停电”，是程序崩溃、机器重启' },
  { a: 91.4,  b: 94.2,  zh: '没有账本，重启后它只会{!再扣一次}' },
  { a: 95.0,  b: 97.8,  zh: '这本账，叫 {pi-durable}' },
  { a: 98.8,  b: 101.6, zh: '账本只有{一支笔}，谁要记，排队拿笔' },
  { a: 102.4, b: 105.2, zh: '一行字，要么整行写完' },
  { a: 106.0, b: 108.8, zh: '要么整行撕掉，当它没发生' },
  { a: 109.8, b: 112.6, zh: '客人等急了，跑堂把同一张单又递了一次' },
  { a: 113.4, b: 116.2, zh: '账上一查：7 号已经记过了' },
  { a: 117.0, b: 119.8, zh: '锅里还是一锅汤，不是两锅' },
  { a: 120.8, b: 123.6, zh: '一锅老汤熬四步，每做完一步记一笔' },
  { a: 124.4, b: 127.2, zh: '停电以后，从最后一个{勾}往下接着做' },
  { a: 131.6, b: 134.4, zh: '记下来的才算数；没记下的，当它没发生', tone: 'gold' },
  { a: 135.4, b: 138.2, zh: '年轻的厨子，也在灶边放了一本{账}' },
  { a: 139.0, b: 141.8, zh: '灯又灭了。这一次，他先看一眼账本' },
  { a: 142.6, b: 145.2, zh: '“要放盐”，后面有勾——盐，放过了' },
  { a: 146.2, b: 149.4, zh: '先记一笔，再动手。', tone: 'gold', big: 1 },
];
const GOLD = '#EEC672', RED = '#FC593F', SKIN = '#E9B48C', SKIN2 = '#D99C74', JACKET = '#F4F1EA', SLEEVE = '#E0D9CC', HAT = '#F7F4EE';
const SOUP_Y = 484, POT_X = 1080;

/* 关键帧插值：[[t, v], ...]，段间 io3 缓动，两头停住 */
const K3 = (t, pts) => { let i = 0; while (i < pts.length - 2 && t >= pts[i + 1][0]) i++; const p = pts[i], q = pts[i + 1]; return lerp(p[1], q[1], E.io3(seg(t, p[0], q[0]))); };
/* 两节手臂：肩 → 肘 → 手，肘往下弯 */
function ik(sx, sy, hx, hy, L1, L2) {
  let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy); const dm = L1 + L2 - 2;
  if (d > dm) { hx = sx + dx / d * dm; hy = sy + dy / d * dm; d = dm; }
  const a = Math.atan2(dy, dx), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  return [sx + Math.cos(a + b) * L1, sy + Math.sin(a + b) * L1, hx, hy];
}

/* ---------- 厨房（世界坐标 1920×1080）：墙、窗、吊灯、架子、台面、灶、锅 ---------- */
function room(fr, t, L) {
  fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, 640, [[0, '#2A2331'], [1, '#3D3342']]) });
  fr.glow(POT_X, 300, 760, '#FFB870', .16 * L);
  /* 窗：夜空、月亮 */
  fr.rect(140, 140, 340, 290, { r: 8, fill: '#211B28' });
  fr.rect(156, 156, 308, 258, { fill: fr.grad(0, 156, 0, 414, [[0, '#18203A'], [1, '#2E3B62']]) });
  for (let i = 0; i < 9; i++) fr.circle(170 + hash(i * 3.1) * 280, 170 + hash(i * 7.7) * 200, 1.6 + hash(i) * 1.4, { fill: '#DDE4F4', a: .5 + .4 * Math.sin(t * 1.3 + i) });
  fr.glow(400, 205, 70, '#F4E9C8', .25); fr.circle(400, 205, 38, { fill: '#F4ECD0' });
  fr.rect(305, 156, 10, 258, { fill: '#211B28' }); fr.rect(156, 280, 308, 10, { fill: '#211B28' });
  fr.rect(126, 424, 368, 16, { r: 4, fill: '#5C4232' });
  /* 墙砖 */
  fr.rect(0, 446, W, 184, { fill: '#4B3F4D' });
  for (let x = 0; x < W; x += 58) fr.rect(x, 446, 2, 184, { fill: '#3E3340', a: .8 });
  for (let y = 446; y < 630; y += 46) fr.rect(0, y, W, 2, { fill: '#3E3340', a: .8 });
  /* 右边的架子、挂着的厨具 */
  fr.rect(1400, 296, 430, 16, { r: 3, fill: '#7A5236' });
  fr.rect(1432, 214, 70, 82, { r: 10, fill: '#C98B4A' }); fr.rect(1426, 204, 82, 16, { r: 5, fill: '#9C6532' });
  fr.rect(1532, 236, 58, 60, { r: 10, fill: '#7FA07A' }); fr.rect(1528, 228, 66, 12, { r: 4, fill: '#5E7E5A' });
  for (let i = 0; i < 3; i++) fr.ellipse(1712, 290 - i * 10, 76, 9, { fill: i % 2 ? '#D9D2C4' : '#EDE7DB' });
  fr.line(1490, 312, 1490, 420, { w: 6, color: '#9AA0AA' }); fr.ellipse(1490, 430, 22, 14, { fill: '#9AA0AA' });
  fr.line(1570, 312, 1570, 400, { w: 6, color: '#B98A55' }); fr.ellipse(1570, 420, 14, 26, { fill: '#B98A55' });
  fr.circle(1700, 470, 62, { fill: '#2C2B31' }); fr.circle(1700, 470, 48, { fill: '#38373E' }); fr.line(1700, 408, 1700, 330, { w: 8, color: '#2C2B31' });
  /* 盐罐所在的小搁板 */
  fr.rect(790, 410, 180, 14, { r: 3, fill: '#7A5236' }); fr.path('M 812,424 L 836,424 L 816,456 Z', { fill: '#5C3C26' }); fr.path('M 924,424 L 948,424 L 944,456 Z', { fill: '#5C3C26' });
}
function lamp(fr, L) {
  fr.line(POT_X, 0, POT_X, 172, { w: 4, color: '#17131B' });
  fr.path(`M ${POT_X - 82},240 L ${POT_X + 82},240 L ${POT_X + 40},168 L ${POT_X - 40},168 Z`, { fill: mix('#5A3A1E', '#C07A34', .35 + .65 * L) });
  fr.ellipse(POT_X, 242, 36, 12, { fill: mix('#3A3530', '#FFF1C8', L) });
  if (L > 0) fr.glow(POT_X, 250, 300, '#FFD08A', .55 * L);
}
function lightCone(fr, L) {
  if (L <= 0) return;
  fr.path(`M ${POT_X - 76},244 L ${POT_X + 76},244 L ${POT_X + 360},660 L ${POT_X - 360},660 Z`, { fill: fr.grad(0, 244, 0, 660, [[0, '#FFE2A8', .2 * L], [1, '#FFE2A8', 0]]), add: true });
}
function counter(fr) {
  fr.rect(0, 626, W, 44, { fill: '#A87A50' }); fr.rect(0, 664, W, 8, { fill: '#8C6240' });
  fr.rect(0, 672, W, 408, { fill: '#6E4A30' });
  for (let i = 0; i < 4; i++) { const x = 110 + i * 440; fr.rect(x, 712, 400, 330, { r: 10, fill: '#634229' }); fr.rect(x + 176, 742, 48, 12, { r: 6, fill: '#C9A25E' }); }
}
function burner(fr, t) {
  fr.rect(POT_X - 130, 612, 260, 16, { r: 4, fill: '#26252B' });
  for (let i = 0; i < 7; i++) { const x = POT_X - 102 + i * 34, h = 16 + 5 * Math.sin(t * 9 + i * 1.7); fr.ellipse(x, 612 - h * .45, 8, h * .55, { fill: '#5FA8E8', a: .9 }); fr.ellipse(x, 612 - h * .3, 4, h * .3, { fill: '#F3B04A' }); }
}
function pot(fr) {
  fr.rect(POT_X - 180, 498, 34, 14, { r: 6, fill: '#34353C' }); fr.rect(POT_X + 146, 498, 34, 14, { r: 6, fill: '#34353C' });
  fr.path(`M ${POT_X - 150},${SOUP_Y - 4} L ${POT_X + 150},${SOUP_Y - 4} L ${POT_X + 142},592 Q ${POT_X + 138},608 ${POT_X + 120},608 L ${POT_X - 120},608 Q ${POT_X - 138},608 ${POT_X - 142},592 Z`, { fill: '#45464E' });
  fr.rect(POT_X - 128, 500, 14, 92, { r: 7, fill: '#5C5E68' });
  fr.ellipse(POT_X, SOUP_Y - 4, 156, 24, { fill: '#5A5C66' });
  fr.ellipse(POT_X, SOUP_Y - 2, 140, 17, { fill: '#C98E3E' }); fr.ellipse(POT_X - 10, SOUP_Y - 4, 96, 10, { fill: '#DDA757' });
}
function stoveAndPot(fr, t) { burner(fr, t); pot(fr); }
function steam(fr, t, a = 1) {
  for (let k = 0; k < 3; k++) {
    const x0 = POT_X - 70 + k * 70, pts = [];
    for (let j = 0; j <= 14; j++) { const y = SOUP_Y - 20 - j * 15; pts.push([x0 + 22 * Math.sin(y * .03 + t * 1.8 + k * 2.1) + j * 2, y]); }
    fr.g({ blur: 5 }, () => fr.poly(pts, { color: '#FFFFFF', w: 16, a: .13 * a }));
  }
}
/* 盐罐：白罐子、蓝标签“盐”，口上露着盐 */
function saltJar(fr) {
  fr.rect(818, 332, 92, 80, { r: 12, fill: '#F1EEE8' }); fr.ellipse(864, 334, 46, 9, { fill: '#FFFFFF' }); fr.ellipse(864, 334, 46, 9, { color: '#D6D1C6', w: 2 });
  fr.circle(864, 378, 22, { fill: '#4F7BB5' }); fr.text('盐', 864, 379, { font: 'sansh', size: 26, color: '#FFFFFF' });
}
/* 量盐的小勺：hand 手的位置，phi 勺柄方向，theta 勺口前倾，fill 勺里还有多少盐。返回勺口的位置 */
function scoop(fr, hx, hy, phi, theta, fill) {
  const bx = hx + Math.cos(phi) * 66, by = hy + Math.sin(phi) * 66;
  fr.line(hx, hy, bx, by, { w: 9, color: '#AEB4BE' });
  fr.g({ at: [bx, by], rot: theta }, () => {
    fr.ellipse(0, 0, 28, 18, { fill: '#C9CED6', a0: 0, a1: Math.PI });
    if (fill > 0) fr.ellipse(0, -2, 26 * (.4 + .6 * fill), 9 * fill + 2, { fill: '#FFFFFF' });
    fr.ellipse(0, 0, 28, 5, { color: '#9EA4AE', w: 2.5 });
  });
  return [bx + Math.cos(theta) * 28, by + Math.sin(theta) * 28];
}
/* 一勺盐落进锅：t0..t1 之间陆续撒下，落到汤面溅起小圈。ghost = 只是“如果”的虚影 */
function grains(fr, t, t0, t1, lip, a = 1, n = 34) {
  const g = 2600, drop = Math.max(10, SOUP_Y - lip[1]), tl = Math.sqrt(2 * drop / g);
  for (let i = 0; i < n; i++) {
    const te = t0 + (t1 - t0) * i / n, age = t - te; if (age < 0) continue;
    const vx = 30 + hash(i + 7) * 50, x = lip[0] + (hash(i) * 2 - 1) * 7 + age * vx;
    if (age < tl) fr.circle(x, lip[1] + .5 * g * age * age, 3.6 + hash(i + 3) * 1.6, { fill: '#FFFFFF', a });
    else { const k = seg(age - tl, 0, .5); if (k < 1) fr.ellipse(lip[0] + (hash(i) * 2 - 1) * 7 + tl * vx, SOUP_Y, 4 + k * 22, 2 + k * 5, { color: '#FFF4DA', w: 2, a: (1 - k) * .7 * a }); }
  }
}
/* 厨子：侧身站在台面后，面朝右边的锅。o.old = 白胡子老厨子（棕围裙）；o.rot 头的转向；o.brow 皱眉犯难 */
function chefBody(fr, t, o) {
  const bob = Math.sin(t * 1.6) * 2, blink = ((t + (o.old ? 1.3 : 0)) % 3.4) < .12 ? .15 : 1;
  fr.g({ at: [640, 640 + bob] }, () => {
    fr.ellipse(10, -60, 116, 176, { fill: JACKET });
    if (o.old) fr.path('M 50,-170 Q 128,-150 126,-40 L 122,60 L 30,60 Z', { fill: '#8A5A36' });
    else { fr.circle(102, -150, 5, { fill: '#CFC8BB' }); fr.circle(110, -96, 5, { fill: '#CFC8BB' }); }
    fr.rect(-8, -262, 38, 34, { fill: SKIN2 });
    fr.path('M 6,-238 L 82,-232 L 44,-196 Z', { fill: o.old ? '#4F6E8C' : '#C9573A' });
    fr.g({ at: [12, -248], rot: o.rot || 0 }, () => fr.g({ at: [-12, 248] }, () => {
      fr.circle(10, -318, 70, { fill: SKIN });
      fr.ellipse(-36, -312, 14, 20, { fill: SKIN2 });
      if (o.old) { fr.ellipse(-46, -352, 18, 22, { fill: '#EEEAE2' }); fr.path('M -30,-292 Q -10,-200 70,-232 Q 96,-246 92,-288 Q 60,-262 20,-276 Z', { fill: '#F2F0EA' }); fr.ellipse(66, -284, 26, 10, { fill: '#F2F0EA' }); }
      fr.ellipse(46, -326, 7.5, 7.5 * blink, { fill: '#2A1E1A' });
      const br = o.brow || 0; fr.line(30, -350 + br * 3, 62, -348 - br * 12, { w: o.old ? 8 : 6, color: o.old ? '#EEEAE2' : '#4A3228' });
      fr.ellipse(82, -306, 13, 12, { fill: SKIN2 });
      if (!o.old) { fr.circle(40, -290, 14, { fill: '#E58E77', a: .45 }); if (br > .5) fr.path('M 48,-268 q 5,-6 10,0 q 5,6 10,0', { color: '#9C5A4A', w: 4 }); else if (o.smile) fr.path('M 48,-276 q 10,9 20,0', { color: '#9C5A4A', w: 4 }); else fr.line(52, -270, 66, -272, { w: 4, color: '#9C5A4A' }); }
      fr.rect(-56, -398, 134, 34, { r: 6, fill: HAT }); fr.rect(-56, -372, 134, 8, { fill: '#DDD6CA' });
      fr.rect(-56, -446, 134, 54, { fill: HAT }); fr.circle(-30, -446, 40, { fill: HAT }); fr.circle(14, -466, 48, { fill: HAT }); fr.circle(58, -446, 38, { fill: HAT });
      fr.path('M 0,-470 Q 10,-420 6,-400', { color: '#E2DBCF', w: 4 });
    }));
  });
}
const SHOULDER = [690, 478];
function chefArm(fr, hand) {
  const [ex, ey, hx, hy] = ik(SHOULDER[0], SHOULDER[1], hand[0], hand[1], 172, 172);
  fr.line(SHOULDER[0], SHOULDER[1], ex, ey, { w: 50, color: SLEEVE }); fr.line(ex, ey, hx, hy, { w: 42, color: SLEEVE });
  const d = Math.hypot(hx - ex, hy - ey) || 1, ux = (hx - ex) / d, uy = (hy - ey) / d;
  fr.line(hx - ux * 34, hy - uy * 34, hx - ux * 20, hy - uy * 20, { w: 46, color: '#CFC6B6', cap: 'butt' });
  fr.circle(hx, hy, 23, { fill: SKIN });
}
/* 账本立在台面上的小木架里。so.rows：右页上已经写了几行（k 写到哪、tk 勾画到哪、gold 写完发金）；hiRow / hiA：某一行亮一下 */
function ledgerStand(fr, t, hi, so = {}) {
  fr.path('M 560,640 L 600,532 L 612,536 L 576,640 Z', { fill: '#5C3C26' }); fr.rect(520, 628, 260, 14, { r: 4, fill: '#7A5236' });
  if (hi > 0) fr.glow(650, 580, 230, GOLD, .32 * hi);
  fr.path('M 536,528 L 650,540 L 764,528 L 768,632 L 650,640 L 532,632 Z', { fill: '#6B4026' });
  fr.path('M 544,532 L 648,544 L 648,630 L 542,622 Z', { fill: '#E8D9B5' }); fr.path('M 652,544 L 756,532 L 758,622 L 652,630 Z', { fill: '#F0E4C6' });
  for (let i = 0; i < 4; i++) { const y = 556 + i * 18; fr.line(556, y + i * .3, 638, y + 9, { w: 2, color: '#B9A47E', a: .8 }); fr.line(662, y + 9, 746, y, { w: 2, color: '#B9A47E', a: .8 }); }
  for (let i = 0; i < 3; i++) { const y = 551 + i * 18; fr.line(560, y, 610, y + 5, { w: 3, color: '#6B5846', a: .7 }); fr.path(`M 616,${y + 3} l 6,6 l 10,-12`, { color: '#CFA55E', w: 3 }); }
  (so.rows || []).forEach((r, i) => {
    const y = 559 + i * 18;
    if (r.k > 0) fr.line(668, y, 668 + 44 * r.k, y - 4.7 * r.k, { w: 3, color: r.gold ? '#9A6A26' : '#6B5846', a: .85 });
    if (r.tk > 0) fr.poly([[718, y - 6], [724, y], [734, y - 12]], { color: '#CFA55E', w: 3, k: r.tk });
  });
  if (so.hiRow != null && so.hiA > 0) fr.glow(700, 556 + so.hiRow * 18, 70, GOLD, .55 * so.hiA);
  if (!so.noPen) { fr.line(690, 650, 790, 646, { w: 7, color: '#2E2A33' }); fr.line(786, 646, 800, 645, { w: 4, color: '#C9A25E' }); }
}

/* ---------- 年轻厨子这一段的动作（第 1–7 镜）---------- */
const stirH = tt => [1000 + 36 * Math.cos(tt * 2.3), 425 + 9 * Math.sin(tt * 2.3)];
function poseA(t) {
  const p = { rot: K3(t, [[0, .12], [3.9, .12], [4.3, -.16], [4.95, -.16], [5.5, .1], [8.3, .1], [9.3, .08], [9.7, -.04], [10.4, -.04], [10.8, .17], [11.5, .17], [11.9, -.04], [12.6, .06], [30, .06]]), brow: ss(t, 9.4, 10.0) };
  if (t < 3.85) { p.hand = stirH(t); p.tool = 'ladle'; return p; }
  if (t < 8.3) {
    const h0 = stirH(3.85);
    p.hand = [K3(t, [[3.85, h0[0]], [4.5, 902], [4.75, 898], [5.15, 920], [5.8, 1005], [8.3, 1005]]), K3(t, [[3.85, h0[1]], [4.5, 288], [4.75, 300], [5.15, 250], [5.8, 405], [8.3, 405]])];
    p.phi = K3(t, [[4.75, 2.11], [5.15, 1.3], [5.8, .08], [8.3, .08]]);
    p.theta = K3(t, [[5.85, 0], [6.15, 1.1], [6.4, 1.1], [6.8, 0], [8.3, 0]]);
    p.fill = t < 4.6 ? 0 : 1 - seg(t, 5.95, 6.45);
    p.tool = t < 4.5 ? 'none' : 'scoop'; p.inJar = t < 5.2; p.rel = 3.85;
    return p;
  }
  p.hand = [K3(t, [[15.8, 995], [16.5, 968]]), K3(t, [[15.8, 400], [16.5, 392]])];
  p.phi = K3(t, [[15.8, .05], [16.5, -.12]]);
  p.theta = K3(t, [[12.7, 0], [13.2, .38], [15.7, .38], [16.3, -.08]]);
  p.fill = 1; p.tool = 'scoop'; p.rel = 3.85;
  return p;
}
/* 灯：第 7 秒闪两下，7.8 秒全黑，8.8 秒再亮 */
function lampL(t) {
  if (t < 6.95 || t > 9.2) return 1;
  if (t >= T.dark && t < T.on) return 0;
  if (t >= T.on) return ss(t, T.on, T.on + .08) * (t > 8.95 && t < 9.02 ? .35 : 1);
  return (Math.abs(t - 7.04) < .045 || Math.abs(t - 7.3) < .06 || Math.abs(t - 7.52) < .035) ? .12 : 1;
}

/* 手里的小东西：写字的笔、尝汤的小勺、盛汤的长勺；台面上的一只碗 */
function penSmall(fr, h) { fr.line(h[0] + 14, h[1] + 22, h[0] - 22, h[1] - 22, { w: 7, color: '#2E2A33' }); fr.line(h[0] - 22, h[1] - 22, h[0] - 28, h[1] - 30, { w: 4, color: '#C9A25E' }); }
function serveLadle(fr, p) {
  const [hx, hy] = p.hand, cx = hx - 20, cy = hy + 130, tl = -(p.tilt || 0);
  fr.line(hx, hy, cx + 6, cy - 16, { w: 10, color: '#B98A55' });
  fr.g({ at: [cx, cy], rot: tl }, () => { fr.ellipse(0, 0, 30, 20, { fill: '#8C6240', a0: 0, a1: Math.PI }); if (p.full > 0) fr.ellipse(0, -1, 27 * (.5 + .5 * p.full), 3 + 4 * p.full, { fill: '#DDA757' }); fr.ellipse(0, 0, 30, 6, { color: '#6E4A30', w: 2.5 }); });
  if (p.stream > 0) { const lx = cx - Math.cos(tl) * 30, ly = cy - Math.sin(tl) * 30; fr.line(lx, ly, lx - 3, 580, { w: 8 * p.stream, color: '#DDA757' }); }
}
function bowl(fr, t, b) {
  const x = b.x, y = 618;
  if (b.glow > 0) fr.glow(x, y - 40, 190, GOLD, .32 * b.glow);
  fr.path(`M ${x - 74},${y - 44} Q ${x - 70},${y + 4} ${x},${y + 6} Q ${x + 70},${y + 4} ${x + 74},${y - 44} Z`, { fill: '#F1EEE8' });
  fr.rect(x - 30, y + 2, 60, 8, { r: 3, fill: '#D6D1C6' });
  fr.ellipse(x, y - 44, 74, 13, { fill: '#D6D1C6' });
  if (b.fill > 0) fr.ellipse(x, y - 44 + 7 * (1 - b.fill), 66 * (.55 + .45 * b.fill), 4 + 6 * b.fill, { fill: '#DDA757' });
  fr.path(`M ${x - 52},${y - 24} Q ${x},${y - 10} ${x + 52},${y - 24}`, { color: '#4F7BB5', w: 4 });
  if (b.fill > .8) for (let k = 0; k < 2; k++) { const pts = []; for (let j = 0; j <= 8; j++) { const yy = y - 64 - j * 14; pts.push([x - 20 + k * 40 + 10 * Math.sin(yy * .05 + t * 2 + k), yy]); } fr.g({ blur: 4 }, () => fr.poly(pts, { color: '#FFFFFF', w: 10, a: .14 * ss(b.fill, .8, 1) })); }
}

function kitchen(fr, t, o) {
  const L = o.L == null ? 1 : o.L, p = o.pose, tool = p.tool;
  room(fr, t, L); lamp(fr, L);
  const inJar = tool === 'scoop' && p.inJar && (p.hand[1] + Math.sin(p.phi) * 66) > 326;
  if (tool !== 'scoop' && !p.scoopDown) scoop(fr, 902, 288, 2.11, 0, 0);                         // 勺插在盐罐里
  if (inJar) scoop(fr, p.hand[0], p.hand[1], p.phi, p.theta || 0, p.fill);
  saltJar(fr);
  chefBody(fr, t, { old: o.old, rot: p.rot, brow: p.brow, smile: p.smile });
  counter(fr); burner(fr, t); pot(fr);
  if (o.ghostPot > 0) fr.layer({ a: o.ghostPot }, () => fr.g({ at: [400, 0] }, () => { fr.rect(POT_X - 130, 612, 260, 16, { r: 4, fill: '#26252B' }); pot(fr); }));
  if (o.bowl) bowl(fr, t, o.bowl);
  /* 搅汤的长勺：在手里，或者松手后斜靠在锅沿上 */
  if (tool !== 'ladle' && tool !== 'serve') { const r0 = p.rel == null ? -99 : p.rel, k = E.io3(seg(t, r0, r0 + .5)), h0 = stirH(r0), top = [lerp(h0[0], 1214, k), lerp(h0[1], 392, k)], bot = [lerp(h0[0] + 64, 1150, k), SOUP_Y + 2]; fr.line(top[0], top[1], bot[0], bot[1], { w: 11, color: '#B98A55' }); }
  if (p.scoopDown) scoop(fr, p.scoopDown[0], p.scoopDown[1], 0, 0, 1);                           // 放下的盐勺平躺在台面上，盐还满着
  if (o.ledger) ledgerStand(fr, t, o.ledgerHi || 0, Object.assign({ noPen: tool === 'pen' }, o.stand || {}));
  steam(fr, t, L > .5 ? 1 : .3);
  if (tool === 'ladle') { const h = p.hand; fr.line(h[0], h[1], h[0] + 64, SOUP_Y + 2, { w: 11, color: '#B98A55' }); fr.ellipse(h[0] + 64, SOUP_Y + 1, 18, 4, { color: '#F3D9A6', w: 2, a: .7 }); }
  let lip = null;
  if (tool === 'scoop' && !inJar) lip = scoop(fr, p.hand[0], p.hand[1], p.phi, p.theta || 0, p.fill);
  if (tool === 'taste') { const h = p.hand, ex = h[0] + Math.cos(p.phi) * 54, ey = h[1] + Math.sin(p.phi) * 54; fr.line(h[0], h[1], ex, ey, { w: 6, color: '#AEB4BE' }); fr.ellipse(ex, ey, 14, 8, { fill: '#C9CED6', rot: p.phi }); if (p.sip > 0) fr.ellipse(ex, ey - 1, 10, 4, { fill: '#DDA757', a: p.sip, rot: p.phi }); }
  if (tool === 'serve') serveLadle(fr, p);
  chefArm(fr, p.hand);
  if (tool === 'pen') penSmall(fr, p.hand);
  if (lip && o.pour) grains(fr, t, o.pour[0], o.pour[1], lip, o.pour[2] == null ? 1 : o.pour[2]);
  if (lip && o.ghost) grains(fr, t, o.ghost[0], o.ghost[1], lip, .38, 26);
  lightCone(fr, L);
}
/* 镜头：at 世界坐标里对准的点，s 放大倍数 */
function cam(fr, c, fn) { fr.g({ at: [W / 2, H / 2], s: c.s }, () => fr.g({ at: [-c.cx, -c.cy] }, fn)); }
function camA(t) {
  if (t < 8.3) { const k = E.io3(seg(t, 3.5, 4.7)), a = seg(t, 0, 3.8); return { cx: lerp(lerp(960, 930, a), 880, k), cy: lerp(lerp(540, 520, a), 470, k), s: lerp(lerp(1, 1.05, a), 1.35 + .03 * seg(t, 4.7, 8.3), k) }; }
  const q = E.io3(seg(t, T.s7, T.tdip));
  return { cx: lerp(885, 930, q), cy: lerp(430, 410, q), s: lerp(1.7, 1.74, seg(t, 8.3, T.s7)) + .12 * q };
}

/* ---------- 咸淡表：全片的那把尺子。量的是锅里真有多少盐，不管厨子记不记得 ---------- */
function saltMeter(fr, o) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const x = 45, y = 35, w = 346, h = 205, cx = x + w / 2, cy = y + h * .84, R = 118, A0 = Math.PI * 1.02, A1 = Math.PI * 1.98, ang = v => lerp(A0, A1, clamp(v / 2)), v = o.v;
  const zone = q => q < .55 ? 0 : q < 1.45 ? 1 : 2, ZN = ['淡', '正好', '太咸'], ZC = ['#9FB3C8', GOLD, '#F0705A'];
  fr.g({ a }, () => {
    fr.rect(x, y, w, h, { r: 16, fill: '#14100C', a: .97 }); fr.rect(x, y, w, h, { r: 16, color: '#6E5F47', w: 1.2, a: .5 });
    fr.text('咸淡表', x + 18, y + 24, { font: 'sansm', size: 19, color: '#A89F90', align: 'l', track: 3 });
    fr.arc(cx, cy, R, ang(0), ang(.55), { color: '#8FA3B8', w: 6, cap: 'butt' });
    fr.arc(cx, cy, R, ang(.55), ang(1.45), { color: '#E9DFC8', w: 5, cap: 'butt' });
    fr.arc(cx, cy, R, ang(1.45), ang(2), { color: '#E8402A', w: 7, cap: 'butt', glow: zone(v) === 2 || (o.ghost != null && zone(o.ghost) === 2) ? 12 : 0 });
    for (const q of [.55, 1.45]) { const an = ang(q); fr.line(cx + Math.cos(an) * (R - 14), cy + Math.sin(an) * (R - 14), cx + Math.cos(an) * (R + 6), cy + Math.sin(an) * (R + 6), { w: 2, color: '#E9DFC8', cap: 'butt' }); }
    const zv = zone(v), on = i => i === zv;
    fr.text('淡', cx - R + 6, cy + 18, { font: on(0) ? 'sansh' : 'sans', size: on(0) ? 30 : 21, color: '#9FB3C8', a: on(0) ? 1 : .6 });
    fr.text('正好', cx, y + 30, { font: on(1) ? 'sansh' : 'sans', size: on(1) ? 30 : 21, color: on(1) ? GOLD : '#E9DFC8', a: on(1) ? 1 : .6 });
    fr.text('太咸', cx + R - 12, cy + 18, { font: on(2) ? 'sansh' : 'sans', size: on(2) ? 30 : 21, color: '#F0705A', a: on(2) ? 1 : .6 });
    if (o.ghost != null && o.ghostA > 0) { const an = ang(o.ghost), c = o.ghost > 1.45 ? '#F0705A' : '#9FB3C8'; fr.line(cx, cy, cx + Math.cos(an) * (R - 22), cy + Math.sin(an) * (R - 22), { w: 3, color: c, a: o.ghostA, dash: [9, 7], cap: 'butt' }); }
    const an = ang(v); fr.line(cx, cy, cx + Math.cos(an) * (R - 16), cy + Math.sin(an) * (R - 16), { w: 5, color: ZC[zone(v)] }); fr.circle(cx, cy, 9, { fill: '#C9A861' });
  });
  const n = Math.round(v);
  fr.text(`锅里的盐：${n} 勺`, cx, y + h + 28, { font: 'sansm', size: 27, track: 2, color: '#F3EBDA', a, shadow: .7 });
  if (o.ghostLabel && o.ghostA > 0) fr.text(o.ghostLabel, cx, y + h + 68, { font: 'sansm', size: 25, track: 2, color: o.ghost > 1.45 ? '#F0705A' : '#B7C6D6', a: a * o.ghostA, shadow: .7 });
}

/* ---------- 片名卡的母题：一本摊开的账，一笔一勾 ---------- */
function motifBook(fr, lt, a) {
  const cx = 960, y0 = 588, c = '#D9B15F', k = ss(lt, 1.0, 1.7) * a; if (k <= 0) return;
  fr.poly([[cx, 600], [cx - 150, y0], [cx - 150, y0 + 96], [cx, y0 + 110], [cx + 150, y0 + 96], [cx + 150, y0], [cx, 600]], { color: c, w: 2.2, a: k, k: ss(lt, 1.0, 1.9) });
  fr.line(cx, 600, cx, y0 + 110, { w: 2.2, color: c, a: k });
  for (let i = 0; i < 3; i++) {
    const y = y0 + 30 + i * 24, kl = ss(lt, 1.6 + i * .4, 1.9 + i * .4), kt = ss(lt, 1.85 + i * .4, 2.0 + i * .4);
    fr.line(cx - 128, y - 6, cx - 128 + 100 * kl, y - 6 + 3 * kl, { w: 2, color: c, a: .5 * k });
    if (kl > 0) fr.line(cx + 22, y, cx + 22 + 70 * kl, y - 2 * kl, { w: 2.4, color: c, a: k });
    if (kt > 0) fr.poly([[cx + 104, y - 4], [cx + 112, y + 4], [cx + 128, y - 12]], { color: '#F4E0B7', w: 3, a: k, k: kt, glow: 8 });
  }
}

/* ---------- 账本特写（第 9、11、16、18b、19、21、25、30、33、35、41 镜共用）----------
 * 一行 r：{ i 第几行, s 字, size, a, w0 开始写, per 每字间隔, cd 每字用时, cut 只写到第几个字, glow 写完发金的时刻,
 *          tick 打勾时刻, note 行尾小字, hi 整行高亮 [a,b], slot 空着的勾位 [a,b], q 红问号 [a,b], maybe “可能做过了” [a,b],
 *          stamp 行首印章 {s,c,t}, lift 整行撕掉的时刻, pulse 金光一闪, tg 勾上一闪, pen:false 打字不用笔, textPen:false 字是早写好的 } */
const RX = 1220, rowY = i => 222 + i * 90, INK = '#3B2A1E', INK_GOLD = '#8A5A1E', TICK = '#C9973F', STAMP_RED = '#D8452E', STAMP_GOLD = '#B98A2E';
const bell = (t, t0, d) => { const u = (t - t0) / d; return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI); };
function bookBase(fr, t, cfg) {
  fr.rect(344, 148, 1460, 680, { r: 20, fill: '#000', a: .35 });
  fr.rect(330, 130, 1460, 680, { r: 20, fill: '#6B4026' });
  fr.rect(354, 150, 686, 640, { r: 6, fill: fr.grad(354, 0, 1040, 0, [[0, '#E8D9B5'], [.85, '#E4D3AC'], [1, '#C9B48C']]) });
  fr.rect(1060, 150, 706, 640, { r: 6, fill: fr.grad(1060, 0, 1766, 0, [[0, '#CDB990'], [.1, '#EFE3C4'], [1, '#F2E7CB']]) });
  fr.rect(1040, 150, 20, 640, { fill: '#5C3620' });
  for (let k = 0; k < 6; k++) { const y = 262 + k * 90; fr.line(390, y, 1010, y, { w: 2, color: '#BFA982' }); fr.line(1090, y, 1736, y, { w: 2, color: '#BFA982' }); }
  fr.line(490, 172, 490, 768, { w: 1.5, color: '#C98A6A', a: .45 }); fr.line(1190, 172, 1190, 768, { w: 1.5, color: '#C98A6A', a: .45 });
  (cfg.left || ['要洗菜', '要切葱', '要烧水', '要下骨头']).forEach((s, i) => {
    const y = 224 + i * 90, w = fr.text(s, 520, y, { font: 'serifm', size: 46, color: '#5A4636', align: 'l', a: .55 });
    fr.poly([[540 + w, y - 2], [552 + w, y + 12], [576 + w, y - 16]], { color: '#CFA55E', w: 5, a: .8 });
  });
}
/* 印章：盖下去的一瞬间大一点、淡一点 */
function stampMark(fr, t, x, y, s, c, t0) {
  if (t < t0) return; const k = E.out3(seg(t, t0, t0 + .14)), col = c === 'gold' ? STAMP_GOLD : STAMP_RED;
  fr.g({ at: [x, y], rot: -.09, s: lerp(1.6, 1, k), a: k * .92 }, () => {
    const w = fr.measure(s, { font: 'sansh', size: 30, track: 2 }) + 24;
    fr.rect(-w / 2, -26, w, 52, { r: 7, color: col, w: 4 });
    fr.text(s, 0, 1, { font: 'sansh', size: 30, track: 2, color: col });
  });
  if (k < 1) fr.glow(x, y, 90, c === 'gold' ? GOLD : '#FF8A6A', .35 * (1 - k));
}
/* 一条撕下来的纸：上下两边是锯齿 */
function stripPts(x0, x1, y0, y1, seed) {
  const top = [], bot = [], n = Math.ceil((x1 - x0) / 22);
  for (let j = 0; j <= n; j++) { const x = lerp(x0, x1, j / n); top.push([x, y0 + (j % 2 ? 7 : -3) + hash(seed + j) * 6]); bot.push([x, y1 + (j % 2 ? -6 : 4) - hash(seed + 40 + j) * 6]); }
  return top.concat(bot.reverse());
}
function bookRow(fr, t, r, ops, geo) {
  const y = rowY(r.i), size = r.size || 64, f = { font: 'serifm', size, track: size * .094, align: 'l' }, lay = fr.layout(r.s, RX, f);
  const per = r.per || .5, cd = r.cd || per * .85, w0 = r.w0 == null ? -99 : r.w0, n = r.cut == null ? lay.length : r.cut;
  const kc = i => i >= n ? 0 : seg(t, w0 + i * per, w0 + i * per + cd);
  const gk = r.glow == null ? (w0 < 0 && r.cut == null ? 1 : 0) : ss(t, r.glow, r.glow + .5);
  const last = lay[Math.max(0, n - 1)], tEnd = last.x + last.w;
  let nl = null, tx = tEnd + 18;
  if (r.note) { const no = r.note; nl = fr.layout(no.s, tEnd + 34, { font: 'serifm', size: no.size || 40, track: 3, align: 'l' }); const l2 = nl[nl.length - 1]; if (seg(t, no.w0, no.w0 + .01) > 0) tx = l2.x + l2.w + 16; }
  geo[r.i] = { y, x0: RX, tEnd, tx, tick: [tx + 60, y - 32] };
  const pen = r.pen !== false && r.textPen !== false;
  if (pen && w0 >= 0) lay.forEach((c, i) => { if (i < n) ops.push({ t0: w0 + i * per, t1: w0 + i * per + cd, x0: c.x, x1: c.x + c.w, y }); });
  if (r.note && r.pen !== false && r.note.w0 >= 0) nl.forEach((c, i) => { const a0 = r.note.w0 + i * r.note.per; ops.push({ t0: a0, t1: a0 + r.note.cd, x0: c.x, x1: c.x + c.w, y: y + 8 }); });
  const tpts = [[tx + 8, y - 8], [tx + 24, y + 12], [tx + 60, y - 32]];
  if (r.tick != null && r.tick > 0 && r.pen !== false && r.tickPen !== false) ops.push({ t0: r.tick, t1: r.tick + .3, pts: tpts });
  const A = r.a == null ? 1 : r.a;
  const band = (w, d = .35) => w ? ss(t, w[0], w[0] + d) * (1 - ss(t, w[1] - d, w[1])) : 0;
  const hk = band(r.hi);
  if (hk > 0) { fr.rect(1198, y - 42, 556, 84, { r: 8, fill: '#F6D77A', a: .3 * hk }); fr.glow(RX + 200, y, 360, GOLD, .14 * hk); }
  const content = () => {
    if (gk > 0) { const pg = r.glow != null && r.glow > 0 ? lerp(1, .35, ss(t, r.glow + .9, r.glow + 1.8)) : .35; fr.glow(RX + lay.w / 2, y, 300, GOLD, .3 * gk * pg); fr.line(1196, y + 40, lerp(1196, 1740, gk), y + 40, { w: 4, color: '#D9B15F', a: .9 }); }
    if (r.pulse) fr.glow(RX + lay.w / 2, y, 340, GOLD, .5 * bell(t, r.pulse, 1.0));
    const col = mix(INK, INK_GOLD, gk);
    lay.forEach((c, i) => {
      const k = kc(i); if (k <= 0) return;
      if (k >= 1) fr.text(c.ch, c.x, y, Object.assign({}, f, { color: col, a: A }));
      else fr.g({ clip: [c.x - 4, y - 60, (c.w + 8) * k, 120] }, () => fr.text(c.ch, c.x, y, Object.assign({}, f, { color: col, a: A })));
    });
    if (r.cursor && t > w0 - .3 && t < w0 + n * per + .6 && (t * 2.2 % 1) < .6) { let cx = RX; lay.forEach((c, i) => { if (kc(i) > 0) cx = c.x + c.w + 4; }); fr.rect(cx, y - 30, 4, 60, { fill: INK, a: .8 }); }
    if (nl) nl.forEach((c, i) => { const a0 = r.note.w0 + i * r.note.per, k = seg(t, a0, a0 + r.note.cd); if (k <= 0) return; fr.g({ clip: [c.x - 4, y - 40, (c.w + 8) * k, 100] }, () => fr.text(c.ch, c.x, y + 8, { font: 'serifm', size: r.note.size || 40, align: 'l', color: '#6B4A2E' })); });
    if (r.tick != null) { const tk = r.tick < 0 ? 1 : E.out2(seg(t, r.tick, r.tick + .3)); if (tk > 0) fr.poly(tpts, { color: TICK, w: 7, k: tk, a: A }); if (r.tick > 0) fr.glow(tx + 30, y - 6, 90, GOLD, .45 * bell(t, r.tick + .15, .8)); if (r.tg) fr.glow(tx + 34, y - 8, 120, GOLD, .7 * bell(t, r.tg, .9)); }
  };
  if (r.lift == null || t < r.lift) content();
  else {
    const k = seg(t, r.lift, r.lift + 1.1), pts = stripPts(1066, 1760, y - 44, y + 44, r.i * 9);
    fr.poly(pts, { fill: '#C7B48C', close: true }); fr.poly(pts, { color: '#A8946C', w: 2, close: true, a: .6 });
    fr.g({ at: [1413 + 90 * k, y - 520 * E.in2(k) - 30 * Math.sin(k * 3)], rot: -.22 * k, a: 1 - ss(k, .55, 1) }, () => fr.g({ at: [-1413, -y] }, () => { fr.poly(pts, { fill: '#F0E4C6', close: true }); content(); }));
  }
  const sk = band(r.slot);
  if (sk > 0) fr.rect(tx + 2, y - 40, 74, 76, { r: 10, color: '#B0623E', w: 3, dash: [9, 7], a: .85 * sk });
  const qk = band(r.q, .25);
  if (qk > 0) fr.text('？', tx + 40, y - 2, { font: 'serif', size: 70, color: RED, a: qk });
  const mk = band(r.maybe, .3);
  if (mk > 0) fr.text('可能做过了', RX, y + 78, { font: 'sansm', size: 36, track: 3, color: '#D8452E', align: 'l', a: mk });
  if (r.stamp) stampMark(fr, t, 1125, y - 2, r.stamp.s, r.stamp.c, r.stamp.t);
}
/* 笔尖的路线：一串操作（写一个字 / 画一个勾 / 停在某处），中间抬笔过去 */
function polyAt(pts, k) {
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let s = clamp(k) * tot; for (let i = 0; i < L.length; i++) { if (s <= L[i] || i === L.length - 1) { const u = L[i] ? Math.min(1, s / L[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; } s -= L[i]; }
  return pts[pts.length - 1];
}
const opAt = (o, k) => o.pts ? polyAt(o.pts, k) : o.p ? o.p : [lerp(o.x0, o.x1, k), o.y + 14 * Math.sin(k * 12)];
const arcP = (a, b, k) => { const h = Math.min(40, 8 + Math.hypot(b[0] - a[0], b[1] - a[1]) * .06); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - h * Math.sin(k * Math.PI)]; };
function penTip(t, ops, pen) {
  ops.sort((a, b) => a.t0 - b.t0);
  const r0 = pen.r0 || [1600, 700], r1 = pen.r1 || r0, l0 = pen.l0 || .6, l1 = pen.l1 || .6;
  if (!ops.length) return r0;
  const f = ops[0], l = ops[ops.length - 1];
  if (t < f.t0) return arcP(r0, opAt(f, 0), E.io3(seg(t, f.t0 - l0, f.t0)));
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i]; if (t >= o.t1) continue;
    if (t >= o.t0) return opAt(o, seg(t, o.t0, o.t1));
    const p = ops[i - 1], g = o.t0 - p.t1, k = seg(t, p.t1, o.t0);
    return arcP(opAt(p, 1), opAt(o, 0), g > .3 ? E.io3(k) : k);
  }
  return arcP(opAt(l, 1), r1, E.io3(seg(t, l.t1, l.t1 + l1)));
}
/* 手和笔：右手从右下角伸进来，拇指和食指捏着笔 */
function penHand(fr, tip) {
  const [px, py] = tip, th = .98, dx = Math.cos(th), dy = Math.sin(th), nx = dy, ny = -dx, at = (u, v) => [px + dx * u + nx * v, py + dy * u + ny * v];
  const s0 = at(205, 58), s1 = at(1100, 58);
  fr.line(s0[0], s0[1], s1[0], s1[1], { w: 146, color: SLEEVE, cap: 'butt' }); { const c0 = at(196, 58), c1 = at(226, 58); fr.line(c0[0], c0[1], c1[0], c1[1], { w: 152, color: '#CFC6B6', cap: 'butt' }); }
  const pc = at(150, 56); fr.ellipse(pc[0], pc[1], 92, 66, { fill: SKIN, rot: th });
  const tb0 = at(118, -18), tb1 = at(66, -26); fr.line(tb0[0], tb0[1], tb1[0], tb1[1], { w: 30, color: SKIN2 });
  const tl = at(250, 0); fr.line(px, py, tl[0], tl[1], { w: 13, color: '#2E2A33' });
  const nb = at(26, 0); fr.line(px, py, nb[0], nb[1], { w: 7, color: '#C9A25E' });
  const f0 = at(132, 36), f1 = at(56, 9); fr.line(f0[0], f0[1], f1[0], f1[1], { w: 28, color: SKIN }); fr.circle(f1[0], f1[1], 16, { fill: '#F0C29E' });
}
/* 整本账：o.z 推近、o.focus 推向哪、o.rows、o.left 左页、o.pen 笔、o.extra 额外画在页上的东西、o.L 灯光 */
function book(fr, t, o) {
  const z = o.z || 1, f = o.focus || [1060, 470];
  fr.rect(0, 0, W, H, { fill: '#3A2A20' });
  fr.g({ at: f, s: z }, () => fr.g({ at: [-f[0], -f[1]] }, () => {
    bookBase(fr, t, o);
    const ops = [], geo = {};
    (o.rows || []).forEach(r => bookRow(fr, t, r, ops, geo));
    if (o.extra) o.extra(fr, t, geo);
    if (o.pen) { (o.pen.ops || []).forEach(q => ops.push(q.pf ? Object.assign({}, q, { p: q.pf(geo) }) : q)); penHand(fr, penTip(t, ops, o.pen)); }
  }));
  if (o.L != null && o.L < 1) fr.rect(0, 0, W, H, { fill: '#050409', a: (1 - o.L) * .93 });
}

/* ---------- 镜头表 ---------- */
function shotA(fr, t) {                                   // 第 1–7 镜：同一间厨房，镜头从全景推到中景，停电后换近景
  const L = lampL(t), p = poseA(t);
  cam(fr, camA(t), () => kitchen(fr, t, { L, pose: p, pour: [5.95, 6.5], ghost: t > 12.9 && t < 15.9 ? [13.0, 13.9] : null }));
  if (L < 1) fr.rect(0, 0, W, H, { fill: '#050409', a: (1 - L) * .95 });
}
function shotB(fr, t) {                                   // 第 8 镜：隔壁的老厨子，灶边多一本账
  const k = seg(t, T.s8, T.s9), p = { old: true, hand: stirH(t), tool: 'ladle', rot: .1, brow: 0 };
  cam(fr, { cx: lerp(960, 900, k), cy: lerp(540, 520, k), s: lerp(1.0, 1.07, k) }, () => kitchen(fr, t, { old: true, pose: p, ledger: true, ledgerHi: ss(t, 29.3, 29.9) * (1 - ss(t, 31.0, 31.5)) }));
}
function screenFx(fr) {
  const x = fr.x, g = x.createRadialGradient(W / 2, 520, H * .55, W / 2, 520, W * .72); g.addColorStop(0, 'rgba(20,10,10,0)'); g.addColorStop(1, 'rgba(20,10,10,.5)'); fr.rect(0, 0, W, H, { fill: g });
  const b = x.createLinearGradient(0, 820, 0, H); b.addColorStop(0, 'rgba(18,12,20,0)'); b.addColorStop(.5, 'rgba(18,12,20,.72)'); b.addColorStop(1, 'rgba(18,12,20,.9)'); fr.rect(0, 820, W, 260, { fill: b });
}

/* ---------- 后半段的动作 ---------- */
const mv = (t, keys) => [K3(t, keys.map(k => [k[0], k[1]])), K3(t, keys.map(k => [k[0], k[2]]))];
/* 在小木架的账本上写一行：row 第几行，d 写多久（笔尖从左往右走） */
const writeH = (t, t0, row = 0, d = .8) => [700 + 44 * seg(t, t0, t0 + d) + 4 * Math.sin(t * 31), 587 + 18 * row + 3 * Math.sin(t * 43)];
/* 舀一勺盐倒进锅：和第 2 镜同一套动作，t0 起步，sp 快慢，h0 手从哪出发，r0 头原来的转向 */
function scoopMove(t, t0, sp, h0, r0) {
  const u = (t - t0) * sp, p = { tool: u < .65 ? 'none' : 'scoop' };
  p.hand = [K3(u, [[0, h0[0]], [.65, 902], [.9, 898], [1.3, 920], [1.95, 1005], [9, 1005]]), K3(u, [[0, h0[1]], [.65, 288], [.9, 300], [1.3, 250], [1.95, 405], [9, 405]])];
  p.phi = K3(u, [[.9, 2.11], [1.3, 1.3], [1.95, .08], [9, .08]]);
  p.theta = K3(u, [[2.0, 0], [2.3, 1.1], [2.55, 1.1], [2.95, 0], [9, 0]]);
  p.fill = u < .75 ? 0 : 1 - seg(u, 2.1, 2.6);
  p.inJar = u < 1.35;
  p.rot = K3(u, [[0, r0], [.45, -.16], [1.1, -.16], [1.65, .1], [9, .1]]);
  return p;
}
const pourAt = (t0, sp) => [t0 + 2.1 / sp, t0 + 2.65 / sp];
/* 灯：fl 闪一下的时刻，off 全黑，on 再亮 */
function lampFx(t, fl, off, on) {
  if (t >= off && t < on) return 0;
  if (t >= on) return ss(t, on, on + .08) * (t > on + .15 && t < on + .22 ? .35 : 1);
  return fl.some(f => Math.abs(t - f) < .045) ? .12 : 1;
}
/* 第 10 镜：写完，抬笔，去舀盐 */
function pose10(t) {
  if (t < 35.45) return { tool: 'pen', hand: [746 + 3 * Math.sin(t * 31), 587 - 12 * E.io3(seg(t, 35.2, 35.45))], rot: .2 };
  return scoopMove(t, 35.45, 1, [746, 575], .2);
}
/* 第 13 镜：新的一锅。写第二行，舀盐，正要回去打勾——灯灭了 */
function pose13(t) {
  if (t < 46.8) return { tool: 'pen', hand: writeH(t, 46.05, 1, .75), rot: .22 };
  const p = scoopMove(Math.min(t, 48.8), 46.8, 1.4, writeH(46.8, 46.05, 1, .75), .22);
  if (t > 48.8) { const k = E.io3(seg(t, 48.8, 49.5)); p.hand = [lerp(p.hand[0], 760, k), lerp(p.hand[1], 600, k)]; p.theta = lerp(p.theta, 0, k); p.phi = lerp(p.phi, .6, k); p.rot = lerp(p.rot, .22, k); }
  return p;
}
/* 第 15 镜：灯亮，他俯身指着账本 */
function pose15(t) { return { tool: 'none', hand: mv(t, [[50.6, 800, 520], [51.5, 748, 556], [52.3, 746, 574]]), rot: K3(t, [[50.6, .12], [51.4, .26]]), brow: .4 * ss(t, 50.8, 51.4) }; }
/* 第 18 镜：不放第二勺，先用小勺尝一口 */
function pose18(t) {
  const p = { tool: 'taste', hand: mv(t, [[60.6, 760, 560], [61.1, 990, 432], [61.35, 996, 446], [61.6, 990, 428], [62.0, 772, 388]]) };
  p.phi = K3(t, [[60.6, 1.0], [61.1, 1.25], [61.6, 1.05], [62.0, Math.PI + .45]]);
  p.sip = ss(t, 61.4, 61.5) * (1 - ss(t, 62.05, 62.25));
  p.rot = K3(t, [[60.6, .22], [61.0, .1], [61.9, -.04], [62.05, .02]]) + (t > 62.05 && t < 62.65 ? .07 * Math.sin((t - 62.05) / .3 * Math.PI) : 0);
  return p;
}
/* 第 20 镜：搅汤，搅完回去打勾 */
function pose20(t) {
  if (t < 69.8) return { tool: 'ladle', hand: stirH(t), rot: .1 };
  const h0 = stirH(69.8), y = 559 + 36;
  return { tool: t < 70.15 ? 'none' : 'pen', rel: 69.8, hand: mv(t, [[69.8, h0[0], h0[1]], [70.3, 748, y + 26], [70.42, 746, y + 24], [70.62, 762, y + 18], [71.0, 770, y + 22]]), rot: K3(t, [[69.8, .1], [70.2, .24]]) };
}
/* 电脑窗口里的厨子：搅着汤，收到“部署上线”，先记一笔再动手 */
function poseDesk(t) {
  if (t < 81.3) return { tool: 'ladle', hand: stirH(t), rot: .1 };
  if (t < 82.1) { const h0 = stirH(81.3), w = writeH(t, 81.6, 0, .5); return { tool: t < 81.5 ? 'none' : 'pen', rel: 81.3, hand: t < 81.6 ? mv(t, [[81.3, h0[0], h0[1]], [81.6, w[0], w[1]]]) : w, rot: K3(t, [[81.3, .1], [81.6, .22]]) }; }
  const p = scoopMove(t, 82.1, 1.1, writeH(82.1, 81.6, 0, .5), .22); p.rel = 81.3; return p;
}
/* 第 26 镜：窗口里正在舀盐（= 正在扣款），舀到一半，机器崩了 */
function poseDesk2(t) { const p = scoopMove(t, 86.0, 1.1, [746, 587], .2); p.rel = -99; return p; }
/* 第 37 镜：盛一碗汤 */
function pose37(t) {
  const p = { tool: 'serve', hand: mv(t, [[129.3, 1080, 362], [129.45, 1088, 352], [129.85, 905, 410]]), rot: K3(t, [[129.3, .08], [129.9, .18]]) };
  p.tilt = K3(t, [[129.9, 0], [130.2, 1.15], [130.8, 1.15], [131.1, .3]]);
  p.full = 1 - seg(t, 130.15, 130.8); p.stream = t > 130.15 && t < 130.8 ? Math.min(1, seg(t, 130.15, 130.25)) * (1 - seg(t, 130.65, 130.8)) : 0;
  return p;
}
/* 第 39 镜：年轻厨子，灯又灭了，再亮时手里一勺满满的盐 */
function pose39(t) {
  if (t < 139.3) return { tool: 'ladle', hand: stirH(t), rot: .12 };
  return { tool: 'scoop', hand: [995, 400], phi: .05, theta: 0, fill: 1, rel: 139.3, rot: K3(t, [[140.2, .06], [140.75, .27]]), brow: .6 * ss(t, 140.3, 140.8) };
}
/* 第 41 镜：看过账本，把满满一勺盐放回台面，笑了 */
function pose41(t) {
  const p = { rel: 139.3, rot: K3(t, [[144.0, .27], [144.6, .12], [145.6, .08]]), brow: .6 * (1 - ss(t, 144.1, 144.5)), smile: t > 144.45 };
  if (t < 145.25) { p.tool = 'scoop'; p.hand = mv(t, [[144.0, 995, 400], [144.5, 995, 400], [145.2, 800, 606]]); p.phi = K3(t, [[144.5, .05], [145.2, 0]]); p.theta = 0; p.fill = 1; }
  else { p.tool = 'none'; p.scoopDown = [800, 606]; p.hand = mv(t, [[145.25, 800, 606], [145.7, 790, 612]]); }
  return p;
}
/* 老厨子小木架上那一页：每一行写到哪、勾了没有 */
function rowsOld(t) {
  const R = (k, tk) => ({ k, tk, gold: k >= 1 });
  if (t < 42) return [R(1, 0)];
  if (t < 50.6) return [R(1, 1), R(seg(t, 46.05, 46.8), 0)];
  if (t < 67.6) return [R(1, 1), R(1, 0)];
  if (t < 74.6) return [R(1, 1), R(1, 1), R(1, seg(t, 70.42, 70.62))];
  return [R(1, 1), R(1, 1), R(1, 1)];
}

/* ---------- 后半段镜头 ---------- */
const darkOver = (fr, L) => { if (L < 1) fr.rect(0, 0, W, H, { fill: '#050409', a: (1 - L) * .96 }); };
const camK = (t, keys) => ({ cx: K3(t, keys.map(k => [k[0], k[1]])), cy: K3(t, keys.map(k => [k[0], k[2]])), s: K3(t, keys.map(k => [k[0], k[3]])) });
const oldK = (t, pose, more) => Object.assign({ old: true, pose, ledger: true, stand: { rows: rowsOld(t) } }, more || {});
const rowSalt0 = { i: 0, s: '要放盐', tick: -99, a: .5 };
const rowSalt1 = { i: 1, s: '要放盐', note: { s: '尝过，已放', w0: -99, per: .15, cd: .13 }, tick: -99 };
/* 第 9 镜：笔尖在新的一页写出“要放盐”，写完这一行微微发金 */
function shot9(fr, t) { book(fr, t, { z: lerp(1, 1.04, seg(t, T.s9, 35.2)), rows: [{ i: 0, s: '要放盐', w0: 32.2, per: .5, cd: .42, glow: 34.0 }], pen: { r0: [1500, 440], r1: [1560, 430], l0: .65, l1: .68 } }); }
/* 第 10 镜：写完，才去动盐勺 */
function shot10(fr, t) { cam(fr, camK(t, [[35.2, 900, 470, 1.3], [38.6, 915, 455, 1.36]]), () => kitchen(fr, t, oldK(t, pose10(t), { pour: pourAt(35.45, 1) }))); }
/* 第 11 镜：放完，在这一行后面打勾 */
function shot11(fr, t) { book(fr, t, { z: lerp(1.04, 1.1, E.io3(seg(t, 38.6, 42))), focus: [1300, 300], rows: [{ i: 0, s: '要放盐', tick: 39.55 }], pen: { r0: [1660, 900], r1: [1720, 900], l0: .6, l1: .8 } }); }
/* 第 12 镜：规矩卡 */
function ruleCard(fr, t, t0, title, lines, o = {}) {
  fr.rect(0, 0, W, H, { fill: fr.rgrad(960, 440, 80, 1150, [[0, '#2E2118'], [1, '#0C0705']]) });
  const k = E.out3(seg(t, t0, t0 + .55)), c = o.align === 'c';
  fr.g({ at: [960, 440 + 26 * (1 - k)], rot: -.017, a: k }, () => {
    fr.rect(-480, -214, 980, 460, { r: 14, fill: '#000', a: .4 });
    fr.rect(-490, -230, 980, 460, { r: 14, fill: '#D4CABA' });
    fr.rect(-468, -208, 936, 416, { r: 10, color: '#B8AB95', w: 2 });
    fr.text(title, 0, -152, { font: 'serif', size: 40, color: '#6B5846', track: 8 });
    fr.line(-70, -112, 70, -112, { w: 2, color: '#B8AB95' });
    const n = lines.length, gap = n === 3 ? 94 : 112, y0 = n === 3 ? -36 : -14;
    lines.forEach((s, i) => {
      const a0 = t0 + .55 + i * .65, a = ss(t, a0, a0 + .35), y = y0 + i * gap;
      const w = fr.text(s, c ? 0 : -400, y + 8 * (1 - a), { font: 'serifm', size: 58, color: '#3B2A1E', align: c ? 'c' : 'l', a });
      if (o.tick && i === n - 1) { const x = -400 + w + 26, tk = E.out2(seg(t, o.tick, o.tick + .3)); if (tk > 0) fr.poly([[x, y - 4], [x + 16, y + 16], [x + 52, y - 28]], { color: TICK, w: 8, k: tk }); fr.glow(x + 26, y - 6, 100, GOLD, .5 * bell(t, o.tick + .1, .9)); }
    });
  });
}
function card12(fr, t) { ruleCard(fr, t, 42.0, '老厨子的规矩', ['① 先记一笔：要做什么', '② 再动手', '③ 做完，打个勾'], { tick: 44.3 }); }
function card38(fr, t) { ruleCard(fr, t, 131.2, '账本的规矩', ['记下来的，才算数', '没记下的，当它没发生'], { align: 'c' }); }
/* 第 13 镜：再来一锅。写一行、放盐，正要回去打勾——停电 */
function shot13(fr, t) {
  const L = lampFx(t, [48.62, 48.78], 48.95, 50.6);
  cam(fr, camK(t, [[46.0, 900, 470, 1.3], [48.9, 920, 455, 1.36]]), () => kitchen(fr, t, oldK(t, pose13(t), { pour: pourAt(46.8, 1.4), L })));
  darkOver(fr, L);
}
/* 第 15 镜：灯亮。不靠回忆，先看账 */
function shot15(fr, t) {
  const L = lampFx(t, [], 0, 50.6);
  cam(fr, camK(t, [[50.6, 880, 470, 1.35], [52.6, 700, 500, 2.1], [54, 690, 505, 2.16]]), () => kitchen(fr, t, oldK(t, pose15(t), { L, stand: { rows: rowsOld(t), hiRow: 1, hiA: ss(t, 52.1, 52.5) } })));
  darkOver(fr, L);
}
/* 第 16 镜：有“要放盐”，却没有勾 */
function shot16(fr, t) { book(fr, t, { z: lerp(1, 1.1, E.io3(seg(t, 54, 60.6))), focus: [1350, 330], rows: [rowSalt0, { i: 1, s: '要放盐', hi: [54.5, 60.8], slot: [54.7, 58.0], q: [57.9, 99], maybe: [58.3, 99] }] }); }
/* 第 18 镜：先尝一口 */
function shot18(fr, t) { cam(fr, camK(t, [[60.6, 840, 430, 1.75], [62.7, 830, 420, 1.8]]), () => kitchen(fr, t, oldK(t, pose18(t)))); }
/* 第 18b 镜：在这一行后面补上“尝过，已放”，打勾 */
function shot18b(fr, t) { book(fr, t, { z: 1.1, focus: [1350, 330], rows: [rowSalt0, { i: 1, s: '要放盐', note: { s: '尝过，已放', w0: 62.85, per: .15, cd: .13 }, tick: 63.62, slot: [54, 62.95], q: [54, 62.95], maybe: [54, 62.95] }], pen: { r0: [1480, 330], r1: [1720, 560], l0: .14, l1: .5 } }); }
/* 第 19 镜：要是这一行写的是“搅一搅”呢 */
function shot19(fr, t) { book(fr, t, { z: lerp(1.04, 1.08, seg(t, 64.3, 67.6)), focus: [1300, 360], rows: [rowSalt0, rowSalt1, { i: 2, s: '要搅一搅', w0: 64.9, per: .38, cd: .32, glow: 66.5 }], pen: { r0: [1720, 600], r1: [1680, 760], l0: .5, l1: .7 } }); }
/* 第 20 镜：多搅一次也无妨 */
function shot20(fr, t) { cam(fr, camK(t, [[67.6, 900, 470, 1.3], [71.2, 880, 480, 1.4]]), () => kitchen(fr, t, oldK(t, pose20(t)))); }
/* 第 21 镜：能不能重做，盖在每行的开头 */
function shot21(fr, t) {
  book(fr, t, { z: lerp(1, 1.05, seg(t, 71.2, 74.6)), focus: [1150, 330], rows: [
    { i: 0, s: '要放盐', tick: -99, stamp: { s: '别重做', c: 'red', t: 72.0 } },
    Object.assign({}, rowSalt1, { stamp: { s: '别重做', c: 'red', t: 72.15 } }),
    { i: 2, s: '要搅一搅', tick: -99, stamp: { s: '可重做', c: 'gold', t: 73.2 } }] });
}
/* 第 25 镜：智能体的账本（示意） */
function tagShiyi(fr) { fr.rect(1726, 40, 150, 52, { r: 26, fill: '#14100C', a: .8 }); fr.text('示意', 1801, 67, { font: 'sansm', size: 26, track: 4, color: '#D8CFBF' }); }
function shot25(fr, t) {
  book(fr, t, { z: 1.02, focus: [1200, 360], left: ['读需求', '打开服务器', '备份旧版'], rows: [
    { i: 0, s: '扣款 88 元', w0: 84.15, per: .08, pen: false, cursor: 1, glow: 84.55, stamp: { s: '别重做', c: 'red', t: 84.75 } },
    { i: 1, s: '发确认邮件', w0: 84.95, per: .08, pen: false, cursor: 1, glow: 85.35, stamp: { s: '别重做', c: 'red', t: 85.55 } },
    { i: 2, s: '查资料', w0: 85.75, per: .08, pen: false, cursor: 1, glow: 86.1, stamp: { s: '可重做', c: 'gold', t: 86.35 } }] });
  tagShiyi(fr);
}
/* 第 30 镜：一行字，要么整行写完，要么整行撕掉 */
function shot30(fr, t) {
  const L = (Math.abs(t - 104.9) < .05 || Math.abs(t - 105.06) < .05) ? .2 : 1;
  book(fr, t, { L, z: lerp(1.02, 1.07, seg(t, 102, 109.3)), focus: [1300, 380], left: ['收王家面一袋', '付柴钱三文'], rows: [
    { i: 0, s: '切葱两把', tick: -99 },
    { i: 1, s: '灶里添柴', w0: 102.45, per: .3, glow: 103.7 },
    { i: 2, s: '收李家米两石', w0: 103.95, per: .28, cut: 3, lift: 105.9 }],
    pen: { r0: [1720, 640], r1: [1900, 1080], l0: .45, l1: .6, ops: [{ t0: 104.76, t1: 105.1, pf: g => [g[2].tEnd, rowY(2) + 6] }] } });
}
/* 第 33 镜：账上一查，7 号已经记过了 */
function ticket(fr, x, y, s, a, rot = 0) {
  fr.g({ at: [x, y], s, rot, a }, () => {
    fr.rect(-52, -38, 110, 82, { r: 4, fill: '#000', a: .25 });
    fr.rect(-55, -41, 110, 82, { r: 4, fill: '#FBF6EA' }); fr.rect(-55, -41, 110, 8, { r: 2, fill: '#D8452E' });
    fr.text('7 号', 0, -10, { font: 'sansh', size: 26, color: '#3B2A1E' }); fr.text('鸡汤一碗', 0, 22, { font: 'sansm', size: 19, color: '#5A4636' });
  });
}
function shot33(fr, t) {
  book(fr, t, { z: 1.04, focus: [1300, 400], left: ['3 号 · 蒸鱼', '4 号 · 炒青菜', '5 号 · 豆腐汤'], rows: [
    { i: 0, s: '6 号 · 红烧肉', size: 54, tick: -99, a: .6 },
    { i: 1, s: '7 号 · 鸡汤一碗', size: 54, tick: -99, hi: [113.6, 116.5], pulse: 113.7 }],
    extra: (fr, t) => {
      const kin = E.out3(seg(t, 113.9, 114.3)), kout = E.in2(seg(t, 115.5, 116.2)); if (kin <= 0) return;
      const x = lerp(2250, 1470, kin) + 700 * kout, y = 600 + 60 * kout;
      ticket(fr, x, y, 2.5, 1 - kout, -.05 + .2 * kout);
      if (t >= 114.7) fr.g({ at: [x, y], rot: -.05 + .2 * kout, a: 1 - kout, s: 1.5 }, () => stampMark(fr, t, 44, 62, '已记过', 'gold', 114.7));
      fr.text('又来一张：', x - 160, y - 6, { font: 'sansm', size: 34, color: '#6B4A2E', align: 'r', a: kin * (1 - ss(t, 115.3, 115.6)) });
    } });
}
/* 第 34 镜：锅里还是一锅汤 */
function shot34(fr, t) {
  const gk = .5 * (1 - ss(t, 117.6, 119.2));
  cam(fr, camK(t, [[116.6, 1150, 480, 1.12], [120.3, 1120, 485, 1.16]]), () => {
    kitchen(fr, t, oldK(t, { tool: 'ladle', hand: stirH(t), rot: .1 }, { ghostPot: gk }));
    if (gk > 0) fr.text('第二锅？', 1480, 360, { font: 'sansh', size: 40, color: '#F0705A', a: gk * 1.6, shadow: .6 });
  });
}
/* 第 35 镜：一锅老汤熬四步。停电后，从最后一个勾往下接着做 */
function shot35(fr, t) {
  const L = Math.abs(t - 124.32) < .05 ? .2 : (t >= 124.5 && t < 125.3) ? 0 : t >= 125.3 ? ss(t, 125.3, 125.4) : 1;
  book(fr, t, { L, z: lerp(1, 1.06, seg(t, 120.3, 129.3)), focus: [1300, 420], left: ['备骨头', '备姜葱', '烧开水'], rows: [
    { i: 0, s: '一 焯水', textPen: false, tick: 121.45 },
    { i: 1, s: '二 下料', textPen: false, tick: 122.35, tg: 125.55 },
    { i: 2, s: '三 小火慢炖', textPen: false, tick: 127.7, hi: [125.9, 128.3] },
    { i: 3, s: '四 收汁', textPen: false, tick: 128.6 }],
    pen: { r0: [1700, 700], r1: [1720, 760], l0: .6, l1: .6, ops: [{ t0: 122.9, t1: 125.35, p: [1600, 600] }, { t0: 125.6, t1: 125.9, pf: g => g[1].tick }, { t0: 126.15, t1: 127.3, pf: g => [RX - 8, rowY(2) + 26] }] } });
}
/* 第 37 镜：盛一碗汤 */
function shot37b(fr, t) { cam(fr, camK(t, [[129.3, 900, 470, 1.45], [131.2, 890, 480, 1.5]]), () => kitchen(fr, t, oldK(t, pose37(t), { bowl: { x: 885, fill: seg(t, 130.25, 130.8), glow: ss(t, 130.7, 131.0) } }))); }
/* 第 39–41 镜：年轻厨子也有了账本 */
const youngK = (t, pose, more) => Object.assign({ pose, ledger: true, stand: { rows: [{ k: 1, tk: 1, gold: 1 }] } }, more || {});
function shot39(fr, t) {
  const L = lampFx(t, [139.05, 139.18], 139.3, 140.2);
  cam(fr, camK(t, [[135, 960, 540, 1.0], [138.6, 900, 480, 1.25], [140.4, 900, 480, 1.25], [141.3, 800, 480, 1.65], [142.2, 790, 482, 1.68]]), () => kitchen(fr, t, youngK(t, pose39(t), { L, stand: { rows: [{ k: 1, tk: 1, gold: 1 }], hiRow: 0, hiA: ss(t, 141.0, 141.4) } })));
  darkOver(fr, L);
}
function shot41a(fr, t) { book(fr, t, { z: lerp(1.04, 1.1, seg(t, 142.2, 144)), focus: [1300, 300], left: ['要洗菜', '要切葱', '要烧水'], rows: [{ i: 0, s: '要放盐', tick: -99, hi: [142.4, 144.3], pulse: 142.55, tg: 142.7 }] }); }
function shot41b(fr, t) { cam(fr, camK(t, [[144, 880, 455, 1.6], [149.5, 850, 500, 1.78]]), () => kitchen(fr, t, youngK(t, pose41(t)))); }

/* ---------- 第 22–24、26 镜：拉远——这间厨房，原来在一台电脑的窗口里 ---------- */
const KW = [862, 222, 540, 304];
function bubble(fr, t, m, i) {
  const k = m.t < 0 ? 1 : E.out3(seg(t, m.t, m.t + .25)); if (k <= 0) return;
  const y = 256 + i * 54, w = fr.measure(m.s, { font: 'sansm', size: 19 }) + 28, u = m.w === 'u', x = u ? 824 - w : 526;
  fr.g({ at: [x + w / 2, y], s: lerp(.85, 1, k), a: k }, () => {
    fr.rect(-w / 2, -20, w, 40, { r: 14, fill: u ? '#4F7BB5' : '#FFFFFF' });
    fr.text(m.s, 0, 1, { font: 'sansm', size: 19, color: u ? '#FFFFFF' : '#3B2A1E' });
  });
}
function chatPanel(fr, t, msgs) {
  fr.rect(510, 192, 330, 476, { r: 10, fill: '#ECE7DE' });
  fr.rect(510, 192, 330, 40, { r: 10, fill: '#DCD3C4' }); fr.rect(510, 222, 330, 10, { fill: '#DCD3C4' });
  fr.circle(534, 212, 9, { fill: '#7FA07A' }); fr.text('AI 助手', 552, 212, { font: 'sansm', size: 19, color: '#3B2A1E', align: 'l' });
  msgs.forEach((m, i) => bubble(fr, t, m, i));
  fr.rect(526, 618, 298, 36, { r: 18, fill: '#FFFFFF' }); fr.text('输入消息…', 544, 636, { font: 'sansr', size: 16, color: '#A89F90', align: 'l' });
}
function kitchenWin(fr, t, title, draw) {
  fr.rect(852, 192, 560, 340, { r: 10, fill: '#2A2530' });
  [872, 892, 912].forEach((x, i) => fr.circle(x, 207, 6, { fill: ['#E8705A', '#E8B44A', '#7FB07A'][i] }));
  fr.text(title, 1132, 207, { font: 'sansm', size: 16, track: 2, color: '#D8CFBF' });
  fr.g({ clip: KW }, () => fr.g({ at: [KW[0], KW[1]], s: KW[2] / W }, draw));
}
/* 桌前：墙、窗外夜景、书架、桌子、显示器、键盘、杯子。screen(fr) 画屏幕里的东西；glowA 屏幕亮度 */
function deskWorld(fr, t, screen, glowA = 1) {
  fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, '#1C1822'], [1, '#2A2230']]) });
  fr.rect(1530, 130, 320, 400, { r: 10, fill: '#151A2A' }); fr.rect(1546, 146, 288, 368, { fill: fr.grad(0, 146, 0, 514, [[0, '#121A33'], [1, '#2B3556']]) });
  for (let i = 0; i < 14; i++) fr.circle(1560 + hash(i * 5.3) * 260, 330 + hash(i * 2.9) * 170, 6 + hash(i) * 10, { fill: ['#F4C77A', '#E8705A', '#9FC4F0'][i % 3], a: .25 + .2 * Math.sin(t * .8 + i) });
  fr.rect(1686, 146, 8, 368, { fill: '#151A2A' }); fr.rect(1546, 320, 288, 8, { fill: '#151A2A' });
  fr.rect(60, 300, 330, 14, { r: 3, fill: '#4A3426' });
  [['#7A5236', 40], ['#4F7BB5', 34], ['#C9573A', 44], ['#7FA07A', 30], ['#D8C9A8', 38], ['#6B4026', 42]].forEach(([c, w], i, a) => { const x = 80 + a.slice(0, i).reduce((s, q) => s + q[1] + 6, 0); fr.rect(x, 300 - 90 - (i % 2) * 12, w, 90 + (i % 2) * 12, { r: 3, fill: c }); });
  fr.glow(960, 430, 900, '#8FB0FF', .1 * glowA);
  fr.rect(0, 772, W, 308, { fill: '#2A160A' }); fr.rect(0, 772, W, 10, { fill: '#3A2212' });
  fr.glow(960, 790, 640, '#8FB0FF', .1 * glowA);
  fr.rect(916, 716, 88, 50, { fill: '#18151A' }); fr.ellipse(960, 772, 150, 16, { fill: '#1E1A20' });
  fr.rect(470, 150, 980, 570, { r: 22, fill: '#0E0D11' }); fr.circle(960, 708, 4, { fill: glowA > .5 ? '#7FB07A' : '#3A3A3A' });
  fr.g({ clip: [490, 170, 940, 529] }, () => screen(fr));
  fr.rect(684, 802, 552, 44, { r: 8, fill: '#1B1B20' });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 16; c++) fr.rect(698 + c * 33.5, 808 + r * 12.5, 28, 9, { r: 2, fill: '#2C2C33' });
  fr.ellipse(1330, 826, 30, 18, { fill: '#1B1B20' });
  fr.rect(1290, 690, 60, 80, { r: 8, fill: '#C9573A' }); fr.ellipse(1320, 690, 30, 7, { fill: '#8A3A24' }); fr.path('M 1350,706 q 26,4 22,26 q -4,18 -22,16', { color: '#C9573A', w: 8 });
}
const wallpaper = fr => fr.rect(490, 170, 940, 529, { fill: fr.grad(0, 170, 0, 699, [[0, '#2A3A56'], [1, '#1A2233']]) });
const taskbar = fr => { fr.rect(490, 670, 940, 29, { fill: '#11141C', a: .92 }); [520, 552, 584, 616].forEach((x, i) => fr.rect(x - 10, 675, 20, 19, { r: 4, fill: ['#4F7BB5', '#7FA07A', '#E8B44A', '#C9573A'][i], a: .8 })); fr.text('23:47', 1400, 685, { font: 'mono', size: 15, color: '#C8D0E0', align: 'r' }); };
const MSG0 = [{ w: 'a', s: '有什么要我做的？', t: -1 }];
function deskCam(t) {
  const s0 = W / KW[2], c0 = [KW[0] + KW[2] / 2, KW[1] + KW[3] / 2];
  if (t < 76.8) { const k = E.io3(seg(t, 74.6, 76.8)), s = Math.exp(lerp(Math.log(s0), 0, k)), w = (1 / s - 1 / s0) / (1 - 1 / s0); return { cx: lerp(c0[0], 960, w), cy: lerp(c0[1], 540, w), s }; }
  const d = seg(t, 76.8, 80.0), k = E.io3(seg(t, 80.0, 80.8)), q = seg(t, 80.8, 83.8);
  return { cx: lerp(960, 965, k), cy: lerp(540 - 10 * d, 432, k) - 4 * q, s: lerp(1 + .04 * d, 1.86, k) + .03 * q };
}
function deskShot(fr, t) {
  const msgs = MSG0.concat([{ w: 'u', s: '帮我把网站部署上线', t: 80.9 }, { w: 'a', s: '好的，这就开始', t: 81.9 }]);
  cam(fr, deskCam(t), () => deskWorld(fr, t, fr => {
    wallpaper(fr); chatPanel(fr, t, msgs);
    kitchenWin(fr, t, '智能体 · 正在工作', () => kitchen(fr, t, oldK(t, poseDesk(t), { stand: { rows: [{ k: seg(t, 81.6, 82.1), tk: 0, gold: t > 82.1 }] }, pour: pourAt(82.1, 1.1) })));
    taskbar(fr);
  }));
}
/* 第 26 镜：正在扣款——崩了——重启 */
function deskShot2(fr, t) {
  const on = t < 88.0, boot = t >= 88.65, done = t >= 90.45;
  const msgs = MSG0.concat([{ w: 'u', s: '帮我把网站部署上线', t: -1 }, { w: 'a', s: '好的，这就开始', t: -1 }, { w: 'a', s: '正在扣款 88 元…', t: 87.7 }]);
  cam(fr, { cx: 965, cy: 432, s: 1.9 + .02 * seg(t, 87.4, 91) }, () => deskWorld(fr, t, fr => {
    if (on) {
      wallpaper(fr); chatPanel(fr, t, msgs);
      kitchenWin(fr, t, '智能体 · 正在工作', () => kitchen(fr, t, oldK(t, poseDesk2(t), { stand: { rows: [{ k: 1, tk: 0, gold: 1 }] }, pour: pourAt(86.0, 1.1) })));
      taskbar(fr);
      if (t > 87.9) for (let i = 0; i < 7; i++) fr.rect(490, 170 + hash(i + Math.floor(t * 60)) * 529, 940, 6 + hash(i * 3) * 26, { fill: ['#FC593F', '#9FD4F0', '#FFFFFF'][i % 3], a: .5 });
      return;
    }
    fr.rect(490, 170, 940, 529, { fill: '#050507' });
    if (!boot) return;
    if (!done) {
      const k = seg(t, 88.8, 90.4), a = ss(t, 88.65, 88.85);
      fr.circle(960, 360, 34, { color: '#C8D0E0', w: 4, a }); fr.line(960, 316, 960, 352, { w: 4, color: '#C8D0E0', a });
      fr.text('正在重启…', 960, 440, { font: 'sansm', size: 26, track: 3, color: '#C8D0E0', a });
      fr.rect(800, 486, 320, 8, { r: 4, fill: '#2A2F3A', a }); fr.rect(800, 486, 320 * k, 8, { r: 4, fill: '#9FB8FF', a });
      return;
    }
    wallpaper(fr); chatPanel(fr, t, MSG0); taskbar(fr);
    const k = E.out3(seg(t, 90.45, 90.7)); fr.rect(1110, 300, 260, 64, { r: 12, fill: '#14100C', a: .9 * k }); fr.text('重启完成', 1240, 332, { font: 'sansm', size: 22, color: '#F3EBDA', a: k });
  }, on || done ? 1 : boot ? .25 : 0));
}
/* 第 27 镜：没有账本 / 有账本，并排。同一台收款机，崩溃重启以后各扣了几次 */
function receipt(fr, x, yb, h, red, a = 1, rot = 0) {
  if (h <= 0) return;
  fr.g({ at: [x, yb], rot, a }, () => {
    fr.rect(-46, -h, 92, h, { fill: red ? '#FFE1D8' : '#FBF8F1' });
    fr.text('¥88', 0, -h + 26, { font: 'latinm', size: 26, color: red ? '#C9381F' : '#3B2A1E' });
    for (let j = 0; j < 3; j++) if (-h + 52 + j * 18 < -8) fr.line(-30, -h + 52 + j * 18, 30, -h + 52 + j * 18, { w: 3, color: red ? '#E8A090' : '#CFC6B6' });
  });
}
function splitShot(fr, t) {
  const lt = t - 91.0, crash = lt > 1.15 && lt < 1.4;
  fr.rect(0, 0, W, H, { fill: '#0C0705' });
  [0, 1].forEach(side => {
    const px = side * 960, has = side === 1, cx = px + 480;
    fr.g({ clip: [px, 0, 960, H] }, () => {
      fr.rect(px, 0, 960, H, { fill: fr.grad(0, 0, 0, H, [[0, has ? '#3A2E26' : '#2A2533'], [1, has ? '#4A3A2C' : '#3A3244']]) });
      fr.glow(px + 520, 430, 520, '#FFB870', .12);
      fr.g({ at: [px + 300, 700], s: .62 }, () => fr.g({ at: [-640, -640] }, () => chefBody(fr, t, { old: has, rot: .06, brow: !has && lt > 1.9 ? .6 * ss(lt, 1.9, 2.3) : 0 })));
      fr.rect(px, 636, 960, 40, { fill: '#A87A50' }); fr.rect(px, 668, 960, 8, { fill: '#8C6240' }); fr.rect(px, 676, 960, 404, { fill: '#6E4A30' });
      /* 收款机 */
      const mx = px + 660;
      fr.rect(mx - 70, 470, 140, 166, { r: 16, fill: '#2E3440' }); fr.rect(mx - 54, 486, 108, 56, { r: 6, fill: '#9FD4B0' });
      fr.text('¥88', mx, 514, { font: 'latinm', size: 30, color: '#1F3A2A' });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) fr.rect(mx - 42 + c * 30, 558 + r * 22, 22, 14, { r: 3, fill: '#4A5262' });
      /* 小票：第一张出来，挪到一边；没账本的那边，重启后又出来一张红的 */
      const k1 = E.out3(seg(lt, .3, .8)), mvk = E.io3(seg(lt, .9, 1.3));
      receipt(fr, lerp(mx, px + 500, mvk), lerp(468, 400, mvk), 132 * k1, false, 1, -.12 * mvk);
      fr.rect(mx - 54, 462, 108, 10, { r: 4, fill: '#151820' });
      if (!has) { const k2 = E.out3(seg(lt, 1.65, 2.15)); receipt(fr, mx, 468, 132 * k2, true); if (k2 > 0) fr.glow(mx, 400, 160, '#FC593F', .35 * bell(lt, 1.8, 1.0)); fr.rect(mx - 54, 462, 108, 10, { r: 4, fill: '#151820' }); }
      else {
        /* 有账本：小账本放在收款机旁边；扣款前先记一笔，重启后一查就停手 */
        const bx = px + 860, gl = ss(lt, 1.65, 1.95);
        if (gl > 0) fr.glow(bx, 590, 170, GOLD, .45 * gl);
        fr.path(`M ${bx - 66},590 L ${bx},600 L ${bx + 66},590 L ${bx + 66},640 L ${bx},648 L ${bx - 66},640 Z`, { fill: '#6B4026' });
        fr.path(`M ${bx - 60},592 L ${bx - 2},601 L ${bx - 2},642 L ${bx - 60},636 Z`, { fill: '#E8D9B5' }); fr.path(`M ${bx + 2},601 L ${bx + 60},592 L ${bx + 60},636 L ${bx + 2},642 Z`, { fill: '#F0E4C6' });
        const wk = seg(lt, .15, .35); if (wk > 0) fr.line(bx + 10, 612, bx + 10 + 32 * wk, 609, { w: 3, color: '#9A6A26' });
        const tk = seg(lt, .85, 1.0); if (tk > 0) fr.poly([[bx + 46, 609], [bx + 50, 614], [bx + 58, 604]], { color: '#CFA55E', w: 3, k: tk });
        fr.text('记过了，不再扣', px + 790, 420, { font: 'sansm', size: 30, color: GOLD, a: gl, shadow: .6 });
      }
      fr.text(has ? '有账本' : '没有账本', cx, 110, { font: 'sansh', size: 50, track: 4, color: has ? GOLD : '#E9DFC8', shadow: .6 });
      const n = has ? (lt > .8 ? 1 : 0) : lt > 2.15 ? 2 : lt > .8 ? 1 : 0, pop = 1 + .25 * bell(lt, has ? .8 : n === 2 ? 2.15 : .8, .35);
      fr.text('扣了', cx - 70, 770, { font: 'sansm', size: 40, color: '#F3EBDA', align: 'r', shadow: .6 });
      fr.g({ at: [cx, 760], s: pop }, () => fr.text(String(n), 0, 0, { font: 'latinm', size: 90, color: !has && n === 2 ? RED : '#F3EBDA', shadow: .6 }));
      fr.text('次', cx + 70, 770, { font: 'sansm', size: 40, color: '#F3EBDA', align: 'l', shadow: .6 });
    });
  });
  fr.rect(956, 0, 8, H, { fill: '#0C0705' });
  if (crash) { fr.rect(0, 0, W, H, { fill: '#050409', a: (Math.floor(lt * 40) % 2) ? .9 : .6 }); }
  const ck = bell(lt, 1.1, .65); if (ck > 0) fr.text('崩溃 · 重启', 960, 300, { font: 'sansh', size: 60, track: 6, color: RED, a: Math.min(1, ck * 1.6), shadow: .8 });
}
/* 第 28 镜：这本账，叫 pi-durable */
function nameCard(fr, t) {
  const lt = t - 94.6;
  fr.rect(0, 0, W, H, { fill: fr.rgrad(960, 420, 60, 1150, [[0, '#2A1C13'], [1, '#0C0705']]) });
  fr.glow(960, 400, 520, GOLD, .12 * ss(lt, .3, 1.2));
  fr.chars('pi-durable', 960, 390, { font: 'latinm', size: 168, track: 4, color: GOLD, grad: [[0, '#FCE7C2'], [1, '#CFA55E']], glow: 18, glowA: .3 }, i => { const k = seg(lt, .2 + i * .06, .7 + i * .06); return { a: smooth(k), dy: (1 - E.out3(k)) * 26 }; });
  const kl = E.io3(seg(lt, .9, 1.6)); fr.line(960 - 380 * kl, 512, 960 + 380 * kl, 512, { w: 2, color: '#CFA55E', a: .8 });
  fr.text('开源的 AI 智能体运行底座 · Earendil · 2026', 960, 580, { font: 'sansm', size: 36, track: 4, color: '#E9DFC8', a: ss(lt, 1.3, 1.8) });
}
/* 第 29 镜：账本只有一支笔，谁要记，排队拿笔 */
const hBob = (t, x) => Math.sin(t * 1.8 + x * .01) * 1.5;
function helperBody(fr, t, x, col, walk) {
  const y = 640 + hBob(t, x) - (walk ? Math.abs(Math.sin(walk * 7)) * 8 : 0), blink = ((t + x * .003) % 3.1) < .12 ? .15 : 1;
  fr.g({ at: [x, y] }, () => {
    fr.ellipse(-4, -40, 86, 140, { fill: JACKET });
    fr.path('M -50,-140 Q -96,-110 -92,-20 L -88,80 L -14,80 Z', { fill: col, a: .85 });
    fr.rect(-20, -206, 30, 30, { fill: SKIN2 });
    fr.path('M -4,-184 L -66,-180 L -34,-150 Z', { fill: col });
    fr.circle(-6, -250, 56, { fill: SKIN });
    fr.ellipse(30, -246, 11, 16, { fill: SKIN2 });
    fr.ellipse(-34, -258, 6, 6 * blink, { fill: '#2A1E1A' });
    fr.ellipse(-62, -240, 10, 9, { fill: SKIN2 });
    fr.circle(-30, -224, 11, { fill: '#E58E77', a: .4 }); fr.line(-50, -222, -38, -220, { w: 4, color: '#9C5A4A' });
    fr.rect(-58, -318, 104, 26, { r: 5, fill: HAT }); fr.rect(-58, -298, 104, 6, { fill: '#DDD6CA' });
    fr.rect(-54, -350, 96, 36, { fill: HAT }); fr.circle(-34, -352, 28, { fill: HAT }); fr.circle(-4, -368, 34, { fill: HAT }); fr.circle(26, -352, 27, { fill: HAT });
  });
  return y;
}
function helperArm(fr, x, y, hand, pen) {
  const sh = [x - 24, y - 168], q = ik(-sh[0], sh[1], -hand[0], hand[1], 118, 118), ex = -q[0], ey = q[1], hx = -q[2], hy = q[3];
  fr.line(sh[0], sh[1], ex, ey, { w: 36, color: SLEEVE }); fr.line(ex, ey, hx, hy, { w: 30, color: SLEEVE });
  fr.circle(hx, hy, 17, { fill: SKIN });
  if (pen) penSmall(fr, [hx, hy]);
}
const HELPERS = [['切菜', '#7FA07A'], ['看火', '#C9573A'], ['跑堂', '#4F7BB5']];
function helpersShot(fr, t) {
  const lt = t - 98.4, sh = E.io3(seg(lt, 1.5, 2.4)), out = seg(lt, 1.3, 2.2);
  const rows = [{ k: 1, tk: 1, gold: 1 }, { k: 1, tk: 1, gold: 1 }, { k: seg(lt, .35, 1.1), gold: lt > 1.1 }, { k: seg(lt, 2.75, 3.4), gold: lt > 3.4 }];
  const penBy = lt > .2 && lt < 1.3 ? 0 : lt > 2.55 ? 1 : -1;
  cam(fr, { cx: 1000 - 10 * seg(lt, 0, 3.6), cy: 430, s: 1.32 + .03 * seg(lt, 0, 3.6) }, () => {
    room(fr, t, 1); lamp(fr, 1);
    const xs = [lerp(860, 560, E.in2(out)), lerp(1110, 860, sh), lerp(1360, 1110, sh)], as = [1 - ss(out, .4, 1), 1, 1];
    const ys = [];
    HELPERS.forEach((h, i) => { const d = () => { ys[i] = helperBody(fr, t, xs[i], h[1], i === 0 ? out * 3 : sh * 2); helperArm(fr, xs[i], ys[i], [xs[i] - 34, ys[i] - 26], false); }; if (as[i] >= 1) d(); else if (as[i] > 0) fr.layer({ a: as[i] }, d); else ys[i] = 640; });
    counter(fr);
    ledgerStand(fr, t, 0, { rows, noPen: penBy >= 0 });
    if (penBy >= 0) {
      const i = penBy, t0 = i ? 2.75 : .35, d = i ? .65 : .75, x = xs[i], rest = [x - 34, ys[i] - 26];
      const w = [700 + 44 * seg(lt, t0, t0 + d) + 4 * Math.sin(t * 31), 587 + 18 * (2 + i) + 3 * Math.sin(t * 43)];
      const k = E.io3(seg(lt, t0 - .3, t0)) * (i ? 1 : 1 - E.io3(seg(lt, 1.12, 1.3)));
      helperArm(fr, x, ys[i], [lerp(rest[0], w[0], k), lerp(rest[1], w[1], k)], k > .5);
    }
    if (penBy < 0 && lt > 1.3 && lt < 2.55) fr.glow(745, 646, 90, GOLD, .5 * bell(lt, 1.35, 1.2));
    HELPERS.forEach((h, i) => { if (as[i] <= 0) return; fr.rect(xs[i] - 50, 690, 100, 46, { r: 8, fill: '#E8D9B5', a: as[i] }); fr.text(h[0], xs[i], 714, { font: 'sansm', size: 28, color: '#5A4636', a: as[i] }); });
  });
}
/* 第 32 镜：传菜口。客人等急了，跑堂把同一张单又递了一次 */
function customer(fr, t, x, y, angry) {
  fr.ellipse(x, y - 30, 70, 90, { fill: '#6E8FB0' });
  fr.circle(x + 6, y - 150, 46, { fill: SKIN }); fr.ellipse(x - 28, y - 150, 9, 13, { fill: SKIN2 });
  fr.path(`M ${x - 34},${y - 176} Q ${x + 6},${y - 214} ${x + 50},${y - 172} Q ${x + 30},${y - 190} ${x - 34},${y - 176} Z`, { fill: '#3A2A22' });
  fr.ellipse(x + 28, y - 154, 5, 5, { fill: '#2A1E1A' }); fr.line(x + 18, y - 172 + 4 * angry, x + 38, y - 166 - 2 * angry, { w: 4, color: '#3A2A22' });
  fr.ellipse(x + 50, y - 140, 8, 7, { fill: SKIN2 });
}
function passShot(fr, t) {
  const lt = t - 109.3;
  cam(fr, { cx: 960, cy: 440 - 8 * seg(lt, 0, 3.7), s: 1.4 + .08 * seg(lt, 0, 3.7) }, () => {
    fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, 640, [[0, '#2A2331'], [1, '#3D3342']]) });
    fr.g({ clip: [600, 230, 720, 380] }, () => {
      fr.rect(600, 230, 720, 380, { fill: fr.grad(0, 230, 0, 610, [[0, '#7A4A30'], [1, '#A8683E']]) });
      fr.glow(800, 320, 420, '#FFC27A', .35);
      [700, 1220].forEach(x => { fr.line(x, 230, x, 266, { w: 3, color: '#3A2216' }); fr.ellipse(x, 296, 26, 32, { fill: '#D8452E' }); fr.rect(x - 14, 324, 28, 8, { fill: '#8A3A24' }); fr.glow(x, 296, 80, '#FF9A5A', .4); });
      const ang = ss(lt, 1.1, 1.3);
      customer(fr, t + (ang > 0 && lt < 2 ? Math.sin(lt * 50) * .02 : 0), 740 + (lt > 1.1 && lt < 1.6 ? 3 * Math.sin(lt * 60) : 0), 560, ang);
      fr.rect(620, 520, 260, 14, { r: 3, fill: '#5C3C26' }); fr.rect(640, 534, 12, 80, { fill: '#5C3C26' }); fr.rect(850, 534, 12, 80, { fill: '#5C3C26' });
      fr.path('M 690,520 q 10,-26 40,-26 q 30,0 40,26 Z', { fill: '#F1EEE8' });
      helperBody(fr, t, 1120, '#4F7BB5', 0);
    });
    fr.rect(0, 446, 600, 184, { fill: '#4B3F4D' }); fr.rect(1320, 446, 600, 184, { fill: '#4B3F4D' });
    for (let x = 0; x < W; x += 58) if (x < 600 || x > 1320) fr.rect(x, 446, 2, 184, { fill: '#3E3340', a: .8 });
    fr.rect(586, 216, 748, 14, { r: 3, fill: '#5C3C26' }); fr.rect(586, 216, 14, 400, { fill: '#5C3C26' }); fr.rect(1320, 216, 14, 400, { fill: '#5C3C26' });
    fr.rect(880, 150, 160, 56, { r: 8, fill: '#6B4026' }); fr.text('传菜', 960, 179, { font: 'serif', size: 34, color: '#F0E4C6', track: 8 });
    fr.rect(570, 606, 780, 22, { r: 4, fill: '#A87A50' }); fr.rect(570, 628, 780, 8, { fill: '#8C6240' });
    fr.rect(0, 636, W, 444, { fill: '#2E2630' });
    /* 两张一模一样的单子 */
    const rest = [1090, 600], h1 = [[.2, 1090, 600], [.7, 905, 590], [.9, 905, 590], [1.3, 1090, 600]], h2 = [[1.6, 1090, 600], [2.15, 1035, 590], [2.4, 1035, 590], [2.9, 1090, 600]];
    const keys = lt < 1.45 ? h1 : h2, hand = mv(lt, keys.map(k => [k[0], k[1], k[2]]));
    const placed1 = lt >= .8, placed2 = lt >= 2.3;
    if (placed1) ticket(fr, 880, 572, 1, 1);
    if (placed2) ticket(fr, 1010, 572, 1, 1, .04);
    const y = 640 + hBob(t, 1120);
    helperArm(fr, 1120, y, hand, false);
    if (!placed1 && lt > .2) ticket(fr, hand[0] - 25, hand[1] - 20, 1, 1);
    if (lt > 1.6 && !placed2) ticket(fr, hand[0] - 25, hand[1] - 20, 1, 1, .04);
    const bk = ss(lt, 1.1, 1.3); if (bk > 0) { fr.g({ at: [700, 330], s: lerp(.7, 1, E.out3(bk)), a: bk }, () => { fr.rect(-80, -36, 160, 72, { r: 20, fill: '#FFFFFF' }); fr.path('M 20,34 L 46,62 L 46,34 Z', { fill: '#FFFFFF' }); fr.text('快点！', 0, 0, { font: 'sansh', size: 36, color: '#C9381F' }); }); }
    const lk = ss(lt, 2.6, 2.9); if (lk > 0) { fr.line(880, 520, 1010, 520, { w: 3, color: '#F3EBDA', a: lk, dash: [8, 7] }); fr.text('同一张单', 945, 490, { font: 'sansm', size: 28, color: '#F3EBDA', a: lk, shadow: .6 }); }
  });
}
/* 尾卡 */
function endCard(fr, t) {
  const lt = t - 149.6;
  fr.rect(0, 0, W, H, { fill: fr.rgrad(960, 380, 60, 1150, [[0, '#2A1C13'], [1, '#0C0705']]) });
  fr.glow(960, 330, 460, GOLD, .12 * ss(lt, .3, 1.2));
  fr.chars('先记一笔', 960, 320, { font: 'serifh', size: 104, track: 14, color: GOLD, grad: [[0, '#FCE7C2'], [1, '#CFA55E']], glow: 16, glowA: .3 }, i => { const k = seg(lt, .3 + i * .12, .8 + i * .12); return { a: smooth(k), dy: (1 - E.out3(k)) * 18 }; });
  fr.text('断电也不丢的 AI，靠的是一本账', 960, 440, { font: 'sansm', size: 38, track: 4, color: '#E9DFC8', a: ss(lt, 1.2, 1.7) });
  const ra = ss(lt, 2.0, 2.6); fr.line(760, 560, 1160, 560, { w: 1.5, color: '#6E5F47', a: ra });
  ['1. Earendil，《pi-durable》，官方博客，2026 年 10 月 1 日', '2. pi-durable v1.4.0 官方说明与源码（earendil-works/pi 仓库，MIT 许可）', '3. 本片的厨房、账本、咸淡表均为示意'].forEach((s, i) => fr.text(s, 960, 616 + i * 46, { font: 'sansr', size: 26, color: '#A89F90', a: ra }));
}

/* ---------- 镜头表：[起, 止, 画法, 淡入, 淡出, 是否加暗角] ---------- */
const SHOTS = [
  [T.s9, 35.2, shot9, .22, .22], [35.2, 38.6, shot10, .22, 0], [38.6, 42.0, shot11, 0, .3], [42.0, 45.6, card12, .3, .4, false],
  [46.0, 50.6, shot13, .4, 0], [50.6, 54.0, shot15, 0, 0], [54.0, 60.6, shot16, 0, 0], [60.6, 62.7, shot18, 0, 0], [62.7, 64.3, shot18b, 0, 0],
  [64.3, 67.6, shot19, 0, .25], [67.6, 71.2, shot20, .25, 0], [71.2, 74.6, shot21, 0, .25], [74.6, 83.8, deskShot, .2, 0], [83.8, 87.4, shot25, 0, 0],
  [87.4, 91.0, deskShot2, 0, .2], [91.0, 94.6, splitShot, .2, .3], [94.6, 98.4, nameCard, .3, .4, false], [98.4, 102.0, helpersShot, .35, 0],
  [102.0, 109.3, shot30, 0, .25], [109.3, 113.0, passShot, .25, 0], [113.0, 116.6, shot33, 0, 0], [116.6, 120.3, shot34, 0, 0], [120.3, 129.3, shot35, 0, 0],
  [129.3, 131.2, shot37b, 0, .3], [131.2, 134.9, card38, .3, .4, false], [135.0, 142.2, shot39, .5, 0], [142.2, 144.0, shot41a, 0, 0], [144.0, 149.5, shot41b, 0, .5],
  [149.6, 156.0, endCard, .5, .9, false],
];
const SFX = [
  [.3, 'chord', { root: 0, gain: .6 }], [4.55, 'tick', { pitch: 1, gain: .35 }], [5.95, 'shimmer', { gain: 1.1 }],
  [7.0, 'tick', { pitch: 4, gain: .5 }], [7.26, 'tick', { pitch: 4, gain: .5 }], [7.49, 'tick', { pitch: 4, gain: .5 }],
  [T.dark, 'thud', { gain: .9 }], [8.05, 'hush', { dur: .7 }], [T.on, 'soft', { gain: .8 }], [13.6, 'tock', { pitch: -3, gain: .9 }], [19.0, 'hush', { dur: 2.5 }],
  [T.t0, 'bloom', { root: 0, gain: .8 }], [28.3, 'chord', { root: 0, gain: .55 }],
  [32.2, 'tick', { pitch: 2, gain: .45 }], [32.7, 'tick', { pitch: 3, gain: .45 }], [33.2, 'tick', { pitch: 4, gain: .45 }], [34.0, 'chord', { root: -5, gain: .65 }],
  [36.05, 'tick', { pitch: 1, gain: .35 }], [37.55, 'shimmer', { gain: 1.1 }], [39.85, 'tick', { pitch: 6, gain: .6 }], [42.1, 'soft', { gain: .7 }], [44.4, 'tick', { pitch: 6, gain: .5 }],
  [46.1, 'tick', { pitch: 2, gain: .4 }], [47.25, 'tick', { pitch: 1, gain: .35 }], [48.3, 'shimmer', { gain: 1.0 }], [48.62, 'tick', { pitch: 4, gain: .5 }], [48.78, 'tick', { pitch: 4, gain: .5 }],
  [48.95, 'thud', { gain: .9 }], [49.1, 'hush', { dur: 1.5 }], [50.6, 'soft', { gain: .8 }], [52.3, 'soft', { gain: .5 }], [57.9, 'tock', { pitch: -3, gain: .9 }],
  [61.85, 'soft', { gain: .6 }], [63.8, 'tick', { pitch: 6, gain: .6 }], [64.5, 'hush', { dur: 2.6 }], [68.2, 'soft', { gain: .5 }], [69.0, 'soft', { gain: .5 }], [70.6, 'tick', { pitch: 6, gain: .6 }],
  [72.0, 'stamp', { gain: .8 }], [72.15, 'stamp', { gain: .6 }], [73.2, 'stamp', { gain: .8 }], [74.7, 'rise', { dur: 2.0 }], [76.8, 'thud', { gain: .6 }],
  [81.0, 'tick', { pitch: 3, gain: .45 }], [82.0, 'tick', { pitch: 1, gain: .4 }], [84.75, 'stamp', { gain: .6 }], [85.55, 'stamp', { gain: .6 }], [86.35, 'stamp', { gain: .6 }],
  [88.0, 'thud', { gain: .9 }], [88.65, 'soft', { gain: .6 }], [90.45, 'tick', { pitch: 4, gain: .5 }],
  [91.8, 'tick', { pitch: 3, gain: .5 }], [92.35, 'thud', { gain: .7 }], [92.85, 'tock', { pitch: -3, gain: .9 }], [92.9, 'soft', { gain: .5 }], [94.9, 'bloom', { root: 0, gain: .8 }],
  [99.7, 'tick', { pitch: 2, gain: .45 }], [100.9, 'tick', { pitch: 3, gain: .45 }], [103.7, 'soft', { gain: .6 }], [104.9, 'tick', { pitch: 4, gain: .5 }], [105.95, 'rise', { dur: .6 }],
  [110.1, 'tick', { pitch: 2, gain: .45 }], [111.6, 'tick', { pitch: 2, gain: .45 }], [113.75, 'soft', { gain: .6 }], [114.7, 'stamp', { gain: .8 }],
  [121.45, 'tick', { pitch: 5, gain: .55 }], [122.35, 'tick', { pitch: 6, gain: .55 }], [124.5, 'thud', { gain: .85 }], [125.3, 'soft', { gain: .7 }], [127.7, 'tick', { pitch: 6, gain: .55 }], [128.6, 'tick', { pitch: 7, gain: .55 }],
  [130.4, 'chord', { root: 0, gain: .6 }], [131.5, 'soft', { gain: .6 }], [135.4, 'chord', { root: 0, gain: .55 }], [139.3, 'thud', { gain: .85 }], [139.4, 'hush', { dur: .8 }], [140.2, 'soft', { gain: .8 }],
  [142.6, 'chord', { root: 0, gain: .7 }], [146.2, 'chord', { root: -5, gain: .6 }], [149.8, 'bloom', { root: 0, gain: .6 }],
];

VK.film({
  dur: T.end, theme: 'flat', meta: { title: '先记一笔', root: 0 },
  draw(fr, t) {
    fr.look.bgo = { color: '#0C0705' };
    const endA = 1 - ss(t, T.tdip - .55, T.tdip), inB = ss(t, T.s8, T.s8 + .5);
    if (t < T.tdip) fr.layer({ a: Math.min(ss(t, 0, .6), endA) }, () => { shotA(fr, t); screenFx(fr); });
    else if (t >= T.s8 && t < T.s9) fr.layer({ a: Math.min(inB, 1 - ss(t, T.s9 - .22, T.s9)) }, () => { shotB(fr, t); screenFx(fr); });
    for (const s of SHOTS) if (t >= s[0] && t < s[1]) fr.layer({ a: Math.min(s[3] ? ss(t, s[0], s[0] + s[3]) : 1, s[4] ? 1 - ss(t, s[1] - s[4], s[1]) : 1) }, () => { s[2](fr, t); if (s[5] !== false) screenFx(fr); });
    if (t >= T.tdip - .1 && t < T.s8 + .1) K.titleGilt(fr, t - T.t0, { la: '', zh: '先记一笔', tag: '断电也不丢的 AI，靠的是一本账', cy: 430, tagDy: 330, motif: motifBook, a: Math.min(ss(t, T.t0 - .3, T.t0 + .2), 1 - ss(t, T.tout, T.s8)) });
    /* 咸淡表：量的是锅里真有多少盐。停电时也一直亮着（锅记得）；片名、规矩卡、电脑那一段退场 */
    if (t < T.tdip) {
      const gv = t < 15.6 ? lerp(1, 2, E.io3(seg(t, 12.9, 13.9))) : lerp(2, 0, E.io3(seg(t, 15.9, 16.8)));
      saltMeter(fr, { a: Math.min(ss(t, 4.2, 4.7), endA), v: lerp(0, 1, E.io3(seg(t, 6.05, 6.6))), ghost: gv, ghostA: (t < 15.6 ? ss(t, 12.9, 13.2) : 1) * (1 - ss(t, 18.6, 19.2)), ghostLabel: t < 15.75 ? (t > 13.4 ? '如果再放：2 勺' : '') : (t > 16.4 ? '如果没放过：0 勺' : '') });
    } else if (t >= T.s9 && t < 42) saltMeter(fr, { a: Math.min(ss(t, 32.0, 32.5), 1 - ss(t, 41.6, 42)), v: E.io3(seg(t, 37.65, 38.2)) });
    else if (t >= 46 && t < 74.8) saltMeter(fr, { a: Math.min(ss(t, 46, 46.4), 1 - ss(t, 74.4, 74.8)), v: E.io3(seg(t, 48.4, 48.9)) });
    else if (t >= 135 && t < 149.5) saltMeter(fr, { a: Math.min(ss(t, 135.2, 135.7), 1 - ss(t, 148.9, 149.5)), v: 1 });
    for (const s of SFX) fr.sfx(s[0], s[1], s[2]);
    K.subs(fr, t, SUBS, 'flat');
  },
});
})();

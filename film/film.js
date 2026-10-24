/* 《先记一笔》· B 寓言 · 开头 35.2 秒（第 1–9 镜 + 片名）。分镜表见同目录 storyboard.md，事实与出处见 facts.md。
 * 论点：AI 智能体扛得住断电，靠的不是更聪明，而是一本账——每件事先记一笔，再动手；重启以后，只信账上写了的。
 * 这一段只讲一件事：停电以后，人不记得自己做到哪了，锅却记得（左上角咸淡表一直量着锅里真实的盐）。
 * 示意：厨房、厨子、咸淡表都是画的比喻；“一勺盐 = 一件做两次就坏事的操作（扣款、发邮件、部署）”在后半段才揭开。
 * 颜色：金 = 记下的、算数的；红 = 做过头的、危险的。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit;

const T = { s2: 3.8, s3: 6.9, dark: 7.8, on: 8.8, s5: 12.3, s6: 15.6, s7: 18.9, tdip: 21.6, t0: 22.15, tout: 27.6, s8: 28.2, s9: 31.5, end: 35.2 };
const SUBS = [
  { a: .4,   b: 3.4,  zh: '深夜，灶上熬着一锅汤' },
  { a: 3.9,  b: 6.7,  zh: '厨子舀起一勺盐，倒进锅里' },
  { a: 9.1,  b: 12.0, zh: '灯再亮起，他忘了刚才那一勺' },
  { a: 12.4, b: 15.4, zh: '再放一勺，可能就{!太咸}了' },
  { a: 15.8, b: 18.6, zh: '不放，又可能根本没放过' },
  { a: 19.1, b: 21.3, zh: '到底放没放？', big: 1 },
  { a: 28.6, b: 31.3, zh: '隔壁的老厨子，灶边多一本{账}' },
  { a: 31.7, b: 34.8, zh: '放盐之前，他先写一行：要放盐' },
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
function stoveAndPot(fr, t) {
  fr.rect(POT_X - 130, 612, 260, 16, { r: 4, fill: '#26252B' });
  for (let i = 0; i < 7; i++) { const x = POT_X - 102 + i * 34, h = 16 + 5 * Math.sin(t * 9 + i * 1.7); fr.ellipse(x, 612 - h * .45, 8, h * .55, { fill: '#5FA8E8', a: .9 }); fr.ellipse(x, 612 - h * .3, 4, h * .3, { fill: '#F3B04A' }); }
  fr.rect(POT_X - 180, 498, 34, 14, { r: 6, fill: '#34353C' }); fr.rect(POT_X + 146, 498, 34, 14, { r: 6, fill: '#34353C' });
  fr.path(`M ${POT_X - 150},${SOUP_Y - 4} L ${POT_X + 150},${SOUP_Y - 4} L ${POT_X + 142},592 Q ${POT_X + 138},608 ${POT_X + 120},608 L ${POT_X - 120},608 Q ${POT_X - 138},608 ${POT_X - 142},592 Z`, { fill: '#45464E' });
  fr.rect(POT_X - 128, 500, 14, 92, { r: 7, fill: '#5C5E68' });
  fr.ellipse(POT_X, SOUP_Y - 4, 156, 24, { fill: '#5A5C66' });
  fr.ellipse(POT_X, SOUP_Y - 2, 140, 17, { fill: '#C98E3E' }); fr.ellipse(POT_X - 10, SOUP_Y - 4, 96, 10, { fill: '#DDA757' });
}
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
      if (!o.old) { fr.circle(40, -290, 14, { fill: '#E58E77', a: .45 }); if (br > .5) fr.path('M 48,-268 q 5,-6 10,0 q 5,6 10,0', { color: '#9C5A4A', w: 4 }); else fr.line(52, -270, 66, -272, { w: 4, color: '#9C5A4A' }); }
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
/* 账本立在台面上的小木架里（老厨子那间厨房才有） */
function ledgerStand(fr, t, hi) {
  fr.path('M 560,640 L 600,532 L 612,536 L 576,640 Z', { fill: '#5C3C26' }); fr.rect(520, 628, 260, 14, { r: 4, fill: '#7A5236' });
  if (hi > 0) fr.glow(650, 580, 230, GOLD, .32 * hi);
  fr.path('M 536,528 L 650,540 L 764,528 L 768,632 L 650,640 L 532,632 Z', { fill: '#6B4026' });
  fr.path('M 544,532 L 648,544 L 648,630 L 542,622 Z', { fill: '#E8D9B5' }); fr.path('M 652,544 L 756,532 L 758,622 L 652,630 Z', { fill: '#F0E4C6' });
  for (let i = 0; i < 4; i++) { const y = 556 + i * 18; fr.line(556, y + i * .3, 638, y + 9, { w: 2, color: '#B9A47E', a: .8 }); fr.line(662, y + 9, 746, y, { w: 2, color: '#B9A47E', a: .8 }); }
  for (let i = 0; i < 3; i++) { const y = 551 + i * 18; fr.line(560, y, 610, y + 5, { w: 3, color: '#6B5846', a: .7 }); fr.path(`M 616,${y + 3} l 6,6 l 10,-12`, { color: '#CFA55E', w: 3 }); }
  fr.line(690, 650, 790, 646, { w: 7, color: '#2E2A33' }); fr.line(786, 646, 800, 645, { w: 4, color: '#C9A25E' });
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
    p.tool = t < 4.5 ? 'none' : 'scoop';
    return p;
  }
  p.hand = [K3(t, [[15.8, 995], [16.5, 968]]), K3(t, [[15.8, 400], [16.5, 392]])];
  p.phi = K3(t, [[15.8, .05], [16.5, -.12]]);
  p.theta = K3(t, [[12.7, 0], [13.2, .38], [15.7, .38], [16.3, -.08]]);
  p.fill = 1; p.tool = 'scoop';
  return p;
}
/* 灯：第 7 秒闪两下，7.8 秒全黑，8.8 秒再亮 */
function lampL(t) {
  if (t < 6.95 || t > 9.2) return 1;
  if (t >= T.dark && t < T.on) return 0;
  if (t >= T.on) return ss(t, T.on, T.on + .08) * (t > 8.95 && t < 9.02 ? .35 : 1);
  return (Math.abs(t - 7.04) < .045 || Math.abs(t - 7.3) < .06 || Math.abs(t - 7.52) < .035) ? .12 : 1;
}

function kitchen(fr, t, o) {
  const L = o.L == null ? 1 : o.L, p = o.pose;
  room(fr, t, L); lamp(fr, L);
  const sc = !o.old && (p.tool === 'none' || p.tool === 'ladle');                                  // 勺还插在盐罐里
  const inJar = p.tool === 'scoop' && t < 5.2 && (p.hand[1] + Math.sin(p.phi) * 66) > 326;
  if (sc) scoop(fr, 902, 288, 2.11, 0, 0);
  if (inJar) scoop(fr, p.hand[0], p.hand[1], p.phi, p.theta || 0, p.fill);
  saltJar(fr);
  chefBody(fr, t, { old: o.old, rot: p.rot, brow: p.brow });
  counter(fr); stoveAndPot(fr, t);
  /* 搅汤的长勺：在手里，或者松手后斜靠在锅沿上 */
  if (p.tool !== 'ladle') { const k = E.io3(seg(t, 3.85, 4.35)), h0 = stirH(3.85), top = [lerp(h0[0], 1214, k), lerp(h0[1], 392, k)], bot = [lerp(h0[0] + 64, 1150, k), SOUP_Y + 2]; if (!o.old) fr.line(top[0], top[1], bot[0], bot[1], { w: 11, color: '#B98A55' }); }
  if (o.ledger) ledgerStand(fr, t, o.ledgerHi || 0);
  steam(fr, t, L > .5 ? 1 : .3);
  if (p.tool === 'ladle') { const h = p.hand; fr.line(h[0], h[1], h[0] + 64, SOUP_Y + 2, { w: 11, color: '#B98A55' }); fr.ellipse(h[0] + 64, SOUP_Y + 1, 18, 4, { color: '#F3D9A6', w: 2, a: .7 }); }
  let lip = null;
  if (p.tool === 'scoop' && !inJar) lip = scoop(fr, p.hand[0], p.hand[1], p.phi, p.theta || 0, p.fill);
  chefArm(fr, p.hand);
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

/* ---------- 第 9 镜：账本特写。笔尖在新的一页写出“要放盐”，写完这一行微微发金 ---------- */
function ledgerClose(fr, t) {
  const z = lerp(1, 1.04, seg(t, T.s9, T.end));
  fr.rect(0, 0, W, H, { fill: '#3A2A20' });
  fr.g({ at: [1060, 470], s: z }, () => fr.g({ at: [-1060, -470], rot: 0 }, () => {
    fr.rect(410 + 14, 132 + 18, 1300, 680, { r: 20, fill: '#000', a: .35 });
    fr.rect(410, 130, 1300, 680, { r: 20, fill: '#6B4026' });
    fr.rect(434, 150, 616, 640, { r: 6, fill: fr.grad(434, 0, 1050, 0, [[0, '#E8D9B5'], [.85, '#E4D3AC'], [1, '#C9B48C']]) });
    fr.rect(1070, 150, 616, 640, { r: 6, fill: fr.grad(1070, 0, 1686, 0, [[0, '#CDB990'], [.12, '#EFE3C4'], [1, '#F2E7CB']]) });
    fr.rect(1050, 150, 20, 640, { fill: '#5C3620' });
    for (let k = 0; k < 6; k++) { const y = 262 + k * 90; fr.line(470, y, 1020, y, { w: 2, color: '#BFA982' }); fr.line(1100, y, 1650, y, { w: 2, color: '#BFA982' }); }
    ['要洗菜', '要切葱', '要烧水', '要下骨头'].forEach((s, i) => {
      const y = 224 + i * 90, w = fr.text(s, 490, y, { font: 'serifm', size: 46, color: '#5A4636', align: 'l', a: .55 });
      fr.poly([[510 + w, y - 2], [522 + w, y + 12], [546 + w, y - 16]], { color: '#CFA55E', w: 5, a: .8 });
    });
    /* 新的一行 */
    const y = 222, X0 = 1120, lay = fr.layout('要放盐', X0, { font: 'serifm', size: 70, align: 'l', track: 6 }), done = ss(t, 34.0, 34.5);
    if (done > 0) { fr.glow(X0 + lay.w / 2, y, 300, GOLD, .32 * done); fr.line(1100, 262, lerp(1100, 1650, done), 262, { w: 4, color: '#D9B15F' }); }
    let tip = [1560, 420];
    lay.forEach((c, i) => {
      const a0 = 32.2 + i * .5, k = seg(t, a0, a0 + .42); if (k <= 0) return;
      fr.g({ clip: [c.x - 4, y - 60, (c.w + 8) * k, 120] }, () => fr.text(c.ch, c.x, y, { font: 'serifm', size: 70, color: mix('#3B2A1E', '#8A5A1E', done), align: 'l' }));
      if (k < 1) tip = [c.x + c.w * k, y + 14 * Math.sin(k * 12)];
    });
    if (t < 32.2) tip = [lerp(1500, X0, E.io3(seg(t, T.s9, 32.15))), lerp(440, y, E.io3(seg(t, T.s9, 32.15)))];
    else if (t >= 33.62) { const k = E.io3(seg(t, 33.62, 34.3)), last = lay[lay.length - 1]; tip = [lerp(last.x + last.w, 1560, k), lerp(y, 420, k)]; }
    else if (!lay.some((c, i) => { const a0 = 32.2 + i * .5; return t >= a0 && t < a0 + .42; })) { const i = Math.min(lay.length - 1, Math.floor((t - 32.2) / .5) + 1), c = lay[i], prev = lay[i - 1], k = seg(t, 32.2 + (i - 1) * .5 + .42, 32.2 + i * .5); tip = [lerp(prev.x + prev.w, c.x, k), y - 10 * Math.sin(k * Math.PI)]; }
    /* 手和笔：右手从右下角伸进来，拇指和食指捏着笔 */
    const [px, py] = tip, th = .98, dx = Math.cos(th), dy = Math.sin(th), nx = dy, ny = -dx, at = (u, v) => [px + dx * u + nx * v, py + dy * u + ny * v];
    const s0 = at(205, 58), s1 = at(1100, 58);
    fr.line(s0[0], s0[1], s1[0], s1[1], { w: 146, color: SLEEVE, cap: 'butt' }); { const c0 = at(196, 58), c1 = at(226, 58); fr.line(c0[0], c0[1], c1[0], c1[1], { w: 152, color: '#CFC6B6', cap: 'butt' }); }
    const pc = at(150, 56); fr.ellipse(pc[0], pc[1], 92, 66, { fill: SKIN, rot: th });
    const tb0 = at(118, -18), tb1 = at(66, -26); fr.line(tb0[0], tb0[1], tb1[0], tb1[1], { w: 30, color: SKIN2 });
    const tl = at(250, 0); fr.line(px, py, tl[0], tl[1], { w: 13, color: '#2E2A33' });
    const nb = at(26, 0); fr.line(px, py, nb[0], nb[1], { w: 7, color: '#C9A25E' });
    const f0 = at(132, 36), f1 = at(56, 9); fr.line(f0[0], f0[1], f1[0], f1[1], { w: 28, color: SKIN }); fr.circle(f1[0], f1[1], 16, { fill: '#F0C29E' });
  }));
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

VK.film({
  dur: T.end, theme: 'flat', meta: { title: '先记一笔', root: 0 },
  draw(fr, t) {
    fr.look.bgo = { color: '#0C0705' };
    const endA = 1 - ss(t, T.tdip - .55, T.tdip), inB = ss(t, T.s8, T.s8 + .5), out = 1 - ss(t, T.end - .4, T.end);
    if (t < T.tdip) fr.layer({ a: Math.min(ss(t, 0, .6), endA) }, () => { shotA(fr, t); screenFx(fr); });
    else if (t >= T.s8 && t < T.s9) fr.layer({ a: Math.min(inB, 1 - ss(t, T.s9 - .22, T.s9)) }, () => { shotB(fr, t); screenFx(fr); });
    else if (t >= T.s9) fr.layer({ a: Math.min(ss(t, T.s9, T.s9 + .22), out) }, () => { ledgerClose(fr, t); screenFx(fr); });
    if (t >= T.tdip - .1 && t < T.s8 + .1) K.titleGilt(fr, t - T.t0, { la: '', zh: '先记一笔', tag: '断电也不丢的 AI，靠的是一本账', cy: 430, tagDy: 330, motif: motifBook, a: Math.min(ss(t, T.t0 - .3, T.t0 + .2), 1 - ss(t, T.tout, T.s8)) });
    /* 咸淡表：第 2 镜亮起，停电时也一直亮着（锅记得）；片名时退场；老厨子那边从 0 勺开始 */
    if (t < T.tdip) {
      const gv = t < 15.6 ? lerp(1, 2, E.io3(seg(t, 12.9, 13.9))) : lerp(2, 0, E.io3(seg(t, 15.9, 16.8)));
      saltMeter(fr, { a: Math.min(ss(t, 4.2, 4.7), endA), v: lerp(0, 1, E.io3(seg(t, 6.05, 6.6))), ghost: gv, ghostA: (t < 15.6 ? ss(t, 12.9, 13.2) : 1) * (1 - ss(t, 18.6, 19.2)), ghostLabel: t < 15.75 ? (t > 13.4 ? '如果再放：2 勺' : '') : (t > 16.4 ? '如果没放过：0 勺' : '') });
    } else if (t >= T.s9) saltMeter(fr, { a: Math.min(ss(t, 32.0, 32.5), out), v: 0 });
    /* 声音 */
    fr.sfx(.3, 'chord', { root: 0, gain: .6 });
    fr.sfx(4.55, 'tick', { pitch: 1, gain: .35 }); fr.sfx(5.95, 'shimmer', { gain: 1.1 });
    [7.0, 7.26, 7.49].forEach(s => fr.sfx(s, 'tick', { pitch: 4, gain: .5 }));
    fr.sfx(T.dark, 'thud', { gain: .9 }); fr.sfx(8.05, 'hush', { dur: .7 });
    fr.sfx(T.on, 'soft', { gain: .8 });
    fr.sfx(13.6, 'tock', { pitch: -3, gain: .9 });
    fr.sfx(19.0, 'hush', { dur: 2.5 });
    fr.sfx(T.t0, 'bloom', { root: 0, gain: .8 });
    fr.sfx(28.3, 'chord', { root: 0, gain: .55 });
    [32.2, 32.7, 33.2].forEach((s, i) => fr.sfx(s, 'tick', { pitch: 2 + i, gain: .45 }));
    fr.sfx(34.0, 'chord', { root: -5, gain: .65 });
    K.subs(fr, t, SUBS, 'flat');
  },
});
})();

// pi-durable 中文教程 · 交互模拟器
// 这些都是“玩具模型”，只模拟课文讲的那一条规则，不是 pi-durable 的真实实现。
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const uid = () => Math.random().toString(36).slice(2, 8);

function setup(el, title, hint, body) {
  el.className = "sim-card";
  el.innerHTML = `<h4>🕹️ ${title}</h4><div class="sim-hint">${hint}</div>${body}<div class="sim-log" data-k="log"></div>`;
  const q = (k) => el.querySelector(`[data-k="${k}"]`);
  const logEl = q("log");
  const log = (msg, cls = "") => {
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = msg;
    logEl.append(line);
    logEl.scrollTop = logEl.scrollHeight;
  };
  log.clear = () => { logEl.innerHTML = ""; };
  return { q, log };
}

/* ───────────────────────── 01 原子提交 ───────────────────────── */
function simCommit(el) {
  const id = uid();
  const { q, log } = setup(el, "原子提交：一支笔，一次落盘",
    "一句用户消息要写三样东西：记录条目、生成任务、提交单。选一种写法和停电时机，点“提交”，再点“来电，重启检查”，看看账本还对不对得上。",
    `<div class="sim-controls">
      <label><input type="radio" name="cm-${id}" value="each"> 逐条写（每写一项就落盘）</label>
      <label><input type="radio" name="cm-${id}" value="atomic" checked> 原子提交（pi-durable 的做法）</label>
      <select data-k="crash"><option value="0">不停电</option><option value="1" selected>写完第 1 项后停电</option><option value="2">写完第 2 项后停电</option></select>
    </div>
    <div class="sim-controls">
      <button data-k="go">✍️ 提交「你好」</button>
      <button data-k="check" class="secondary">🔌 来电，重启检查</button>
      <button data-k="race" class="secondary">👥 张三、李四同时提交</button>
      <button data-k="reset" class="ghost">🧹 清空</button>
    </div>
    <div class="sim-grid">
      <div class="sim-panel"><b>✒️ 笔在谁手里（会话 = 唯一写入线）</b><div data-k="pen">没人拿笔</div></div>
      <div class="sim-panel draft"><b>📝 内存里的草稿（还没落盘，停电就没了）</b><ul data-k="draft"></ul></div>
      <div class="sim-panel store"><b>📒 磁盘上的账本（停电也还在）</b><ul data-k="disk"></ul></div>
    </div>`);
  let disk = [], draft = [], n = 0, commitNo = 0, busy = false, penQueue = Promise.resolve();
  const mode = () => el.querySelector(`input[name="cm-${id}"]:checked`).value;
  const render = () => {
    q("draft").innerHTML = draft.map((d) => `<li>${esc(d.text)}</li>`).join("") || "<li style='list-style:none;color:#aaa'>（空）</li>";
    q("disk").innerHTML = disk.map((d) => `<li>${d.commit ? `<span class="pill">提交 #${d.commit}</span> ` : ""}${esc(d.text)}</li>`).join("") || "<li style='list-style:none;color:#aaa'>（空）</li>";
  };
  const itemsFor = (who, k) => [
    { k, type: "rec", text: `记录条目 pi.user「${who}：你好」` },
    { k, type: "task", text: `任务 生成任务-${k}：等待调度` },
    { k, type: "sub", text: `提交单 s-${k}：等回答` },
  ];
  async function writeAll(who, crashAfter, m) {
    const k = ++n;
    const items = itemsFor(who, k);
    for (let i = 0; i < items.length; i++) {
      await sleep(450);
      if (m === "each") { disk.push(items[i]); log(`${who} 写第 ${i + 1} 项 → 直接落盘：${items[i].text}`); }
      else { draft.push(items[i]); log(`${who} 写第 ${i + 1} 项 → 先放进草稿（事务里）`, "dim"); }
      render();
      if (crashAfter === i + 1) {
        draft = []; render();
        log(`💥 停电！${m === "each" ? "已经落盘的那几项留在了账本上。" : "草稿在内存里，随停电一起消失；账本一个字都没动。"}`, "bad");
        return false;
      }
    }
    if (m === "atomic") {
      await sleep(400);
      const c = ++commitNo;
      disk.push(...draft.map((d) => ({ ...d, commit: c })));
      draft = [];
      render();
      log(`✅ 提交 #${c}：三项一次性落盘（要么全有，要么全无）`, "ok");
    } else log(`✅ ${who} 三项都写完了`, "ok");
    return true;
  }
  function check() {
    log("🔌 来电了。重启后先翻账本，检查每句话是不是三样齐全：");
    const ks = [...new Set(disk.map((d) => d.k))];
    if (!ks.length) { log("  账本是空的——这句话等于没提交过。调用方拿同一个请求号重交一次就行（第 4 课）。", "ok"); return; }
    let bad = 0;
    for (const [idx, k] of ks.entries()) {
      const has = (t) => disk.some((d) => d.k === k && d.type === t);
      if (has("rec") && has("task") && has("sub")) { log(`  第 ${idx + 1} 句：记录、任务、提交单都在 ✔`, "ok"); continue; }
      bad++;
      if (has("rec") && !has("task")) log(`  第 ${idx + 1} 句：有用户消息，却没有生成任务 → 这句话永远没人回答 ✘`, "bad");
      else if (!has("sub")) log(`  第 ${idx + 1} 句：有任务，没有提交单 → 调用方永远等不到回音 ✘`, "bad");
    }
    if (!bad) log("  账本自洽。", "ok");
  }
  q("go").onclick = async () => {
    if (busy) return; busy = true;
    q("pen").textContent = "你";
    await writeAll("你", Number(q("crash").value), mode());
    q("pen").textContent = "没人拿笔"; busy = false;
  };
  q("check").onclick = check;
  q("reset").onclick = () => { disk = []; draft = []; n = 0; commitNo = 0; render(); log.clear(); q("pen").textContent = "没人拿笔"; };
  q("race").onclick = async () => {
    if (busy) return; busy = true;
    const m = mode();
    if (m === "each") {
      log("没有“唯一的笔”：两人各写各的，写入交错在一起——", "warn");
      const a = itemsFor("张三", ++n), b = itemsFor("李四", ++n);
      for (let i = 0; i < 3; i++) {
        for (const it of [a[i], b[i]]) { await sleep(350); disk.push(it); render(); log(`  落盘：${it.text}`); }
      }
      log("账本里两人的条目穿插排列：如果第 2 项写到一半出错，很难说清哪些属于谁、该撤回哪些。", "warn");
    } else {
      log("同一时刻只有一个人能拿笔，另一个人排队：", "dim");
      const run = (who) => (penQueue = penQueue.then(async () => {
        q("pen").textContent = `${who}（另一人在排队）`;
        log(`✒️ ${who} 拿到笔`);
        await writeAll(who, 0, "atomic");
        log(`✒️ ${who} 放下笔`, "dim");
      }));
      log("👤 李四 想写，但笔在张三手里，先等着……", "dim");
      await Promise.all([run("张三"), run("李四")]);
      q("pen").textContent = "没人拿笔";
      log("两次提交按先后排好，编号连续，互不穿插。", "ok");
    }
    busy = false;
  };
  render();
}

/* ───────────────────────── 02 检查点 ───────────────────────── */
function simCheckpoint(el) {
  const { q, log } = setup(el, "抄经与灭蜡烛：检查点",
    "小和尚要抄 5 页经，再装订。选好多久存一次检查点，抄到一半“吹灭蜡烛”，再“重新点灯”，数一数白抄了几页。",
    `<div class="sim-controls">
      <label>存检查点：<select data-k="freq"><option value="1">每抄完 1 页就存</option><option value="3">每抄完 3 页存一次</option><option value="99">从不存进度（只在开头存）</option></select></label>
    </div>
    <div class="sim-controls">
      <button data-k="start">▶ 开始抄经</button>
      <button data-k="crash" class="danger">💨 吹灭蜡烛（进程崩溃）</button>
      <button data-k="restart" class="secondary">🕯️ 重新点灯（重启）</button>
      <button data-k="reset" class="ghost">🔄 重置</button>
    </div>
    <div class="steps" data-k="steps"></div>
    <div class="pages" data-k="pages"></div>
    <div class="sim-grid">
      <div class="sim-panel draft"><b>🧠 脑子里记着的（内存）</b><div data-k="mem"></div></div>
      <div class="sim-panel store"><b>📒 存储里的任务状态</b><code class="json" data-k="disk"></code></div>
      <div class="sim-panel"><b>📊 统计</b><div data-k="stats"></div></div>
    </div>`);
  const PAGES = 5;
  let disk, mem, epoch = 0, wasted = 0, torn = new Set();
  const init = () => { disk = { status: "pending", checkpoint: { phase: "copy", page: 1 }, restarts: 0 }; mem = null; wasted = 0; torn = new Set(); epoch++; };
  const render = () => {
    const st = disk.status;
    q("steps").innerHTML = [["pending", "等待调度 pending"], ["running", "运行中 running"], ["completed", "完成 completed"]]
      .map(([s, t]) => `<div class="step ${st === s ? (s === "completed" ? "ok" : "on") : ""}">${t}</div>`).join("");
    const saved = disk.checkpoint.phase === "copy" ? disk.checkpoint.page - 1 : PAGES;
    q("pages").innerHTML = Array.from({ length: PAGES }, (_, i) => {
      const p = i + 1;
      let cls = "", fill = 0, label = `第${p}页`;
      if (p <= saved) { cls = "done"; fill = 100; label = `✔${p}`; }
      else if (mem && p < mem.page) { cls = "current"; fill = 100; label = `${p}未存`; }
      else if (mem && p === mem.page) { cls = "current"; fill = mem.fill; }
      else if (torn.has(p)) { cls = "torn"; label = `✘${p}`; }
      return `<div class="page ${cls}"><i class="fill" style="height:${fill}%"></i><span>${label}</span></div>`;
    }).join("") + `<div class="page ${disk.status === "completed" ? "done" : disk.checkpoint.phase === "bind" ? "current" : ""}"><span>📚装订</span></div>`;
    q("mem").innerHTML = mem ? `正在抄第 ${mem.page} 页（${Math.round(mem.fill)}%）` : "<span style='color:#aaa'>（没在干活）</span>";
    q("disk").textContent = JSON.stringify({ status: disk.status, checkpoint: disk.checkpoint, ...(disk.result ? { result: disk.result } : {}) }, null, 1);
    q("stats").innerHTML = `重启次数：<b>${disk.restarts}</b><br>白抄的页数：<b style="color:${wasted ? "#e03131" : "inherit"}">${wasted}</b>`;
  };
  async function run() {
    const my = ++epoch;
    disk.status = "running";
    torn = new Set();
    const freq = Number(q("freq").value);
    if (disk.checkpoint.phase === "copy") {
      mem = { page: disk.checkpoint.page, fill: 0 };
      log(`▶ 从检查点继续：从第 ${mem.page} 页抄起`);
      while (mem.page <= PAGES) {
        while (mem.fill < 100) { await sleep(45); if (my !== epoch) return; mem.fill += 5; render(); }
        log(`  ✍️ 抄完第 ${mem.page} 页`, "dim");
        if (mem.page % freq === 0 && mem.page < PAGES) {
          disk.checkpoint = { phase: "copy", page: mem.page + 1 };
          log(`  💾 提交检查点 {"phase":"copy","page":${mem.page + 1}}`, "ok");
        }
        mem = { page: mem.page + 1, fill: 0 };
        render();
      }
      disk.checkpoint = { phase: "bind" };
      log(`  💾 进入下一阶段，提交检查点 {"phase":"bind"}`, "ok");
    }
    mem = null; render();
    await sleep(700); if (my !== epoch) return;
    disk.status = "completed"; disk.result = "经书抄好了";
    log("📚 装订完成，任务结束：completed", "ok");
    render();
  }
  q("start").onclick = () => {
    if (disk.status === "running") return log("已经在抄了。", "dim");
    if (disk.status === "completed") return log("已经抄完了，点“重置”再来。", "dim");
    run();
  };
  q("crash").onclick = () => {
    if (disk.status !== "running") return log("现在没在干活，吹灭蜡烛也没影响。", "dim");
    epoch++;
    if (mem) {
      const saved = disk.checkpoint.page;
      for (let p = saved; p <= mem.page; p++) torn.add(p);
      const lost = mem.page - saved + mem.fill / 100;
      wasted += Math.round(lost * 10) / 10;
      log(`💥 蜡烛灭了！内存里的进度全没了：第 ${saved}～${mem.page} 页要重抄。存储里的状态还停在 running。`, "bad");
    } else log("💥 蜡烛灭了！装订到一半。存储里的检查点是 bind，重启后重新装订。", "bad");
    mem = null; render();
  };
  q("restart").onclick = async () => {
    if (mem) return log("蜡烛还亮着呢，先吹灭再说。", "dim");
    log("🕯️ 重新点灯：调度器 open() 翻开存储");
    if (disk.status === "running") {
      disk.status = "pending"; disk.restarts++;
      log(`  发现上次没干完（running）→ 改回 pending，重启次数 +1 = ${disk.restarts}`, "warn");
      render(); await sleep(600); run();
    } else if (disk.status === "pending") { log("  任务还没开始，直接开抄。"); run(); }
    else log("  任务已经完成，不用再做。", "ok");
  };
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

/* ───────────────────────── 03 效果三明治 ───────────────────────── */
function simSandwich(el) {
  const id = uid();
  const { q, log } = setup(el, "放盐还是搅拌：先记意图，再动手",
    "做汤分三步：搅拌（多做无害）、放盐（多放一次就咸了）、尝味。选一种记账顺序和停电的时刻，点“开始做汤”，停电后点“来电恢复”。",
    `<div class="sim-controls">
      <label><input type="radio" name="sw-${id}" value="sandwich" checked> 先记意图 → 动手 → 记结果（pi-durable）</label>
      <label><input type="radio" name="sw-${id}" value="after"> 先动手，再记一笔</label>
    </div>
    <div class="sim-controls">
      <label>停电时刻：<select data-k="crash"><option value="-1">不停电</option><option value="0">搅拌之后、记结果之前</option><option value="1" selected>放盐之后、记结果之前</option><option value="2">尝味之后、记结果之前</option></select></label>
      <label><input type="checkbox" data-k="saltsafe"> 给“放盐”声明 replay: "safe"（错误示范）</label>
    </div>
    <div class="sim-controls">
      <button data-k="start">▶ 开始做汤</button>
      <button data-k="restart" class="secondary">🔌 来电恢复</button>
      <button data-k="yes" class="secondary" style="display:none">🙋 人工确认：盐已经放过了</button>
      <button data-k="no" class="secondary" style="display:none">🙋 人工确认：还没放</button>
      <button data-k="reset" class="ghost">🔄 重置</button>
    </div>
    <div class="steps" data-k="steps"></div>
    <div class="sim-grid">
      <div class="sim-panel"><b>🍲 锅里真实发生的事</b><div data-k="world"></div></div>
      <div class="sim-panel store"><b>📒 账本（检查点与结果）</b><ul data-k="journal"></ul></div>
    </div>`);
  let world, journal, status, crashed, crashUsed, waitingStep, epoch = 0;
  const STEPS = [
    { name: "搅拌", replay: () => "safe", act: (w) => w.stir++, res: () => "搅匀了" },
    { name: "放盐", replay: () => (q("saltsafe").checked ? "safe" : "unsafe"), act: (w) => w.salt++, res: () => "放了一勺盐" },
    { name: "尝味", replay: () => "safe", act: (w) => w.taste++, res: (w) => verdict(w.salt) },
  ];
  const verdict = (s) => (s === 0 ? "淡而无味" : s === 1 ? "咸淡正好" : `太咸了（放了 ${s} 勺）`);
  const init = () => { world = { stir: 0, salt: 0, taste: 0 }; journal = []; status = ["未开始", "未开始", "未开始"]; crashed = false; crashUsed = false; waitingStep = -1; epoch++; showConfirm(false); };
  const order = () => el.querySelector(`input[name="sw-${id}"]:checked`).value;
  const has = (i, kind) => journal.some((j) => j.step === i && j.kind === kind);
  const showConfirm = (on) => { q("yes").style.display = on ? "" : "none"; q("no").style.display = on ? "" : "none"; };
  const render = () => {
    q("steps").innerHTML = STEPS.map((s, i) => {
      const st = status[i];
      const cls = st === "完成" ? "ok" : st.startsWith("⚠️") ? "bad" : st === "未开始" ? "" : "on";
      return `<div class="step ${cls}"><b>${i + 1}. ${s.name}</b><br><small>replay: ${s.replay()}</small><br>${st}</div>`;
    }).join("");
    const ok = world.salt === 1;
    q("world").innerHTML = `搅拌 ${world.stir} 次<br>盐 <b style="color:${world.salt > 1 ? "#e03131" : "inherit"}">${world.salt}</b> 勺<br>尝味 ${world.taste} 次<br>味道：<b style="color:${ok ? "#2f9e44" : world.salt > 1 ? "#e03131" : "inherit"}">${verdict(world.salt)}</b>`;
    q("journal").innerHTML = journal.map((j) => `<li><code>${esc(j.text)}</code></li>`).join("") || "<li style='list-style:none;color:#aaa'>（空）</li>";
  };
  async function doStep(i, my, skipIntent = false) {
    const s = STEPS[i];
    if (order() === "sandwich" && !skipIntent) {
      journal.push({ step: i, kind: "intent", text: `第${i + 1}步 检查点 {phase:"execute", replay:"${s.replay()}"}` });
      status[i] = "意图已记"; render(); log(`  ① 记意图：第 ${i + 1} 步「${s.name}」`, "dim");
      await sleep(450); if (my !== epoch) return false;
    }
    status[i] = "动手中"; render();
    s.act(world); render(); log(`  ② 动手：${s.name}`);
    await sleep(450); if (my !== epoch) return false;
    if (!crashUsed && Number(q("crash").value) === i) {
      crashUsed = true; crashed = true; epoch++;
      log(`💥 停电！「${s.name}」已经做了，结果还没来得及记。`, "bad");
      return false;
    }
    journal.push({ step: i, kind: "result", text: `第${i + 1}步 结果：${s.res(world)}` });
    status[i] = "完成"; render(); log(`  ③ 记结果：${s.res(world)}`, "ok");
    return true;
  }
  async function runFrom(start, recovering) {
    const my = ++epoch;
    for (let i = start; i < STEPS.length; i++) {
      const s = STEPS[i];
      if (has(i, "result")) { log(`跳过第 ${i + 1} 步「${s.name}」：账本里有结果`, "dim"); continue; }
      if (recovering && has(i, "intent")) {
        if (s.replay() === "safe") {
          log(`第 ${i + 1} 步「${s.name}」只有意图没有结果 → replay=safe，再做一遍`, "warn");
          if (!(await doStep(i, my, true))) return;
          continue;
        }
        status[i] = "⚠️ 中断，待人确认";
        journal.push({ step: i, kind: "interrupted", text: `第${i + 1}步 interrupted：可能做过了` });
        waitingStep = i; showConfirm(true); render();
        log(`第 ${i + 1} 步「${s.name}」只有意图没有结果 → replay=unsafe，不重做，记为 interrupted，等人确认`, "warn");
        return;
      }
      if (recovering && !has(i, "intent") && status[i] === "未知") {
        log(`第 ${i + 1} 步「${s.name}」账本里什么都没有 → 以为没做过，照做`, "warn");
      }
      if (!(await doStep(i, my))) return;
    }
    log(`🍲 汤做好了：${verdict(world.salt)}`, world.salt === 1 ? "ok" : "bad");
    if (world.salt > 1) log(order() === "after" ? "  原因：先动手后记账，停电后账本里没有“放过盐”的痕迹，于是又放了一次。" : "  原因：放盐不是“多做无害”的动作，却声明了 replay: \"safe\"。", "bad");
  }
  q("start").onclick = () => {
    if (status.some((s) => s !== "未开始")) return log("已经开始过了，点“重置”再来。", "dim");
    log(`▶ 开始做汤（${order() === "sandwich" ? "先记意图" : "先动手后记账"}）`);
    runFrom(0, false);
  };
  q("restart").onclick = () => {
    if (!crashed) return log("没有停过电。", "dim");
    crashed = false;
    log("🔌 来电了，翻账本恢复：");
    for (let i = 0; i < 3; i++) if (status[i] === "动手中" || status[i] === "意图已记") status[i] = "未知";
    render();
    runFrom(0, true);
  };
  q("yes").onclick = () => {
    const i = waitingStep; if (i < 0) return;
    journal.push({ step: i, kind: "result", text: `第${i + 1}步 结果：人工确认已放过` });
    status[i] = "完成"; waitingStep = -1; showConfirm(false); render();
    log("🙋 人工确认：盐已经放过了，不再放。", "ok");
    runFrom(i + 1, true);
  };
  q("no").onclick = async () => {
    const i = waitingStep; if (i < 0) return;
    waitingStep = -1; showConfirm(false);
    log("🙋 人工确认：还没放，那就放一次。", "ok");
    const my = ++epoch;
    if (await doStep(i, my, true)) runFrom(i + 1, true);
  };
  q("saltsafe").onchange = render;
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

/* ───────────────────────── 04 提交单与请求号 ───────────────────────── */
function simSubmit(el) {
  const { q, log } = setup(el, "挂号窗口：请求号让同一件事只算一次",
    "调用方提交一句话。勾上“回执在路上丢了”，再用同样的请求号重交，看看模型会不会被问两次。去掉请求号再试一次。",
    `<div class="sim-controls">
      <input type="text" data-k="content" value="法国首都是？" aria-label="内容">
      <label><input type="checkbox" data-k="useRid" checked> 带上请求号</label>
      <input type="text" data-k="rid" value="q-1" aria-label="请求号" style="width:6rem">
      <select data-k="type"><option value="input">input（要回答）</option><option value="write">write（直接记一笔）</option></select>
    </div>
    <div class="sim-controls">
      <label><input type="checkbox" data-k="lose" checked> 回执在路上丢了（网络超时）</label>
      <button data-k="go">📨 提交</button>
      <button data-k="newrid" class="secondary">🆕 换个新请求号</button>
      <button data-k="reset" class="ghost">🧹 清空</button>
    </div>
    <div class="sim-grid">
      <div class="sim-panel"><b>📱 调用方看到的</b><ul data-k="client"></ul></div>
      <div class="sim-panel store"><b>🎫 提交单（存储里）</b><ul data-k="subs"></ul></div>
      <div class="sim-panel store"><b>📒 对话记录</b><ul data-k="records"></ul><div data-k="calls" style="margin-top:.4rem"></div></div>
    </div>`);
  let subs, records, client, calls, nextSub, nextRid;
  const init = () => { subs = []; records = []; client = []; calls = 0; nextSub = 1; nextRid = 2; };
  const render = () => {
    const none = "<li style='list-style:none;color:#aaa'>（空）</li>";
    q("client").innerHTML = client.map((c) => `<li>${c}</li>`).join("") || none;
    q("subs").innerHTML = subs.map((s) => `<li><b>${s.id}</b> 请求号=${s.rid ? esc(s.rid) : "（无）"} · ${s.type} · ${s.status}</li>`).join("") || none;
    q("records").innerHTML = records.map((r) => `<li><code>${r.kind}</code> ${esc(r.text)}</li>`).join("") || none;
    q("calls").innerHTML = `模型被问了 <b style="color:${calls > 1 ? "#e03131" : "inherit"}">${calls}</b> 次`;
  };
  const answerFor = (t) => (t.includes("首都") ? "巴黎。" : `收到：“${t}”`);
  q("go").onclick = () => {
    const content = q("content").value.trim() || "（空）";
    const rid = q("useRid").checked ? q("rid").value.trim() : "";
    const type = q("type").value;
    log(`📨 提交 {type:"${type}", content:"${content}"${rid ? `, requestId:"${rid}"` : ""}}`);
    // —— 以下在同一个事务里完成：查重 + 登记 ——
    let sub;
    if (rid) {
      const existing = subs.find((s) => s.rid === rid);
      if (existing) {
        if (existing.type !== type) {
          log(`  ✘ 报错：请求号 ${rid} 已经被另一种提交单用过了`, "bad");
          client.push(`<span class="pill bad">报错</span> 请求号 ${esc(rid)} 被另一种提交单用过了`);
          return render();
        }
        sub = existing;
        log(`  在同一个事务里查到同号的 ${sub.id} → 直接还回去，不再登记，也不再问模型`, "ok");
        if (existing.content !== content) log("  （内容变了也只认请求号：请求号代表的是“这一件事”）", "dim");
      }
    }
    if (!sub) {
      sub = { id: `s-${nextSub++}`, rid, type, content, status: type === "input" ? "等待回答" : "已记下" };
      subs.push(sub);
      if (type === "input") {
        records.push({ kind: "pi.user", text: content });
        log(`  登记新提交单 ${sub.id}，写入用户消息，排队等模型回答`);
        setTimeout(() => {
          calls++;
          records.push({ kind: "pi.assistant", text: answerFor(content) });
          sub.status = "done（已回答）";
          log(`  🤖 模型回答了 ${sub.id}：${answerFor(content)}`, "ok");
          render();
        }, 1200);
      } else {
        records.push({ kind: "app.note", text: content });
        log(`  登记新提交单 ${sub.id}，直接记一笔，不问模型`);
      }
    }
    if (q("lose").checked) {
      client.push(`<span class="pill warn">超时</span> 没收到回执……（其实服务端已有 ${sub.id}）`);
      log("  📶 回执在路上丢了：调用方不知道交上去没有，只能再交一次", "warn");
    } else client.push(`<span class="pill ok">回执</span> 提交单 ${sub.id}`);
    render();
  };
  q("newrid").onclick = () => { q("rid").value = `q-${nextRid++}`; log(`换成新请求号 ${q("rid").value}：代表“另一件事”`, "dim"); };
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

/* ───────────────────────── 08 收件箱 ───────────────────────── */
function simInbox(el) {
  const { q, log } = setup(el, "饭馆跑堂：对话正忙时，新消息怎么放",
    "先点“点菜”让厨房忙起来，然后在炒菜途中试试四种放法：插话、排队追问、忙就不点、直接记一笔。观察它们分别在哪个时刻进入对话记录。",
    `<div class="sim-controls">
      <button data-k="order">🧾 点菜：来一份宫保鸡丁</button>
      <button data-k="steer" class="secondary">🗣️ 插话 steer</button>
      <button data-k="follow" class="secondary">🍚 排队追问 followUp</button>
      <button data-k="reject" class="secondary">✋ 忙就不点 reject</button>
      <button data-k="write" class="secondary">📝 直接记一笔 write</button>
      <label><input type="checkbox" data-k="all"> 一次全放（steeringMode / followUpMode = "all"）</label>
      <button data-k="reset" class="ghost">🔄 重置</button>
    </div>
    <div class="steps" data-k="steps"></div>
    <div class="sim-grid">
      <div class="sim-panel"><b>📥 收件箱（排着的）</b><ul data-k="inbox"></ul></div>
      <div class="sim-panel store" style="grid-column: span 2"><b>📒 对话记录</b><ul data-k="records"></ul></div>
    </div>`);
  const STEER = ["少放辣", "不要香菜", "多加花生"];
  const ANSWER = { "再来碗米饭": "米饭马上来。", "来瓶冰可乐": "冰可乐马上来。", "打包一份带走": "好的，再给您打包一份带走。", "来一份宫保鸡丁": "宫保鸡丁上桌。" };
  const FOLLOW = ["再来碗米饭", "来瓶冰可乐", "打包一份带走"];
  let busy, phase, inbox, records, si, fi, epoch = 0, runNo;
  const init = () => { busy = false; phase = "idle"; inbox = []; records = []; si = 0; fi = 0; runNo = 0; epoch++; };
  const render = () => {
    const P = [["think", "🤔 模型思考"], ["tool", "🍳 工具回合：炒菜"], ["post", "边界①：工具回合之后"], ["answer", "💬 模型回答"], ["final", "边界②：运行结束"]];
    q("steps").innerHTML = `<div class="step ${phase === "idle" ? "ok" : ""}">${busy ? `第 ${runNo} 次运行中` : "空闲"}</div>` + P.map(([k, t]) => `<div class="step ${phase === k ? "on" : ""}">${t}</div>`).join("");
    q("inbox").innerHTML = inbox.map((m) => `<li><span class="pill ${m.mode === "steer" ? "warn" : ""}">${m.mode === "steer" ? "插话" : "排队追问"}</span> ${esc(m.text)}</li>`).join("") || "<li style='list-style:none;color:#aaa'>（空）</li>";
    q("records").innerHTML = records.map((r) => `<li><code>${r.kind}</code> ${esc(r.text)}${r.note ? ` <span class="pill">${r.note}</span>` : ""}</li>`).join("") || "<li style='list-style:none;color:#aaa'>（空）</li>";
  };
  const take = (mode) => {
    const all = q("all").checked;
    const picked = [];
    for (let i = 0; i < inbox.length;) {
      if (inbox[i].mode === mode && (all || picked.length === 0)) picked.push(...inbox.splice(i, 1));
      else i++;
    }
    return picked;
  };
  const wait = async (ms, my) => { await sleep(ms); return my === epoch; };
  async function run(inputs) {
    const my = epoch;
    busy = true; runNo++;
    for (const m of inputs) records.push({ kind: "pi.user", text: m.text, note: m.note });
    log(`▶ 第 ${runNo} 次运行开始：${inputs.map((m) => m.text).join("、")}`);
    let needTool = inputs.some((m) => m.text.includes("宫保鸡丁"));
    const applied = [];
    for (;;) {
      phase = "think"; render(); if (!(await wait(900, my))) return;
      if (needTool) {
        records.push({ kind: "pi.assistant", text: "[调用工具 cook]" });
        phase = "tool"; render(); log("  🍳 工具回合：炒宫保鸡丁……（这时候试试插话）", "dim");
        if (!(await wait(2200, my))) return;
        records.push({ kind: "pi.tool-result", text: "宫保鸡丁 做好了" });
        needTool = false;
        phase = "post"; render();
        const steers = take("steer");
        for (const s of steers) { records.push({ kind: "pi.user", text: s.text, note: "插话：工具回合之后放入" }); applied.push(s.text); }
        log(steers.length ? `  边界①：放入插话 ${steers.map((s) => s.text).join("、")}，加入这次运行` : "  边界①：没有插话", steers.length ? "warn" : "dim");
        render(); if (!(await wait(600, my))) return;
        continue;
      }
      phase = "answer"; render(); if (!(await wait(800, my))) return;
      const dish = inputs.some((m) => m.text.includes("宫保鸡丁"));
      const answer = dish ? `宫保鸡丁上桌${applied.length ? `，已按要求：${applied.join("、")}` : ""}。` : applied.length ? `好的，已按要求：${applied.join("、")}。` : inputs.map((m) => ANSWER[m.text] || `好的：${m.text}。`).join("");
      records.push({ kind: "pi.assistant", text: answer });
      log(`  💬 回答：${answer}`, "ok");
      phase = "final"; render(); if (!(await wait(600, my))) return;
      const lateSteers = take("steer");
      if (lateSteers.length) {
        for (const s of lateSteers) { records.push({ kind: "pi.user", text: s.text, note: "插话：运行收尾前放入" }); applied.length = 0; applied.push(s.text); }
        log(`  边界②：还有插话 ${lateSteers.map((s) => s.text).join("、")} → 继续这次运行`, "warn");
        inputs = lateSteers;
        continue;
      }
      break;
    }
    const follows = take("follow");
    if (follows.length) {
      log(`  边界②：取出排队追问 ${follows.map((f) => f.text).join("、")} → 开启下一次运行`, "warn");
      follows.forEach((f) => (f.note = "排队追问：回答之后放入"));
      return run(follows);
    }
    busy = false; phase = "idle"; log("⏹ 运行结束，对话空闲", "dim"); render();
  }
  const submit = (text, mode) => {
    if (!busy) { run([{ text }]); return; }
    inbox.push({ text, mode }); render();
    log(`📥 对话正忙 → ${mode === "steer" ? "插话" : "排队追问"}「${text}」进收件箱`);
  };
  q("order").onclick = () => submit("来一份宫保鸡丁", "follow");
  q("steer").onclick = () => submit(STEER[si++ % STEER.length], "steer");
  q("follow").onclick = () => submit(FOLLOW[fi++ % FOLLOW.length], "follow");
  q("reject").onclick = () => {
    if (busy) { log("✋ ConversationBusy：对话正忙，这条被拒绝（调用方自己决定稍后再试）", "bad"); return; }
    run([{ text: "来一份宫保鸡丁" }]);
  };
  q("write").onclick = () => {
    records.push({ kind: "app.note", text: "顾客挪到了靠窗那桌", note: "直接记一笔：立即追加" });
    log("📝 直接记一笔：只有种类和数据，不排队、不问模型，马上出现在记录里", "ok");
    render();
  };
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

/* ───────────────────────── 11 归属树与中止 ───────────────────────── */
function simAbort(el) {
  const { q, log } = setup(el, "拆帐篷：自下而上地中止",
    "点“按 Esc”中止当前运行，或点任意节点上的 ✖。先整棵子树一次性标记“待中止”，再从最底下的叶子开始，一层一层收场。勾上“收拾到一半停电”，看看重启后会不会接着拆。",
    `<div class="sim-controls">
      <button data-k="esc">🛑 按 Esc：中止当前运行</button>
      <label><input type="checkbox" data-k="crash"> 收拾到一半停电一次</label>
      <button data-k="restart" class="secondary">🔌 来电重启</button>
      <button data-k="reset" class="ghost">🔄 重置</button>
    </div>
    <div class="sim-panel tree" data-k="tree" style="min-height:12rem"></div>`);
  const TREE = { id: "conv", name: "🗨️ 对话", children: [
    { id: "gen", name: "生成任务：回答“查天气并订票”", children: [
      { id: "search", name: "工具任务：搜索天气", children: [] },
      { id: "agent", name: "工具任务：子智能体", children: [
        { id: "subgen", name: "子生成任务", children: [
          { id: "book", name: "工具任务：订票", children: [] }] }] }] },
    { id: "bg", name: "后台任务：整理索引（归对话所有）", bg: true, children: [] }] };
  const LABEL = { running: "运行中", marked: "待中止", aborting: "中止处理中", aborted: "已中止" };
  let state, busy, crashed, crashUsed, epoch = 0;
  const all = []; (function walk(n, p) { n.parent = p; all.push(n); n.children.forEach((c) => walk(c, n)); })(TREE, null);
  const byId = Object.fromEntries(all.map((n) => [n.id, n]));
  const init = () => { state = Object.fromEntries(all.map((n) => [n.id, "running"])); busy = false; crashed = false; crashUsed = false; epoch++; };
  const render = () => {
    const node = (n) => `<li><span class="node ${state[n.id]} ${n.bg ? "bg" : ""}">${esc(n.name)} <span class="pill">${LABEL[state[n.id]]}</span>${n.id !== "conv" && state[n.id] === "running" ? ` <button data-abort="${n.id}" style="width:auto;margin:0;padding:0 .45rem;font-size:.75rem">✖</button>` : ""}</span>${n.children.length ? `<ul>${n.children.map(node).join("")}</ul>` : ""}</li>`;
    q("tree").innerHTML = `<ul style="border:none;padding-left:0">${node(TREE)}</ul>`;
    q("tree").querySelectorAll("[data-abort]").forEach((b) => (b.onclick = () => abort(b.dataset.abort)));
  };
  const subtree = (n) => [n, ...n.children.flatMap(subtree)];
  async function drain() {
    const my = epoch;
    let handled = 0;
    for (;;) {
      const next = [...all].reverse().find((n) => state[n.id] === "marked" && n.children.every((c) => state[c.id] !== "marked" && state[c.id] !== "aborting"));
      if (!next) break;
      state[next.id] = "aborting"; render();
      log(`  🔧 运行中止处理函数：${next.name}（收绳子、叠篷布）`);
      await sleep(800); if (my !== epoch) return;
      if (q("crash").checked && !crashUsed && handled === 1) {
        crashUsed = true; crashed = true; epoch++;
        state[next.id] = "marked"; render();
        log(`💥 停电！“${next.name}”的中止处理函数被打断。`, "bad");
        log("  但“哪些待中止”已经提交进账本，重启后能接着拆。", "dim");
        return;
      }
      state[next.id] = "aborted"; handled++; render();
      log(`  ✅ 提交：${next.name} → 已中止`, "ok");
    }
    busy = false;
    log("🏁 收场完毕。后台任务不归这次运行管，没受影响。", "ok");
  }
  async function abort(id) {
    if (busy) return log("正在收场，稍等。", "dim");
    const n = byId[id];
    const targets = subtree(n).filter((d) => state[d.id] === "running");
    if (!targets.length) return;
    busy = true;
    targets.forEach((d) => (state[d.id] = "marked")); render();
    log(`🛑 中止「${n.name}」：一次提交，把它和它下面的 ${targets.length - 1} 个任务都标记为“待中止”`, "warn");
    await sleep(700);
    log("  从最底下的叶子开始，孩子都收完了，才轮到父亲：", "dim");
    drain();
  }
  q("esc").onclick = () => abort("gen");
  q("restart").onclick = () => {
    if (!crashed) return log("没有停过电。", "dim");
    crashed = false;
    log("🔌 来电了：调度器翻开账本，发现还有“待中止”的任务，从下往上接着收场", "warn");
    drain();
  };
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

/* ───────────────────────── 12 子任务 failFast ───────────────────────── */
function simFailFast(el) {
  const id = uid();
  const { q, log } = setup(el, "分头买票：一败俱停，还是全部等完",
    "结账任务同时派出三笔付款（三个子任务），自己原地等。设好每笔的快慢和成败，选一种等法，点“开始结账”，看最后顾客被扣了几笔钱。",
    `<div data-k="rows"></div>
    <div class="sim-controls">
      <label><input type="radio" name="ff-${id}" value="failFast" checked> 一败俱停 failFast</label>
      <label><input type="radio" name="ff-${id}" value="allSettled"> 全部等完 allSettled</label>
      <label><input type="checkbox" data-k="comp"> 父任务补偿已完成的付款（改进版）</label>
    </div>
    <div class="sim-controls">
      <button data-k="go">▶ 开始结账</button>
      <button data-k="reset" class="ghost">🔄 重置</button>
    </div>
    <div class="sim-grid">
      <div class="sim-panel"><b>🧾 父任务：结账</b><div data-k="parent"></div></div>
      <div class="sim-panel store"><b>🏦 银行流水</b><ul data-k="ledger"></ul></div>
    </div>`);
  const PAY = [
    { bank: "招行", key: "payment-8", dur: "1200", ok: "1" },
    { bank: "交行", key: "payment-9", dur: "2200", ok: "0" },
    { bank: "建行", key: "payment-10", dur: "4000", ok: "1" },
  ];
  let kids, ledger, parent, running = false, epoch = 0;
  q("rows").innerHTML = PAY.map((p, i) => `<div class="sim-controls" style="margin-bottom:.4rem">
      <b style="min-width:4.5rem">${p.bank}</b><small>${p.key}</small>
      <select data-k="dur${i}"><option value="1200">快</option><option value="2200">中</option><option value="4000">慢</option></select>
      <select data-k="ok${i}"><option value="1">会成功</option><option value="0">会被拒</option></select>
      <span data-k="st${i}" class="pill">未开始</span>
      <div class="bar" style="flex:1 1 120px"><i data-k="bar${i}"></i></div></div>`).join("");
  PAY.forEach((p, i) => { q(`dur${i}`).value = p.dur; q(`ok${i}`).value = p.ok; });
  const policy = () => el.querySelector(`input[name="ff-${id}"]:checked`).value;
  const init = () => { epoch++; running = false; kids = PAY.map((p) => ({ ...p, status: "未开始", pct: 0 })); ledger = []; parent = "等待开始"; };
  const render = () => {
    kids.forEach((k, i) => {
      const st = q(`st${i}`); st.textContent = k.status;
      st.className = `pill ${k.status === "completed" ? "ok" : k.status === "failed" ? "bad" : k.status === "aborted" ? "warn" : ""}`;
      q(`bar${i}`).style.width = `${k.pct}%`;
    });
    const net = {}; ledger.forEach((l) => (net[l.bank] = (net[l.bank] || 0) + l.amt));
    const charged = Object.values(net).filter((v) => v > 0).length;
    q("ledger").innerHTML = (ledger.map((l) => `<li>${l.amt > 0 ? "💳 扣款" : "↩️ 退款"} ${l.bank}（${l.key}）${l.note ? `<small>　${l.note}</small>` : ""}</li>`).join("") || "<li style='list-style:none;color:#aaa'>（空）</li>") +
      (ledger.length ? `<li style="list-style:none;margin-top:.3rem"><b>顾客净被扣：${charged} 笔</b></li>` : "");
    q("parent").innerHTML = parent;
  };
  async function child(k, i, my) {
    const dur = Number(q(`dur${i}`).value), ok = q(`ok${i}`).value === "1";
    k.status = "running";
    if (ok) { ledger.push({ bank: k.bank, key: k.key, amt: 1, note: "扣款请求已发出" }); log(`  💳 ${k.bank} 发起扣款（${k.key}）`); }
    render();
    const t0 = performance.now();
    while (k.status === "running") {
      await sleep(60); if (my !== epoch) return;
      if (k.status !== "running") return;
      k.pct = Math.min(100, ((performance.now() - t0) / dur) * 100); render();
      if (k.pct >= 100) break;
    }
    if (ok) { k.status = "completed"; log(`  ✅ ${k.bank} 付款完成`, "ok"); }
    else { k.status = "failed"; log(`  ❌ ${k.bank} 扣款被拒，子任务 failed`, "bad"); }
    render();
    if (!ok && policy() === "failFast") {
      for (const s of kids) if (s.status === "running") {
        s.status = "aborted";
        log(`  🛑 failFast：中止还没结束的 ${s.bank}`, "warn");
        if (ledger.some((l) => l.key === s.key && l.amt > 0)) {
          ledger.push({ bank: s.bank, key: s.key, amt: -1, note: "子任务的中止处理函数" });
          log(`  ↩️ ${s.bank} 的中止处理函数：按幂等键退款 ${s.key}`);
        }
      }
      render();
    }
  }
  q("go").onclick = async () => {
    if (running) return;
    init(); log.clear(); running = true;
    const my = epoch;
    parent = `等待中：{ status:"waiting", on:[三笔付款], policy:"${policy()}" }<br><small>等待期间父任务不运行代码</small>`; render();
    log(`▶ 结账：一次提交创建 3 个子任务，并以 ${policy()} 方式等待`);
    await Promise.all(kids.map((k, i) => child(k, i, my)));
    if (my !== epoch) return;
    parent = "decide 阶段：所有子任务都已结束，父任务醒来做决定"; render();
    await sleep(600); if (my !== epoch) return;
    log(`  🧾 各笔付款：${kids.map((k) => k.status).join(", ")}`, "dim");
    const failed = kids.some((k) => k.status !== "completed");
    if (failed) {
      if (q("comp").checked) for (const k of kids) if (k.status === "completed") {
        ledger.push({ bank: k.bank, key: k.key, amt: -1, note: "父任务 decide 阶段补偿" });
        log(`  ↩️ 父任务补偿：退款 ${k.key}（带幂等键，重跑也只退一次）`, "ok");
      }
      parent = `<span class="pill bad">failed</span> 有一笔付款失败`;
    } else parent = `<span class="pill ok">completed</span> 三笔都成功，票买到了`;
    render();
    const net = {}; ledger.forEach((l) => (net[l.bank] = (net[l.bank] || 0) + l.amt));
    const charged = Object.values(net).filter((v) => v > 0).length;
    if (failed && charged) log(`⚠️ 没买成，顾客却被扣了 ${charged} 笔钱：failFast 只管“还活着的”兄弟，已完成的要父任务自己补偿。`, "bad");
    else if (failed) log("✅ 没买成，也没多扣钱。", "ok");
    else log("✅ 结账成功。", "ok");
    running = false;
  };
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

/* ───────────────────────── 19 崩溃循环 ───────────────────────── */
function simRestart(el) {
  const id = uid();
  const { q, log } = setup(el, "总晕倒的搬运工：重启上限",
    "搬运工要搬 6 箱货。有的 bug 让他每次都在同一箱晕倒（进程崩溃）。反复“启动进程”，看重启次数到上限时任务被停放；再换成“每次都有进展”的情况对比。",
    `<div class="sim-controls">
      <label><input type="radio" name="rs-${id}" value="stuck" checked> 每次都在第 3 箱晕倒（没有进展）</label>
      <label><input type="radio" name="rs-${id}" value="progress"> 每次搬完一箱才晕倒（有进展）</label>
    </div>
    <div class="sim-controls">
      <label>restartLimit <input type="number" data-k="limit" value="5" min="1" max="20" style="width:4.5rem"></label>
      <label><input type="checkbox" data-k="inf"> Infinity（永不停放）</label>
    </div>
    <div class="sim-controls">
      <button data-k="open">⚡ 启动进程</button>
      <button data-k="auto" class="secondary">🔁 一直重启，直到停下</button>
      <button data-k="fix" class="secondary">🩹 修好 bug（换辆大推车）</button>
      <button data-k="retry" class="secondary">♻️ retryTask 重试</button>
      <button data-k="reset" class="ghost">🔄 重置</button>
    </div>
    <div class="sim-grid">
      <div class="sim-panel"><b>📦 货（已提交的进度）</b><div data-k="boxes" style="font-size:1.4rem"></div><div class="bar"><i data-k="bar"></i></div></div>
      <div class="sim-panel store"><b>📒 存储里的任务</b><div data-k="state"></div></div>
      <div class="sim-panel"><b>✋ 重启计数（划道道）</b><div data-k="tally" style="font-size:1.3rem;letter-spacing:.1em"></div></div>
    </div>`);
  const TOTAL = 6;
  let disk, fixed, reported, runningNow, autoOn = false;
  const init = () => { disk = { status: "pending", boxes: 0, restarts: 0 }; fixed = false; reported = false; runningNow = false; autoOn = false; };
  const limit = () => (q("inf").checked ? Infinity : Math.max(1, Number(q("limit").value) || 5));
  const scen = () => el.querySelector(`input[name="rs-${id}"]:checked`).value;
  const render = (pct = 0) => {
    q("boxes").innerHTML = Array.from({ length: TOTAL }, (_, i) => (i < disk.boxes ? "✅" : "📦")).join(" ");
    q("bar").style.width = `${pct}%`;
    const color = { pending: "", running: "warn", parked: "bad", completed: "ok" }[disk.status];
    const zh = { pending: "等待调度", running: "运行中", parked: "已停放（restart_limit）", completed: "完成" }[disk.status];
    q("state").innerHTML = `状态：<span class="pill ${color}">${disk.status}</span> ${zh}<br>已搬：${disk.boxes} / ${TOTAL}<br>${fixed ? "🩹 bug 已修好" : "🐞 bug 还在"}`;
    const L = limit();
    q("tally").innerHTML = L === Infinity
      ? `${"𝍸".repeat(Math.min(disk.restarts, 30))}<br><small>${disk.restarts} 次 / 上限 ∞</small>`
      : Array.from({ length: L }, (_, i) => `<span style="color:${i < disk.restarts ? (disk.status === "parked" ? "#e03131" : "#e8590c") : "#ddd"}">┃</span>`).join("") + `<br><small>${disk.restarts} 次 / 上限 ${L}</small>`;
  };
  async function run() {
    disk.status = "running"; runningNow = true; render();
    let movedThisRun = 0;
    while (disk.boxes < TOTAL) {
      const crashHere = !fixed && (scen() === "stuck" ? disk.boxes === 2 : movedThisRun === 1);
      for (let p = 0; p <= 100; p += 10) { await sleep(crashHere && p > 50 ? 0 : 45); render(p); if (crashHere && p >= 60) break; }
      if (crashHere) {
        runningNow = false;
        log(`  💥 搬第 ${disk.boxes + 1} 箱时晕倒（内存耗尽），进程死掉。存储里的状态还是 running。`, "bad");
        render(); return;
      }
      disk.boxes++; movedThisRun++;
      const hadCount = disk.restarts;
      disk.restarts = 0;
      log(`  ✅ 搬完第 ${disk.boxes} 箱，提交新状态${hadCount ? "——任务有了进展，重启计数清零" : ""}`, "ok");
      render();
    }
    disk.status = "completed"; runningNow = false;
    log("🏁 6 箱全部搬完：completed", "ok"); render();
  }
  async function open() {
    if (runningNow) return false;
    log("⚡ 进程启动：调度器 open() 翻开存储");
    if (disk.status === "running") {
      disk.restarts++;
      if (disk.restarts >= limit()) {
        disk.status = "parked"; render();
        log(`  上次被打断，重启次数 +1 = ${disk.restarts}，到达上限 → 停放（parked），不再自动运行`, "bad");
        if (!reported) { reported = true; log(`  📣 onReport(error, { type: "task_parked" })——只报这一次`, "warn"); }
        log("  界面上应该列出被停放的任务，并给一个“重试”按钮（retryTask）。", "dim");
        return false;
      }
      disk.status = "pending";
      log(`  上次被打断（running）→ 改回 pending，重启次数 +1 = ${disk.restarts}`, "warn");
    } else if (disk.status === "parked") { log("  任务已停放：wake() 不把它算作活跃，不会自动再跑。", "dim"); return false; }
    else if (disk.status === "completed") { log("  任务已经完成。", "ok"); return false; }
    render();
    await sleep(300);
    await run();
    return disk.status === "running";
  }
  q("open").onclick = () => open();
  q("auto").onclick = async () => {
    if (autoOn) return; autoOn = true;
    for (let i = 0; i < 40 && autoOn; i++) { const again = await open(); if (!again) break; await sleep(500); }
    autoOn = false;
  };
  q("fix").onclick = () => { fixed = true; log("🩹 bug 修好了：换了一辆大推车，不会再晕倒。", "ok"); render(); };
  q("retry").onclick = async () => {
    if (disk.status !== "parked") return log("只有被停放的任务才需要 retryTask。", "dim");
    log("♻️ harness.retryTask(id)：把停放的任务再跑一次", "warn");
    disk.status = "pending"; disk.restarts = 0; reported = false; render();
    await sleep(300); await run();
  };
  q("inf").onchange = () => render();
  q("limit").oninput = () => render();
  q("reset").onclick = () => { init(); log.clear(); render(); };
  init(); render();
}

const SIMS = { commit: simCommit, checkpoint: simCheckpoint, sandwich: simSandwich, submit: simSubmit, inbox: simInbox, abort: simAbort, failfast: simFailFast, restart: simRestart };

export function mountSim(el, name) {
  const fn = SIMS[name];
  if (!fn) { el.textContent = `（未知的模拟器：${name}）`; return; }
  fn(el);
}

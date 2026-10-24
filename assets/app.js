// pi-durable 中文教程 · 单页阅读器
// 依赖全部来自 CDN：marked（Markdown）、mermaid（流程图）、highlight.js（代码高亮）
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15/lib/marked.esm.js";
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
import hljs from "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/es/highlight.min.js";
import { mountSim } from "./sims.js";

const REPO = "https://github.com/dockcy/pi-durable-tutorial";
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",sans-serif';

const GROUPS = [
  { key: "start", name: "🧭 起步" },
  { key: "p0", name: "🔴 P0 · 必须吃透" },
  { key: "p1", name: "🟠 P1 · 用到再深入" },
  { key: "p2", name: "⚪ P2 · 进阶" },
  { key: "ts", name: "📘 语法课" },
];

export const LESSONS = [
  ["00-overview", "总览：一张图看懂 pi-durable", "start"],
  ["01-one-pen", "唯一的一支笔：写入线与原子提交", "p0"],
  ["02-task-checkpoint", "任务 = 状态机 + 检查点", "p0"],
  ["03-effect-sandwich", "效果三明治：先记意图再动手", "p0"],
  ["04-submission", "提交单与请求号：只算一次", "p0"],
  ["05-run-loop", "一次回答的全过程", "p0"],
  ["06-context", "取消令牌：不等了 ≠ 不做了", "p0"],
  ["07-documents", "文档：和记录一起提交的小黑板", "p1"],
  ["08-inbox", "收件箱：对话正忙时的新消息", "p1"],
  ["09-extensions", "扩展、注册表与热重载", "p1"],
  ["10-tools-hooks", "工具与钩子：衙门口的门房", "p1"],
  ["11-ownership-abort", "归属树与中止：自下而上收场", "p1"],
  ["12-child-tasks", "子任务：一败俱停还是全部等完", "p1"],
  ["13-sleep-wake", "睡眠与唤醒：到点叫我", "p1"],
  ["14-storage", "存储约定与错误三原则", "p1"],
  ["15-compaction", "上下文压缩：旧日志写成摘要", "p2"],
  ["16-forks", "多个对话与分叉", "p2"],
  ["17-watch", "订阅变化与多人协作", "p2"],
  ["18-codemode", "代码模式：照着录音重演", "p2"],
  ["19-crash-loop", "崩溃循环与重启上限", "p2"],
  ["20-ts-unions", "可辨识联合类型：邮局分拣格", "ts"],
  ["21-ts-generics", "泛型：糕点模具", "ts"],
  ["22-typebox", "TypeBox：海关申报单", "ts"],
].map(([id, title, group]) => ({ id, title, group, num: id.slice(0, 2) }));

const DONE_KEY = "pi-durable-tutorial:done";
const doneSet = () => new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]"));
const saveDone = (set) => localStorage.setItem(DONE_KEY, JSON.stringify([...set]));

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  fontFamily: FONT,
  themeVariables: {
    fontFamily: FONT,
    fontSize: "15px",
    primaryColor: "#fff8e7",
    primaryBorderColor: "#b8892b",
    primaryTextColor: "#2b2419",
    lineColor: "#6b5d48",
    secondaryColor: "#f1ece0",
    tertiaryColor: "#fbf6ea",
    noteBkgColor: "#fff3bf",
    noteBorderColor: "#e8b500",
    actorBkg: "#fff8e7",
    actorBorder: "#b8892b",
    git0: "#b8892b", git1: "#e5484d", git2: "#4c6ef5", git3: "#2f9e44",
  },
  flowchart: { htmlLabels: true, curve: "basis", padding: 12 },
  sequence: { mirrorActors: false, useMaxWidth: true },
  gitGraph: { mainBranchName: "原对话" },
});

marked.setOptions({ gfm: true, breaks: false });

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 脚注预处理：把 [^id] 换成上标编号，把定义收集到文末“注释与出处”。不处理代码块内部。 */
function preprocessFootnotes(md) {
  const parts = md.split(/(^```[\s\S]*?^```)/gm);
  const defs = new Map();
  const order = [];
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/^\[\^([^\]\s]+)\]:[ \t]*(.*)$/gm, (_, id, text) => {
      defs.set(id, text);
      return "";
    });
  }
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/\[\^([^\]\s]+)\]/g, (all, id) => {
      if (!defs.has(id)) return all;
      let n = order.indexOf(id);
      if (n < 0) { order.push(id); n = order.length - 1; }
      return `<sup class="fn"><a data-fn="${n + 1}" title="查看出处">[${n + 1}]</a></sup>`;
    });
  }
  let out = parts.join("");
  if (order.length) {
    out += `\n\n<section class="footnotes">\n\n**注释与出处**\n\n${order.map((id, i) => `${i + 1}. ${defs.get(id)}`).join("\n")}\n\n</section>\n`;
  }
  return out;
}

function buildNav(activeId) {
  const done = doneSet();
  const nav = $("#nav");
  nav.innerHTML = GROUPS.map((g) => {
    const items = LESSONS.filter((l) => l.group === g.key)
      .map((l) => `<a href="#/${l.id}" class="${l.id === activeId ? "active" : ""}"><span class="num">${l.num}</span><span>${esc(l.title)}</span>${done.has(l.id) ? '<span class="done" title="已学完">✔</span>' : ""}</a>`)
      .join("");
    return `<h4>${g.name}</h4>${items}`;
  }).join("");
  $("#progress").textContent = `已学完 ${[...done].filter((id) => LESSONS.some((l) => l.id === id)).length} / ${LESSONS.length} 课`;
}

function decorate(root) {
  // 1. 链接：课文之间的 .md 链接 → 站内路由；实验代码 → GitHub；外链新窗口
  for (const a of $$("a[href]", root)) {
    const href = a.getAttribute("href");
    const lesson = href.match(/^(?:\.\/)?(\d\d-[\w-]+)\.md(?:#.*)?$/);
    if (lesson) { a.setAttribute("href", `#/${lesson[1]}`); continue; }
    if (href.startsWith("../")) {
      const path = href.slice(3);
      a.setAttribute("href", `${REPO}/${path.endsWith("/") ? "tree" : "blob"}/main/${path}`);
    }
    if (/^https?:/.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
  }
  // 2. 代码块：mermaid → 图；其余高亮
  for (const code of $$("pre > code", root)) {
    const lang = (code.className.match(/language-([\w-]+)/) || [])[1];
    const pre = code.parentElement;
    if (lang === "mermaid") {
      const wrap = document.createElement("div");
      wrap.className = "mermaid-wrap";
      const div = document.createElement("div");
      div.className = "mermaid";
      div.textContent = code.textContent;
      wrap.appendChild(div);
      wrap.addEventListener("click", () => wrap.classList.toggle("zoom"));
      pre.replaceWith(wrap);
      continue;
    }
    if (lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
    else code.classList.add("hljs");
  }
  // 3. 引用块：寓言卡片、本课目标
  for (const bq of $$("blockquote", root)) {
    const first = bq.firstElementChild;
    const text = first ? first.textContent.trim() : "";
    if (text.startsWith("📜")) bq.classList.add("fable");
    else if (text.includes("本课目标")) bq.classList.add("goals");
  }
  // 4. 折叠块：揭晓、参考答案
  for (const d of $$("details", root)) {
    const s = $("summary", d);
    const t = s ? s.textContent : "";
    if (t.includes("揭晓")) d.classList.add("reveal");
    else if (t.includes("参考答案") || t.includes("答案")) d.classList.add("answer");
  }
  // 5. 表格横向滚动
  for (const table of $$("table", root)) {
    if (table.parentElement.classList.contains("table-wrap")) continue;
    const w = document.createElement("div");
    w.className = "table-wrap";
    table.replaceWith(w);
    w.appendChild(table);
  }
  // 6. 脚注上标：点击滚动到出处并闪一下
  for (const a of $$("sup.fn a", root)) {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const li = $$(".footnotes li", root)[Number(a.dataset.fn) - 1];
      if (!li) return;
      li.scrollIntoView({ behavior: "smooth", block: "center" });
      li.classList.add("flash");
      setTimeout(() => li.classList.remove("flash"), 1600);
    });
  }
  // 7. 模拟器
  for (const el of $$(".sim[data-sim]", root)) {
    try { mountSim(el, el.dataset.sim); }
    catch (err) { el.textContent = `模拟器加载失败：${err.message}`; console.error(err); }
  }
}

function buildToc(root) {
  const hs = $$("h2", root);
  hs.forEach((h, i) => { h.id = `sec-${i + 1}`; });
  const toc = $("#toc");
  toc.innerHTML = hs.length ? `<b>本页目录</b>${hs.map((h) => `<a href="#" data-target="${h.id}">${esc(h.textContent)}</a>`).join("")}` : "";
  for (const a of $$("a[data-target]", toc)) {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function buildFoot(lesson) {
  const i = LESSONS.indexOf(lesson);
  const prev = LESSONS[i - 1];
  const next = LESSONS[i + 1];
  const done = doneSet();
  const foot = $("#lesson-foot");
  foot.innerHTML = `
    ${prev ? `<a role="button" class="secondary outline" href="#/${prev.id}">← ${prev.num} ${esc(prev.title)}</a>` : "<span></span>"}
    <button id="mark-done" class="${done.has(lesson.id) ? "secondary" : ""}">${done.has(lesson.id) ? "✔ 已学完（点击取消）" : "标记为已学完"}</button>
    ${next ? `<a role="button" href="#/${next.id}">${next.num} ${esc(next.title)} →</a>` : "<span>🎉 全部课程结束</span>"}`;
  $("#mark-done").addEventListener("click", () => {
    const set = doneSet();
    if (set.has(lesson.id)) set.delete(lesson.id); else set.add(lesson.id);
    saveDone(set);
    buildNav(lesson.id);
    buildFoot(lesson);
  });
}

async function renderMermaid(root) {
  const nodes = $$(".mermaid", root);
  if (!nodes.length) return;
  if (document.fonts?.ready) await document.fonts.ready;
  for (const node of nodes) {
    const src = node.textContent;
    try {
      await mermaid.run({ nodes: [node] });
    } catch (err) {
      console.error(err);
      node.innerHTML = `<p style="color:#c92a2a">图表渲染失败，下面是图的源码：</p><pre style="text-align:left">${esc(src)}</pre>`;
    }
  }
}

async function show() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || LESSONS[0].id;
  const lesson = LESSONS.find((l) => l.id === id) || LESSONS[0];
  const content = $("#content");
  buildNav(lesson.id);
  content.innerHTML = '<p class="loading">正在加载课程……</p>';
  document.title = `${lesson.num} · ${lesson.title} · pi-durable 中文教程`;
  let md;
  try {
    const res = await fetch(`course/${lesson.id}.md`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    md = await res.text();
  } catch (err) {
    content.innerHTML = `<h2>课文加载失败</h2><p>${esc(String(err.message || err))}</p>
      <p>如果你是双击打开的 <code>index.html</code>（地址以 <code>file://</code> 开头），浏览器会禁止读取本地文件。请在仓库目录运行：</p>
      <pre><code>python3 -m http.server 8000</code></pre><p>然后访问 <code>http://localhost:8000</code>。</p>`;
    return;
  }
  content.innerHTML = marked.parse(preprocessFootnotes(md));
  decorate(content);
  buildToc(content);
  buildFoot(lesson);
  window.scrollTo({ top: 0 });
  const mobileNav = $(".mobile-nav");
  if (mobileNav && window.matchMedia("(max-width: 860px)").matches) mobileNav.open = false;
  await renderMermaid(content);
}

window.addEventListener("hashchange", show);
show();

// 用 70 行写一个“玩具版 pi-durable”，只保留三个核心想法：
//   1) 只有一条写入线：所有状态变化都追加到同一个日志文件（commit）。
//   2) 任务 = 状态机 + 检查点：每一步结束就把“下一步是什么”提交下来。
//   3) 效果三明治：先提交意图 → 再做外部副作用 → 再提交结果。重开时看到“只有意图”，就按 replay 策略处理。
// 运行：node 10-mini-durable.ts crash   （做到一半崩溃）
//       node 10-mini-durable.ts         （重开，恢复）
import { appendFileSync, existsSync, readFileSync, rmSync } from "node:fs";

const LOG = "./mini.log";
type Step = { name: string; replay: "safe" | "unsafe"; run: () => string };
type Rec =
  | { type: "intent"; step: number }                 // 意图：我要开始做第 step 步了
  | { type: "outcome"; step: number; result: string } // 结果：第 step 步做完了
  | { type: "interrupted"; step: number };           // 恢复时发现：做了一半，不敢重来

const commit = (r: Rec) => appendFileSync(LOG, JSON.stringify(r) + "\n"); // 一行 = 一次原子提交（玩具版）
const load = (): Rec[] => (existsSync(LOG) ? readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

const steps: Step[] = [
  { name: "搅拌", replay: "safe", run: () => "搅匀了" },
  { name: "放盐", replay: "unsafe", run: () => "放了一勺盐" },
  { name: "尝味", replay: "safe", run: () => "咸淡正好" },
];

const crashAt = process.argv[2] === "crash" ? 1 : -1;
if (process.argv[2] === "crash") rmSync(LOG, { force: true });

// —— 恢复：从日志重建“我做到哪了” ——
const log = load();
const done = new Map<number, string>();
let dangling: number | undefined;
for (const r of log) {
  if (r.type === "intent") dangling = r.step;
  if (r.type === "outcome") { done.set(r.step, r.result); dangling = undefined; }
  if (r.type === "interrupted") { done.set(r.step, "⚠️ 可能做过了，等人确认"); dangling = undefined; }
}
if (dangling !== undefined) {
  const s = steps[dangling];
  console.log(`恢复：第 ${dangling} 步「${s.name}」只有意图没有结果`);
  if (s.replay === "safe") console.log("  → replay=safe，重做一遍无妨");
  else { commit({ type: "interrupted", step: dangling }); done.set(dangling, "⚠️ 可能做过了，等人确认"); console.log("  → replay=unsafe，不重做，记为 interrupted"); }
}

// —— 执行：效果三明治 ——
for (let i = 0; i < steps.length; i++) {
  if (done.has(i)) { console.log(`跳过第 ${i} 步「${steps[i].name}」：${done.get(i)}`); continue; }
  commit({ type: "intent", step: i });                 // ① 先记一笔
  const result = steps[i].run();                        // ② 再动手（外部副作用）
  console.log(`做第 ${i} 步「${steps[i].name}」：${result}`);
  if (i === crashAt) { console.log("💥 停电！（结果还没记下）"); process.exit(1); }
  commit({ type: "outcome", step: i, result });         // ③ 再记结果
}
console.log("日志：\n" + readFileSync(LOG, "utf8"));

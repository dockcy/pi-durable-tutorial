// 一个自定义持久任务：抄写 5 页经文，每抄完一页就存一次检查点。
// 第一次运行在第 3 页抄到一半时崩溃；第二次运行从第 3 页接着抄，而不是从头再来。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { createRegistry, defineExtension, defineTask, Harness, type TaskId } from "@earendil-works/pi-durable";
import { rmSync } from "node:fs";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";

const context = BACKGROUND_CONTEXT;
const crash = (process.argv[2] ?? "first") === "first";

type Input = { pages: number };
type State = { phase: "copy"; page: number } | { phase: "bind"; copied: number };

const CopySutra = defineTask<Input, State, string>({
  name: "temple.copy-sutra",
  version: 1,
  initial: () => ({ phase: "copy", page: 1 }),
  phases: {
    copy: async (task, runtime, ctx) => {
      const { page } = task.state.checkpoint;
      console.log(`  ✍️  抄第 ${page} 页`);
      if (crash && page === 3) { console.log("  💥 抄到一半，蜡烛灭了（进程崩溃）"); process.exit(1); }
      const next: State = page < task.input.pages ? { phase: "copy", page: page + 1 } : { phase: "bind", copied: page };
      // 一次提交 = 一个检查点。提交之前崩溃，这一页会重抄；提交之后崩溃，从下一页开始。
      await runtime.commit(() => ({ status: "running", checkpoint: next }), ctx);
    },
    bind: async (task, runtime, ctx) => {
      console.log(`  📚 装订 ${task.state.checkpoint.copied} 页`);
      await runtime.commit(() => ({ status: "terminal", outcome: { status: "completed", result: "经书抄好了" } }), ctx);
    },
  },
  abort: (_task, runtime, ctx) => runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), ctx),
});

const registry = createRegistry();
registry.install(defineExtension({ name: "temple", tasks: [CopySutra] }));
if (crash) for (const suffix of ["", "-wal", "-shm"]) rmSync(`./sutra.sqlite${suffix}`, { force: true }); // 第一次运行从空库开始
const harness = await Harness.open(await openNodeSqliteStorage("./sutra.sqlite"), { models: createModels(), registry }, context);
const root = await harness.root(context);

let id: TaskId<string>;
if (crash) {
  id = await root.commit((tx) => tx.createTask(CopySutra, { pages: 5 }, { ownership: { kind: "conversation" } }), context);
  console.log("第一次运行");
} else {
  const live = await harness.inspect(context);
  id = live.tasks.find((t) => t.record.kind === "temple.copy-sutra")!.record.id as TaskId<string>;
  console.log("第二次运行：存储里的检查点 =", JSON.stringify(live.tasks.find((t) => t.record.id === id)!.record.state));
}
harness.resume();
const done = await harness.waitForTask(id, context);
console.log("结果：", JSON.stringify(done.state.outcome));
await harness.close(context);

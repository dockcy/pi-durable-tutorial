// 睡眠与唤醒：任务在一个阶段的末尾“睡下”，睡眠本身被存下来，到点后从检查点继续。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { createRegistry, defineExtension, defineTask, Harness, MemoryStorage } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const t0 = Date.now();
const at = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
const WakeUp = defineTask<{ at: number }, { phase: "wait" } | { phase: "knock" }, null>({
  name: "inn.wake-up", version: 1,
  initial: () => ({ phase: "wait" }),
  phases: {
    wait: (task, runtime, ctx) => { console.log(`  [${at()}] 挂上叫早牌，睡下`); return runtime.sleepUntil(task.input.at, { phase: "knock" }, ctx); },
    knock: async (_task, runtime, ctx) => {
      console.log(`  [${at()}] 咚咚咚，客官该起了`);
      await runtime.commit(() => ({ status: "terminal", outcome: { status: "completed", result: null } }), ctx);
    },
  },
  abort: (_t, runtime, ctx) => runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), ctx),
});
const registry = createRegistry();
registry.install(defineExtension({ name: "inn", tasks: [WakeUp] }));
const harness = await Harness.open(new MemoryStorage(), { models: createModels(), registry }, context);
const root = await harness.root(context);
const id = await root.commit((tx) => tx.createTask(WakeUp, { at: Date.now() + 1000 }, { ownership: { kind: "conversation" } }), context);
harness.resume();
setTimeout(async () => {
  const t = (await harness.inspect(context)).tasks.find((x) => x.record.id === id);
  console.log(`  [${at()}] 睡着时的记录：`, JSON.stringify(t?.record.state).slice(0, 90));
}, 400);
await harness.waitForTask(id, context);
await harness.close(context);

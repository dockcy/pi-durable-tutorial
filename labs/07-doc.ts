// 文档（Document）：和对话记录放在一起、跟着同一次提交一起落盘的“小黑板”。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { createRegistry, defineDoc, Harness, MemoryStorage } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const Todos = defineDoc<{ items: string[] }>({
  kind: "app.todos", version: 1, scope: "conversation", history: "latest", fork: "initial",
  initial: () => ({ items: [] }),
  checkpointWhen: () => false,
});
const harness = await Harness.open(new MemoryStorage(), { models: createModels(), registry: createRegistry() }, context);
const root = await harness.root(context);

await root.commit(async (tx) => { (await tx.doc(Todos, root.id)).items.push("买菜"); }, context);
try {
  await root.commit(async (tx) => {
    (await tx.doc(Todos, root.id)).items.push("洗碗");
    throw new Error("提交回调里抛错");          // 整个提交回滚：“洗碗”不会出现
  }, context);
} catch (e) { console.log("  回滚：", (e as Error).message); }
console.log("  黑板上：", JSON.stringify(await harness.snapshot(Todos, root.id, context)));
await harness.close(context);

// Chord Context：取消“等待”，不会取消“工作”。
// 你在外卖 App 上点了“不等了”，厨房并不会因此停火。
import { BACKGROUND_CONTEXT, withCancel } from "@earendil-works/chord/context";
import { Type } from "@earendil-works/pi-ai";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { createRegistry, defineExtension, defineTool, Harness, MemoryStorage } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const stew = defineTool({
  name: "stew", description: "慢炖一锅汤", parameters: Type.Object({}),
  execute: async () => { await new Promise((r) => setTimeout(r, 500)); console.log("  🍲 汤炖好了（工具照常跑完）"); return { output: [{ type: "text", text: "汤好了" }] }; },
});
const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
faux.setResponses([fauxAssistantMessage(fauxToolCall("stew", {}), { stopReason: "toolUse" }), fauxAssistantMessage("您的汤到了。")]);
const registry = createRegistry();
registry.install(defineExtension({ name: "kitchen", tools: [stew] }));
const harness = await Harness.open(new MemoryStorage(), { models, registry }, context);
const root = await harness.root(context, { agent: { model: { provider: "faux", modelId: "faux-1" } } });

const order = await root.submit({ type: "input", content: "来碗汤" }, context);
const impatient = withCancel(context);
setTimeout(() => impatient.cancel(new Error("不等了")), 100);
try {
  await order.wait(impatient.context);
} catch (error) {
  console.log("  🙅 等待被取消：", (error as Error).message ?? String(error));
}
const settled = await order.wait(context); // 换一个不会取消的 Context 再等一次
console.log("  ✅ 提交最终状态：", settled.status);
await harness.close(context);

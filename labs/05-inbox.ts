// 收件箱：对话忙的时候再提交，steer 插进当前这一轮工具之后，follow-up 排到这次回答之后。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { Type } from "@earendil-works/pi-ai";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { createRegistry, defineExtension, defineTool, Harness, MemoryStorage } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const cook = defineTool({
  name: "cook", description: "做一道菜", parameters: Type.Object({ dish: Type.String() }),
  execute: async (args) => { await new Promise((r) => setTimeout(r, 300)); return { output: [{ type: "text", text: `${args.dish} 做好了` }] }; },
});
const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
faux.setResponses([
  fauxAssistantMessage(fauxToolCall("cook", { dish: "宫保鸡丁" }), { stopReason: "toolUse" }), // 第 1 轮：调用工具
  fauxAssistantMessage("宫保鸡丁上桌，已按要求少放辣。"),                                  // 第 2 轮：看到 steer 后作答
  fauxAssistantMessage("米饭马上来。"),                                                    // follow-up 开启的新一次 run
]);
const registry = createRegistry();
registry.install(defineExtension({ name: "kitchen", tools: [cook] }));
const harness = await Harness.open(new MemoryStorage(), { models, registry }, context);
const root = await harness.root(context, { agent: { model: { provider: "faux", modelId: "faux-1" } } });

const order = await root.submit({ type: "input", content: "来一份宫保鸡丁" }, context);
await new Promise((r) => setTimeout(r, 100)); // 厨房正在炒菜（工具在跑）
const steer = await root.submit({ type: "input", content: "少放辣！", whenBusy: "steer" }, context);
const follow = await root.submit({ type: "input", content: "再来碗米饭" }, context); // 默认 followUp
const watch = await root.watch(context); // 拿一份当前的结构化视图
const inbox = watch.value.docs["pi.inbox"] as { items: { mode: string }[] } | undefined; // 文档在视图里是普通 JSON
console.log("收件箱里排着：", inbox?.items.map((i) => i.mode).join(", "));
await watch.stop();
await follow.wait(context);
const page = await root.entries({}, 20, undefined, context);
for (const e of [...page.items].reverse()) {
  const m: any = e.model?.[0];
  console.log(" ", e.kind.padEnd(15), m?.content?.map?.((c: any) => c.text ?? `[call ${c.name}]`).join("") ?? m?.content ?? "");
}
await harness.close(context);

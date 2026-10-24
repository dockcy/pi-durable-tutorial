// 钩子（Hook）：扩展在内置任务的关键点上“拦一下”。这里 beforeTool 拦下危险命令。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { Type } from "@earendil-works/pi-ai";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { createRegistry, defineExtension, defineTool, Harness, hook, MemoryStorage, ToolTask } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const shell = defineTool({
  name: "shell", description: "运行命令", parameters: Type.Object({ cmd: Type.String() }),
  execute: async (args) => ({ output: [{ type: "text", text: `ran: ${args.cmd}` }] }),
});
const Guard = defineExtension({
  name: "guard",
  hooks: [hook(ToolTask, { beforeTool: (call) => (String((call.arguments as any).cmd).includes("rm -rf") ? { block: "门房：这条命令需要人工批准" } : undefined) })],
});
const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
faux.setResponses([
  fauxAssistantMessage([fauxToolCall("shell", { cmd: "ls" }), fauxToolCall("shell", { cmd: "rm -rf /" })], { stopReason: "toolUse" }),
  fauxAssistantMessage("ls 跑了；rm -rf 被拦下了。"),
]);
const registry = createRegistry();
registry.install(defineExtension({ name: "ops", tools: [shell] }));
registry.install(Guard);
const harness = await Harness.open(new MemoryStorage(), { models, registry }, context);
const root = await harness.root(context, { agent: { model: { provider: "faux", modelId: "faux-1" } } });
await (await root.submit({ type: "input", content: "清理一下" }, context)).wait(context);
const page = await root.entries({}, 20, undefined, context);
for (const e of [...page.items].reverse()) {
  const m: any = e.model?.[0];
  if (m?.role === "toolResult") console.log(" ", m.isError ? "❌" : "✅", m.content.map((c: any) => c.text).join(""));
}
await harness.close(context);

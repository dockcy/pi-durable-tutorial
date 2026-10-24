// 第一次运行：工具执行到一半，进程被"拔电源"（process.exit）。
// 第二次运行：重新打开同一个 SQLite 文件，resume()，看两种工具各自怎么收场。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { Type } from "@earendil-works/pi-ai";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { createRegistry, defineExtension, defineTool, Harness } from "@earendil-works/pi-durable";
import { rmSync } from "node:fs";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";

const context = BACKGROUND_CONTEXT;
const phase = process.argv[2] ?? "first";
const crash = phase === "first";

const search = defineTool({
  name: "search", description: "只读查询，重跑无害", parameters: Type.Object({ q: Type.String() }),
  replay: "safe",
  execute: async (args, api) => {
    api.output(`searching ${args.q}...\n`);
    if (crash) { await new Promise((r) => setTimeout(r, 200)); console.log("💥 search 执行到一半，进程崩溃"); process.exit(1); }
    return { output: [{ type: "text", text: `found 3 results for ${args.q}` }] };
  },
});
const deploy = defineTool({
  name: "deploy", description: "有副作用，不能重跑", parameters: Type.Object({ v: Type.String() }),
  execute: async (args) => {
    await new Promise((r) => setTimeout(r, 400));
    return { output: [{ type: "text", text: `deployed ${args.v}` }] };
  },
});

const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
// 假模型：第一次运行先发出两个工具调用；第二次运行只需要给出最终回答。
faux.setResponses(crash
  ? [fauxAssistantMessage([fauxToolCall("search", { q: "flaky test" }), fauxToolCall("deploy", { v: "1.2.3" })], { stopReason: "toolUse" })]
  : [fauxAssistantMessage("search 重跑成功；deploy 被中断，我不会自动重发，请确认后再部署。")]);
const registry = createRegistry();
registry.install(defineExtension({ name: "ops", tools: [search, deploy] }));

if (crash) for (const suffix of ["", "-wal", "-shm"]) rmSync(`./crash.sqlite${suffix}`, { force: true }); // 第一次运行从空库开始
const harness = await Harness.open(await openNodeSqliteStorage("./crash.sqlite"), { models, registry, settings: { toolExecution: "parallel" } }, context);
const root = await harness.root(context, { agent: { model: { provider: "faux", modelId: "faux-1" } } });
harness.resume();
const job = { type: "input", content: "查一下再发布", requestId: "job-42" } as const;
const submission = await root.submit(job, context);
const settled = await submission.wait(context);
console.log("submission:", settled.status);
const page = await root.entries({}, 20, undefined, context);
for (const e of [...page.items].reverse()) {
  const m: any = e.model?.[0];
  const text = m?.content?.map?.((c: any) => c.text ?? (c.type === "toolCall" ? `[call ${c.name}]` : "")).join("") ?? "";
  console.log(" ", e.kind.padEnd(16), m?.role === "toolResult" ? `${m.toolName}${m.isError ? " ❌" : " ✅"} ${text}` : text);
}
await harness.close(context);

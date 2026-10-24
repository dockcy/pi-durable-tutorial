import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai/providers/faux";
import { AssistantEntry, createRegistry, Harness, MemoryStorage } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
faux.setResponses([fauxAssistantMessage("巴黎。")]);

const harness = await Harness.open(new MemoryStorage(), { models, registry: createRegistry() }, context);
const root = await harness.root(context, { agent: { model: { provider: "faux", modelId: "faux-1" } } });
const submission = await root.submit({ type: "input", content: "法国首都是？", requestId: "q-1" }, context);
const again = await root.submit({ type: "input", content: "法国首都是？", requestId: "q-1" }, context);
console.log("same submission:", submission.id === again.id);
const settled = await submission.wait(context);
if (settled.status === "done" && settled.type === "input") {
  const entry = await root.commit((tx) => tx.entry(AssistantEntry, settled.answer), context);
  const msg = entry?.model?.[0];
  console.log("answer:", msg && msg.role === "assistant" ? JSON.stringify(msg.content) : msg);
}
const page = await root.entries({}, 10, undefined, context);
console.log("kinds:", [...page.items].reverse().map((e) => e.kind));
await harness.close(context);

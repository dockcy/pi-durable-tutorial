// 04 的改进版（补偿 / saga）：failFast 只会中止“还没结束”的兄弟任务；已经扣款成功的那一笔，要由父任务在 decide 阶段自己退款。
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { createRegistry, defineExtension, defineTask, Harness, MemoryStorage, type TaskId } from "@earendil-works/pi-durable";

const context = BACKGROUND_CONTEXT;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const bank = {
  async charge(card: string, key: string) {
    await sleep(card === "visa" ? 50 : card === "amex" ? 100 : 300);
    console.log(`  💳 扣款 ${card} (${key})`);
    return card === "amex" ? { ok: false as const, error: "卡被拒" } : { ok: true as const, receipt: `rcpt-${card}` };
  },
  async refund(key: string) { console.log(`  ↩️  退款 ${key}`); },
};

const Payment = defineTask<{ card: string }, { phase: "charge" }, string>({
  name: "shop.payment", version: 1,
  initial: () => ({ phase: "charge" }),
  phases: {
    charge: async (task, runtime, ctx) => {
      const charge = await bank.charge(task.input.card, `payment-${task.id}`); // 幂等键：重跑也只扣一次
      await runtime.commit(() => ({
        status: "terminal",
        outcome: charge.ok ? { status: "completed", result: charge.receipt } : { status: "failed", error: { message: charge.error } },
      }), ctx);
    },
  },
  abort: async (task, runtime, ctx) => {
    await bank.refund(`payment-${task.id}`);
    await runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), ctx);
  },
});

type CheckoutState = { phase: "pay" } | { phase: "decide"; payments: TaskId<string>[] };
const Checkout = defineTask<{ cards: string[] }, CheckoutState, string>({
  name: "shop.checkout", version: 1,
  initial: () => ({ phase: "pay" }),
  phases: {
    pay: async (task, runtime, ctx) => {
      await runtime.commit(async (tx) => {
        const payments: TaskId<string>[] = [];
        for (const card of task.input.cards) payments.push(await tx.createTask(Payment, { card }, { ownership: { kind: "task", taskId: task.id } }));
        return { status: "waiting", checkpoint: { phase: "decide", payments }, on: payments, policy: "failFast" };
      }, ctx);
    },
    decide: async (task, runtime, ctx) => {
      const outcomes = await runtime.outcomes(task.state.checkpoint.payments, ctx);
      console.log("  🧾 各笔付款：", outcomes.map((o) => o.status).join(", "));
      const paid = outcomes.every((o) => o.status === "completed");
      if (!paid) {
        // 补偿：把已经成功扣款的退掉。decide 可能因崩溃重跑，所以退款也用幂等键（同一个键银行只退一次）。
        for (const [i, o] of outcomes.entries()) if (o.status === "completed") await bank.refund(`payment-${task.state.checkpoint.payments[i]}`);
      }
      await runtime.commit(() => ({
        status: "terminal",
        outcome: paid ? { status: "completed", result: "下单成功" } : { status: "failed", error: { message: "有一笔付款失败" } },
      }), ctx);
    },
  },
  abort: (_t, runtime, ctx) => runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), ctx),
});

const registry = createRegistry();
registry.install(defineExtension({ name: "shop", tasks: [Payment, Checkout] }));
const harness = await Harness.open(new MemoryStorage(), { models: createModels(), registry }, context);
const root = await harness.root(context);
const id = await root.commit((tx) => tx.createTask(Checkout, { cards: ["visa", "amex", "master"] }, { ownership: { kind: "conversation" } }), context);
harness.resume();
const { state } = await harness.waitForTask(id, context);
console.log("结账结果：", JSON.stringify(state.outcome));
await harness.close(context);

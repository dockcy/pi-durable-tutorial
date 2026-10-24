# 22 · 语法课：TypeBox——海关申报单　语法

> **本课目标**：理解为什么工具参数要用 `Type.Object(...)` 写，而不是普通的 TypeScript 类型。　**预计时间**：15 分钟

## 1. 寓言：海关申报单

> 📜 **寓言 · 海关申报单**
>
> 港口的海关每天要验成千上万个旅客的箱子。旅客来自四面八方，箱子里装什么、写的单子靠不靠谱，谁也说不准。
>
> 海关用的是一张印好的**申报单**：第一栏“姓名”，必须是文字；第二栏“现金”，必须是数字；第三栏“是否携带动植物”，只能勾“是”或“否”。
>
> 这张单子有两个用处。船还没靠岸，乘务员就把空白单发给旅客，旅客照着栏目填写，知道该交代什么。上了岸，海关官员拿着同一张单子的样本，一栏一栏地核对箱子：现金那栏写着“很多”？退回重填。多出一栏没人认识的？退回重填。
>
> 有个旅客嫌麻烦：“我在船上已经跟船长口头说好了箱子里有什么，还填什么单子？”官员笑了：“船长说过的话，下了船就没了。**能拿到岸上来对的，只有这张纸。**”
>
> 后来港口来了一位新官员，看不懂外文，但他照样能验——因为单子的格式，全世界的港口都认。

<details>
<summary>🔍 揭晓：故事里的东西分别是什么？</summary>

| 故事里 | 代码里 |
|---|---|
| 来路不明的箱子 | 模型生成的工具调用参数（一段 JSON），可能缺字段、类型错 |
| 印好的申报单 | **TypeBox 结构**：`Type.Object({ q: Type.String() })` |
| 船上发给旅客照着填 | 这份结构以 JSON Schema 的形式发给**模型**，告诉它参数长什么样 |
| 岸上一栏栏核对 | 运行底座在 `execute()` 之前用它**运行时校验**参数 |
| 退回重填 | 参数不合法 → 一条“参数无效”的错误结果，模型可以改了再调 |
| 船长的口头约定，下船就没了 | TypeScript 的类型**编译后会被抹掉**，运行时不存在 |
| 全世界港口都认的格式 | JSON Schema 是通用标准，各家模型服务都认 |

</details>

## 2. 拆开看

### 2.1 一份结构，三种用途

```ts
import { Type, type Static } from "@earendil-works/pi-ai";   // pi-ai 重新导出了 TypeBox

const 参数结构 = Type.Object({
  q: Type.String({ description: "搜索关键词" }),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50 })),
});
type 参数 = Static<typeof 参数结构>;   // ① 给开发者的 TS 类型：{ q: string; limit?: number }
// ② 发给模型的 JSON Schema：参数结构本身就是一个 JSON Schema 对象
// ③ 运行时校验：工具任务在 call 阶段用它检查模型给的参数
```

### 2.2 在工具里

```ts
const search = defineTool({
  name: "search",
  description: "只读查询",
  parameters: Type.Object({ q: Type.String() }),   // 一份结构
  execute: async (args) => {                        // args 推断为 { q: string }（第 21 课）
    return { output: [{ type: "text", text: `找到关于 ${args.q} 的结果` }] };
  },
});
```

第 3 课的 `call` 阶段源码里有这几行：先 `prepare`、`validate` 参数，校验失败就直接写一条错误结果；钩子改过参数后**再校验一次**——因为钩子也可能改出不合法的参数。

```ts
const checked = "error" in prepared ? prepared : validate(tool, call, prepared.args);
if ("error" in checked) return settle(…, () => invalid(checked.error), context);
// …beforeTool 钩子…
const validated = validate(tool, call, args);   // 钩子之后再校验一次
```

### 2.3 结构化输出也一样

工具声明 `structuredOutputSchema` 后，返回的 `structuredOutput` 也会被校验；不合法的话，对嵌套调用者是一条带 `invalid_structured_output` 诊断的错误结果（第 10 课）。

> 💡 代价：包的根入口会加载 TypeBox，未打包时峰值内存大约多 23 MB，摇树打包后约 4 MB。[^storage]

## 3. 思考题

1. 为什么 pi-durable 在 `beforeTool` 钩子改过参数之后，还要**再校验一次**？

<details><summary>参考答案</summary>

钩子也是代码，也可能把参数改坏（比如删掉了必填字段）。校验放在“真正执行之前的最后一步”，才能保证进入 `execute` 的参数一定符合结构。

</details>

2. 如果不用 TypeBox，而是分别手写 TS 类型、JSON Schema 和校验函数，最容易出什么问题？

<details><summary>参考答案</summary>

三份东西会慢慢“对不上”：改了 TS 类型忘了改 Schema，模型就会按旧格式给参数；改了 Schema 忘了改校验，坏参数就会漏进来。一份结构三种用途，就是为了让它们永远一致。

</details>

## 小结

**口头说好的，下了船就没了；能拿到岸上来对的，只有那张纸。**

[^storage]: 官方说明“存储”一节末尾：<https://github.com/earendil-works/pi/blob/136b87e8a7f5a3e5186de0289523ba327dc592fc/packages/durable/README.md#storage>

# 21 · 语法课：泛型——糕点模具　语法

> **本课目标**：看懂 `defineTask<I, S, R>`、`S extends { phase: string }`、`H extends object = object`、`TaskId<R>`，以及为什么 `defineTool` 不用写尖括号。　**预计时间**：20 分钟

## 1. 寓言：糕点模具

> 📜 **寓言 · 糕点模具**
>
> 老街上有位做模具的老师傅。别人的模具一套只能做一种点心，他的模具却有点怪：一个木框，侧面开着三个空槽，槽口分别刻着“馅”“花”“盒”。
>
> 客人来订：“我要做豆沙月饼，桃花纹，装六寸盒。”老师傅就往三个槽里各插一块板：豆沙馅的托盘、桃花纹的印板、六寸的出模口。插好以后，整套模具就**只认这一种**了：往里放莲蓉，托盘对不上；出来的饼，正好装进六寸盒，一丝不差。
>
> 也有规矩：花纹板必须带一圈边框，没边框的板子插不进去。有的客人不在乎包装，“盒”那个槽就插一块老师傅预先备好的普通板。
>
> 熟客更省事。他把一筐豆沙往桌上一放，老师傅看一眼筐，就知道“馅”槽该插哪块板，不用他开口。
>
> 每块做出来的饼，底下都会压一个小小的印记，写着它是哪套模具出的。掌柜收货时只看印记，就知道该往哪个盒子里装。
>
> 徒弟问：为什么不干脆给每种点心各做一套模具？老师傅说：“**框是同一个框，规矩是同一套规矩。变的只有那三块板——插板的时候说清楚，后面就一步都不会错。**”

<details>
<summary>🔍 揭晓：故事里的东西分别是什么？</summary>

| 故事里 | TypeScript 里 |
|---|---|
| 有三个空槽的模具框 | 带**类型参数**的泛型函数：`defineTask<I, S, R>` |
| 插三块板 | 使用时**填入类型**：`defineTask<{ pages: number }, 状态, string>` |
| 插好后只认这一种 | 填好后，`input`、`checkpoint`、`result` 处处类型一致 |
| 花纹板必须带边框 | **约束**：`S extends { phase: string }`，状态必须有 `phase` |
| 预先备好的普通板 | **默认类型参数**：`H extends object = object` |
| 看一眼筐就知道插哪块 | **类型推断**：`defineTool` 从 `parameters` 推出 `args` 的类型，不用写尖括号 |
| 饼底的印记 | **带标记的 ID**：`TaskId<R>` 记着这个任务的结果类型 |

</details>

## 2. 拆开看

### 2.1 三个类型参数

```ts
export function defineTask<I, S extends { phase: string }, R, H extends object = object>(
  definition: TaskDefinition<I, S, R, H>,
): Task<I, S, R, H> {
  return { definition };
}
```

👉 [`src/tasks.ts`](https://github.com/earendil-works/pi/blob/136b87e8a7f5a3e5186de0289523ba327dc592fc/packages/durable/src/tasks.ts#L4)

| 参数 | 含义 | 抄经例子 |
|---|---|---|
| `I` | 输入 Input | `{ pages: number }` |
| `S` | 状态 State（检查点），**必须有 `phase`** | `{ phase: "copy"; page } \| { phase: "bind"; copied }` |
| `R` | 结果 Result | `string` |
| `H` | 钩子 Hooks，可不填 | 默认 `object` |

注意函数体只有一行 `return { definition }`——**运行时它什么也不做**，全部价值都在类型检查上。`defineTool`、`defineExtension` 也一样，源码注释直接写着“给工具定类型的恒等函数”。

### 2.2 推断：为什么 `defineTool` 不用写尖括号

```ts
export function defineTool<TParameters extends TSchema, TDetails extends JsonValue = JsonValue>(
  tool: ToolRegistration<TParameters, TDetails>,
) { return tool; }

defineTool({
  parameters: Type.Object({ q: Type.String() }),   // TS 从这里推断出 TParameters
  execute: async (args) => args.q.toUpperCase(),    // args 自动是 { q: string }
});
```

### 2.3 带标记的 ID：`TaskId<R>`

```ts
export type Id<Kind extends string, Type = unknown> = number & {
  readonly [idBrand]: { readonly kind: Kind; readonly type: Type };
};
export type TaskId<Result = unknown> = Id<"task", Result>;
```

👉 [`src/types.ts` 第 21 行](https://github.com/earendil-works/pi/blob/136b87e8a7f5a3e5186de0289523ba327dc592fc/packages/durable/src/types.ts#L21)

运行时它就是一个**数字**；类型上却带着一个只有编译器看得见的“印记”：

- `TaskId` 和 `EntryId` 不能混用（kind 不同）；
- `harness.waitForTask(id)` 拿到的结局里，`result` 自动是 `R` 类型——第 12 课的 `TaskId<string>[]` 就是这么来的。

## 3. 思考题

1. `defineTask` 的函数体只有一行 `return { definition }`，运行时什么也没做。那它存在的意义是什么？

<details><summary>参考答案</summary>

意义全在类型检查上：它把你写的定义“套进模具”，让 TS 推断出 `I`、`S`、`R`，并检查 `phases` 是否齐全、每个处理函数的参数类型对不对。运行时零开销，编译时帮你挡错误。

</details>

2. 运行时 `TaskId` 和 `EntryId` 都只是数字。那为什么把一个 `EntryId` 传给 `waitForTask` 会编译报错？

<details><summary>参考答案</summary>

因为它们在类型上带着不同的“印记”（`kind` 分别是 `"task"` 和 `"entry"`），只有编译器看得见。数字一样、印记不同，TS 就不让你混用——把运行时分不清的错误提前到编译时。

</details>

## 小结

**框是同一个框，变的只有那几块板；插板时说清楚，后面就一步都不会错。**

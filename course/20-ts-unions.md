# 20 · 语法课：可辨识联合类型——邮局的分拣格　语法

> **本课目标**：看懂 pi-durable 里满天飞的 `{ phase: "…" } | { phase: "…" }`、`status === "done"`、`[P in S["phase"]]`、`Extract<…>` 和 `as const`。　**预计时间**：20 分钟

## 1. 寓言：邮局的分拣格

> 📜 **寓言 · 邮局的分拣格**
>
> 小镇邮局每天收进成百上千件邮件：有信件，有包裹，有汇款单。它们大小不一，里面装的东西五花八门。
>
> 老邮差分拣起来却快得惊人。他从不拆开看，只看每件邮件右上角贴的那张**彩色小签**：白签是信件，黄签是包裹，红签是汇款单。看到白签，他就知道里面一定有“收信地址”；看到黄签，就知道一定有“重量”可以称；看到红签，就知道一定有“金额”要核对。签是什么颜色，里面就一定有那几样东西，**不多也不少**。
>
> 有一天邮局开始收电报，贴蓝签。局长没急着开张，先把分拣架拿来查了一遍：架子上只有白、黄、红三个格子，没有蓝格子。“格子没做好，电报不许收。”直到木匠钉好了蓝格子，邮局才挂出“受理电报”的牌子。
>
> 新来的学徒问老邮差，凭什么一张小签就敢断定里面有什么。老邮差说：“因为邮局有规矩：<strong>贴什么签，就得装什么东西。</strong>你只要认得签，就不用拆包。”

<details>
<summary>🔍 揭晓：故事里的东西分别是什么？</summary>

| 故事里 | TypeScript 里 |
|---|---|
| 各种邮件 | 一个**联合类型**：`A \| B \| C` |
| 彩色小签 | **可辨识字段**（判别字段）：pi-durable 里常用 `phase`、`status`、`type`、`kind` |
| 看签就知道里面有什么 | **类型收窄**：判断 `x.status === "done"` 之后，TS 知道 `x` 一定有 `answer` |
| 分拣架的格子 | 映射类型 `{ [P in S["phase"]]: … }`：每种签一个格子 |
| 没有蓝格子不许收电报 | 漏写了某个 `phase` 的处理函数 → **编译报错** |

</details>

## 2. 拆开看

### 2.1 联合 + 判别字段

```ts
type 状态 =
  | { phase: "copy"; page: number }      // 白签：一定有 page
  | { phase: "bind"; copied: number };   // 黄签：一定有 copied
```

`phase` 的类型不是 `string`，而是**字面量类型** `"copy"` 或 `"bind"`。正是这一点让 TS 能“看签断货”。

### 2.2 收窄

```ts
const settled = await submission.wait(context);
// settled 的类型：{ status: "done"; answer: EntryId } | { status: "unanswered"; reason: string; … }
if (settled.status === "done") {
  settled.answer;     // ✅ 这里 TS 知道一定有 answer
} else {
  settled.reason;     // ✅ 这里一定有 reason
}
```

### 2.3 一个都不能漏：映射类型 + Extract

pi-durable 的任务定义（`src/types.ts` 第 334 行）是这样要求 `phases` 的：

```ts
readonly phases: {
  readonly [P in S["phase"]]: PhaseHandler<I, Extract<S, { phase: P }>, S, R, H>;
};
```

一步一步读：

| 片段 | 意思 | 对 `状态` 来说 |
|---|---|---|
| `S["phase"]` | 索引访问：取出联合里所有 `phase` 的类型 | `"copy" \| "bind"` |
| `[P in …]` | 映射类型：对其中每一个，造一个属性 | 属性 `copy` 和 `bind` |
| `Extract<S, { phase: P }>` | 从联合里挑出 `phase` 是 `P` 的那一支 | `copy` 拿到 `{ phase: "copy"; page: number }` |

结果：`phases` 必须**恰好**有 `copy` 和 `bind` 两个处理函数，而且 `copy` 函数里的 `task.state.checkpoint.page` 是 `number`，不用自己再判断。少写一个，编译不过——这就是那个“没有蓝格子”。

### 2.4 `as const`：别把签洗掉

```ts
const intent = { phase: "execute", arguments: final, replay: tool.replay ?? "unsafe" } as const;
```

不加 `as const`，TS 会把 `phase` 推断成宽泛的 `string`，签就“洗掉”了，联合类型匹配不上。`as const` 让它保持字面量 `"execute"`。

### 2.5 自己写“全覆盖检查”

```ts
function 描述(o: TaskOutcome<string>): string {
  switch (o.status) {
    case "completed": return `完成：${o.result}`;
    case "failed":    return `失败：${o.error.message}`;
    case "aborted":   return "被中止";
    case "orphaned":  return "成了孤儿";
    case "faulted":   return "故障";
    default: { const 不该到这: never = o; return 不该到这; }  // 以后多了一种状态，这里会编译报错
  }
}
```

## 3. 思考题

1. 下面的写法为什么编译不过？

   ```ts
   const s = { phase: "copy", page: 1 };
   const t: 状态 = s;
   ```

<details><summary>参考答案</summary>

`s` 没加 `as const` 也没写类型，TS 把 `phase` 推断成宽泛的 `string`，签被“洗掉”了，匹配不上 `"copy" | "bind"`。改成 `const s: 状态 = { phase: "copy", page: 1 }` 或加 `as const` 即可。

</details>

2. 给 `状态` 再加一支 `{ phase: "check"; ok: boolean }`，`defineTask` 的 `phases` 会发生什么？

<details><summary>参考答案</summary>

编译报错：映射类型 `[P in S["phase"]]` 现在要求 `copy`、`bind`、`check` 三个处理函数，你少写了 `check`。这正是“一个都不能漏”的好处——加了新状态，编译器逼你把它的处理函数写上。

</details>

## 小结

**贴什么签，就装什么东西；认得签，就不用拆包。**

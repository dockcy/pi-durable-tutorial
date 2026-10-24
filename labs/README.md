# 动手实验

每个脚本都在 **Node 24** 下真实跑过（Node 24 可以直接运行 `.ts` 文件，不需要编译），也都通过了 TypeScript 严格模式的类型检查。实验使用 pi-ai 自带的“假模型”（faux provider），**不需要任何 API Key，也不花钱**。

```bash
cd labs
npm install
node 01-chat.ts
```

| 脚本 | 对应课程 | 演示什么 | 怎么跑 |
|---|---|---|---|
| `01-chat.ts` | 01、04 | 一次问答；同一个请求号提交两次，拿回同一张提交单 | `node 01-chat.ts` |
| `02-crash.ts` | 03 | 工具执行到一半“拔电源”；可安全重做的重跑，不可重做的记为“被打断” | `node 02-crash.ts first` 然后 `node 02-crash.ts second` |
| `03-task.ts` | 02 | 自定义任务抄 5 页经，第 3 页崩溃，重启后从第 3 页继续 | `node 03-task.ts first` 然后 `node 03-task.ts second` |
| `04-checkout.ts` | 12 | 结账 + 3 笔付款子任务，一败俱停（failFast） | `node 04-checkout.ts` |
| `04b-saga.ts` | 12 | 改进版：父任务补偿已经成功的那笔 | `node 04b-saga.ts` |
| `05-inbox.ts` | 05、08 | 工具在跑时插话、排队追问 | `node 05-inbox.ts` |
| `06-context.ts` | 06 | 取消等待，工作照常完成 | `node 06-context.ts` |
| `07-doc.ts` | 07 | 自定义文档；提交回调抛错整次回滚 | `node 07-doc.ts` |
| `08-sleep.ts` | 13 | 任务睡 1 秒再醒来；睡着时偷看存储里的记录 | `node 08-sleep.ts` |
| `09-hook.ts` | 10 | 钩子拦下危险命令 | `node 09-hook.ts` |
| `10-mini-durable.ts` | 01–03 | **不依赖任何库**的 70 行玩具版：写入线 + 检查点 + 效果三明治 | `node 10-mini-durable.ts crash` 然后 `node 10-mini-durable.ts` |

也可以用 `npm run lab:02` 这样的快捷命令，见 `package.json`。

## 输出里的几句英文

pi-durable 自己写的错误信息是英文的，对照如下：

| 输出里的英文 | 中文意思 |
|---|---|
| `Tool deploy was interrupted and may have partially run` | 工具 deploy 被打断了，可能已经执行了一部分 |
| `Tool call blocked: …` | 工具调用被拦下：…… |
| `returned without durable progress` | 阶段返回时没有任何持久进展 |
| `submission: done` | 提交单：已完成 |
| `pi.user / pi.assistant / pi.tool-result / pi.system` | 记录条目的种类：用户消息 / 模型回复 / 工具结果 / 系统提示 |

## 清理

`02`、`03` 会在当前目录生成 `crash.sqlite`、`sutra.sqlite`，`10` 会生成 `mini.log`。每次用 `first` / `crash` 参数运行时会自动删掉旧文件，从头开始。

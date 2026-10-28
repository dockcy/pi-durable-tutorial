# 📜 pi-durable 中文教程：断电也不丢的 AI 智能体底座

用**寓言**和**交互模拟器**，一步一步读懂 [pi-durable](https://github.com/earendil-works/pi/tree/main/packages/durable)（`@earendil-works/pi-durable` v1.4.0）的设计与代码。

> pi-durable 只做一件事：让 AI 智能体的每一步都“先记一笔，再动手”。进程崩了、机器重启了、浏览器标签关了，它都能从账本上接着干，而且**同一件事只做一次**。

## 这套教程怎么教

1. **先大纲，后细节。** 第 00 课先给一张总架构图，用颜色标出优先级：🔴 P0 必须吃透、🟠 P1 用到再深入、⚪ P2 进阶。之后每课只讲一个功能，每课都从“先看图”开始。
2. **寓言引导。** 每个难懂的设计点、每个生僻的语法，都先讲一个小故事（米行里唯一的一支笔、抄经的小和尚、驿站的信使……）。故事里不提前点破，读到结尾你会自己想明白；接着点开“🔍 揭晓”，看故事里的每样东西对应代码里的什么。
3. **能摸得着。** 8 个网页交互模拟器（停电、重启、插话、中止……都能亲手按）；11 个可以真实运行的小实验，不需要 API Key。
4. **全中文。** 课文、图表、模拟器、影片字幕全部是中文；英文只出现在代码标识符里，并且都有中文解释（见第 00 课的“名词速查”）。

## 课程路线

| 课 | 主题 | 寓言 | 优先级 |
|---|---|---|---|
| [00](course/00-overview.md) | 总览：架构总图、学习路线、名词速查 | —（先看地图） | 🧭 起步 |
| [01](course/01-one-pen.md) | 唯一写入线与原子提交 | 米行里唯一的一支笔 | 🔴P0 |
| [02](course/02-task-checkpoint.md) | 任务 = 状态机 + 检查点 | 抄经的小和尚 | 🔴P0 |
| [03](course/03-effect-sandwich.md) | 效果三明治、“可安全重做” | 驿站的信使 | 🔴P0 |
| [04](course/04-submission.md) | 提交单与请求号（只算一次） | 挂号窗口 | 🔴P0 |
| [05](course/05-run-loop.md) | 一次回答：生成任务与工具任务的接力 | 面馆的接力单 | 🔴P0 |
| [06](course/06-context.md) | 取消令牌：不等了 ≠ 不做了 | 等外卖的人 | 🔴P0 |
| [07](course/07-documents.md) | 文档：和记录一起提交的状态 | 账本旁的小黑板 | 🟠P1 |
| [08](course/08-inbox.md) | 收件箱：插话 / 排队 / 直接记一笔 | 饭馆跑堂 | 🟠P1 |
| [09](course/09-extensions.md) | 扩展、注册表、热重载 | 戏单上的角色名 | 🟠P1 |
| [10](course/10-tools-hooks.md) | 工具、钩子、工具调工具 | 衙门口的门房 | 🟠P1 |
| [11](course/11-ownership-abort.md) | 归属树、自下而上地中止 | 马戏团拆帐篷 | 🟠P1 |
| [12](course/12-child-tasks.md) | 子任务：一败俱停 / 全部等完 | 分头买票 | 🟠P1 |
| [13](course/13-sleep-wake.md) | 睡眠、定时、唤醒 | 客栈的叫早牌 | 🟠P1 |
| [14](course/14-storage.md) | 存储约定与错误三原则 | 刻碑与告示 | 🟠P1 |
| [15](course/15-compaction.md) | 上下文压缩 | 船长的航海日志 | ⚪P2 |
| [16](course/16-forks.md) | 多个对话与分叉 | 棋谱上的岔路 | ⚪P2 |
| [17](course/17-watch.md) | 订阅变化、多人、晚到的人 | 茶馆说书 | ⚪P2 |
| [18](course/18-codemode.md) | 代码模式与“照日志重演” | 照着录音重演的木偶戏 | ⚪P2 |
| [19](course/19-crash-loop.md) | 崩溃循环与重启上限 | 总晕倒的搬运工 | ⚪P2 |
| [20](course/20-ts-unions.md) | 语法课：可辨识联合类型 | 邮局的分拣格 | 语法 |
| [21](course/21-ts-generics.md) | 语法课：泛型 | 糕点模具 | 语法 |
| [22](course/22-typebox.md) | 语法课：TypeBox 运行时类型 | 海关申报单 | 语法 |

建议顺序：00 → 01～06（🔴 P0，一定要按顺序）→ 其余按需要跳读。语法课（20～22）可以在遇到看不懂的 TypeScript 时随时插进来读。

## 怎么阅读

**方式一：直接在 GitHub 上读。** 打开 [`course/`](course/) 目录里的 Markdown 即可，流程图 GitHub 会自动渲染。交互模拟器只能在网页版里用。

**方式二：在本地打开网页版（推荐）。**

```bash
git clone https://github.com/dockcy/pi-durable-tutorial.git
cd pi-durable-tutorial
python3 -m http.server 8000      # 或者 npx serve .
# 浏览器打开 http://localhost:8000
```

> 不能双击 `index.html` 直接打开：浏览器禁止网页用 `file://` 读取本地的课文文件。

**方式三：部署成网站。** 这是一个纯静态网站（`index.html` + `assets/` + `course/`），样式和渲染库都从 CDN 加载（Pico CSS、marked、mermaid、highlight.js），不需要构建。

- **GitHub Pages（最简单）**：到仓库 *Settings → Pages*，*Source* 选 *Deploy from a branch*，分支选 `main`、目录选 `/ (root)`，保存即可，不需要任何工作流。
- **GitHub Pages（用 Actions）**：工作流文件放在 [`deploy/github-pages.yml`](deploy/github-pages.yml)（推送时用的令牌没有 `workflow` 权限，没法直接放进 `.github/workflows/`）。在 GitHub 网页上新建文件 `.github/workflows/pages.yml`，把它的内容粘进去，再把 *Source* 选成 *GitHub Actions*。
- 注意：**私有仓库**开 Pages 需要 GitHub 付费套餐（Pro / Team / Enterprise）；免费账号需要把仓库改成公开。
- **其他静态托管**（Vercel、Netlify、Cloudflare Pages 等）：把仓库根目录当作站点根目录即可，构建命令留空。

## 动手实验

[`labs/`](labs/) 里有 11 个脚本，都在 Node 24 下真实跑过，用 pi-ai 自带的假模型，**不需要 API Key**：

```bash
cd labs
npm install
node 01-chat.ts
```

详见 [`labs/README.md`](labs/README.md)。

## 影片

[`film/`](film/) 是配套的寓言短片《先记一笔》（156 秒，中文字幕）：分镜脚本、事实清单和完整的画面代码，渲染方法见 `film/README.md`。

## 让 AI 助手当导师

把仓库拉到本地，用任意 AI 编程助手（Codex、Claude Code、Cursor……）打开，它会先读 [`AGENTS.md`](AGENTS.md)：里面写了课程路线、怎么讲、去哪查源码、核心心智模型和常见问答。然后直接跟它说“带我学第 01 课”或者问任何问题即可。

## 版本与出处

- 基于 pi-durable **v1.4.0**，源码固定在提交 [`136b87e`](https://github.com/earendil-works/pi/tree/136b87e8a7f5a3e5186de0289523ba327dc592fc/packages/durable)；课文里的源码链接都指向这个提交，行号不会漂移。
- 官方博客：[pi-durable](https://earendil.com/posts/pi-durable/)（Earendil）；官方说明：[README](https://github.com/earendil-works/pi/blob/136b87e8a7f5a3e5186de0289523ba327dc592fc/packages/durable/README.md)、[规范 spec.md](https://github.com/earendil-works/pi/blob/136b87e8a7f5a3e5186de0289523ba327dc592fc/packages/durable/docs/spec.md)。
- pi 以 MIT 许可证发布；课文中引用的源码片段版权归原作者。课文中带“注释为本教程所加”的代码，中文注释是本教程添加的。
- 寓言与模拟器都是帮助理解的**简化模型**，细节以官方源码和文档为准。

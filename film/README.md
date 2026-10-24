# 影片《先记一笔》

用寓言讲 pi-durable：深夜厨房里，停电以后厨子忘了自己放没放盐；隔壁的老厨子每件事先在账上记一笔，再动手。片尾才揭开——厨子就是 AI 智能体，盐是扣款、发邮件这类“做两次就坏事”的操作，停电是程序崩溃。

按 [vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film) 的做法制作，外观用“B 寓言”。全片只用中文。

| 文件 | 内容 |
|---|---|
| `facts.md` | 论点、概念清单、每条事实的出处，以及哪些画面只是示意 |
| `storyboard.md` | 完整分镜表（约 156 秒，42 镜 + 片名 + 片尾） |
| `film.js` | 画面代码。**目前只做了开头 35.2 秒**（第 1–9 镜 + 片名），等确认风格后再做后面的部分 |
| `index.html` | 播放页，加载引擎和 `film.js` |

## 自己渲染

```bash
git clone https://github.com/HeyChengC/vibe-knowledge-film.git
pip install -r vibe-knowledge-film/requirements.txt && python -m playwright install chromium
python vibe-knowledge-film/engine/get_fonts.py          # 下载中文字体
python vibe-knowledge-film/engine/render.py film --serve   # 浏览器预览
python vibe-knowledge-film/engine/render.py film          # 渲出 film/renders/raw.mp4（无声）
python vibe-knowledge-film/engine/render.py film --events && python vibe-knowledge-film/engine/audio.py film   # 加音效 → renders/final.mp4
```

视频文件不放进仓库（太大），需要的话按上面的命令自己渲。

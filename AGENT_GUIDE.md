# Agent Guide

本文件是项目内 AI 编码助手的共享工作说明。`AGENTS.md` 和 `CLAUDE.md` 都指向这里；维护项目约定时优先更新本文件。

## 项目概览

Bookmark Manager 是一个浏览器书签管理工具，包含两个入口：

1. **Gist 云端备份**：导入书签，转换格式，上传到 GitHub Gist 或从 Gist 下载。
2. **双向对比审核**：对比两份书签文件，逐条审核差异，导出决策或合并后的书签。

架构约束：

- 纯前端单页应用，主入口是 `index.html`。
- 无构建流程、无后端、无运行时依赖。
- 扩展代码位于 `extension/`，用于 Chrome/Edge 本地书签同步。
- Python 脚本位于 `scripts/`，只使用标准库。

## 关键文件

- `index.html`：主 Web 工具，包含 UI、解析、对比、导出和 Gist 上传逻辑。
- `extension/`：Chrome/Edge 扩展。
- `scripts/bookmark_writers.py`：书签树结构、HTML/JSON 写出和 HTML 解析的核心库。
- `scripts/convert_bookmarkhub_to_bookmarks_html.py`：BookmarkHub JSON 转三种规范输出。
- `scripts/apply_bookmark_review_decisions.py`：将审核决策应用到基准书签文件。
- `README.md`：中文主文档和部署说明。

## 本地运行

无需安装依赖，直接打开：

```bash
open index.html
```

需要 HTTP 环境时：

```bash
python3 -m http.server 8000
```

访问：

```text
http://localhost:8000
```

## 脚本命令

BookmarkHub JSON 转三种格式：

```bash
python3 scripts/convert_bookmarkhub_to_bookmarks_html.py \
  --source bookmarkhub.json \
  --output bookmarks
```

应用审核决策：

```bash
python3 scripts/apply_bookmark_review_decisions.py \
  --base safari_bookmarks.html \
  --decisions bookmark-review-decisions.json \
  --output bookmarks_merged
```

脚本默认输出：

- `.edge-chrome.html`
- `.safari.html`
- `.tree.json`

## 核心数据模型

所有 Python 侧书签处理必须经过 `scripts/bookmark_writers.py` 中的 `Node`：

```python
class Node:
    kind: str
    title: str
    url: str
    add_date: int
    last_modified: int
    children: list
    parent: Node | None
```

不要绕过 `Node` 直接拼 HTML 或 JSON。前端也应保持同一棵“规范书签树”的思路，避免每个格式各写一套业务逻辑。

## URL 归一化

比较书签前必须归一化 URL。Python 和 JavaScript 逻辑要保持一致：

1. 最多重复 URL decode 3 次。
2. scheme 和 host 小写。
3. 去掉非根路径的尾部 `/`。
4. `javascript:` 和 `data:` 不做常规 URL 归一化。

示例：

```text
HTTPS://Example.COM/Path/ -> https://example.com/Path
```

## 导出格式

同一批书签应能稳定导出为：

- Chromium HTML：首个收藏栏目录添加 `PERSONAL_TOOLBAR_FOLDER="true"`。
- Safari HTML：包含 `<HTML>` 包装，不添加收藏栏属性。
- Tree JSON：`schema: "bookmark-tree/v1"`。
- BookmarkHub.txt：JSON 内容，扩展名保留 `.txt`。

收藏栏名称识别列表：

```python
FAVORITES_FOLDER_NAMES = (
    "个人收藏",
    "收藏夹栏",
    "Bookmarks Bar",
    "Favorites",
    "Favourites",
)
```

只允许第一个匹配的顶层目录成为收藏栏。

## 前端约束

`index.html` 是无框架单文件应用：

- 不引入构建工具。
- 不引入第三方前端依赖。
- CSS 和 JS 继续内联，除非有明确拆分收益。
- Gist Token 只保存在浏览器本地。
- 书签解析、比较、导出都在客户端完成。

前端核心模块：

1. Parser：Netscape HTML、BookmarkHub JSON、Tree JSON。
2. Normalizer：URL 归一化。
3. Comparator：A/B 双向差异。
4. Exporter：HTML、JSON、BookmarkHub。
5. Gist Integration：GitHub Gist 上传和下载。

## 脱敏与仓库卫生

- 不提交真实书签导出、Gist 原始文件、浏览器缓存、`.DS_Store`、`.codegraph/`、`.claude/`、`__pycache__/`。
- 文档示例使用 `<your-user>`、`<your-site-url>`、`<gist-id>` 等占位符。
- 不提交真实 Token、私有 Gist URL、个人域名、绝对本机路径或可识别个人书签内容。
- 本地测试样例如需保留，放在已忽略目录或使用脱敏小样例。

## 代码风格

Python：

- Python 3.7+。
- 标准库优先。
- 4 空格缩进。
- 公共函数保留类型标注。
- 复杂逻辑补充简短 docstring。

JavaScript：

- 现代浏览器原生 ES6+。
- 使用 `const` / `let`。
- 不引入转译流程。
- 注释只解释非显然逻辑。

## 常见风险

1. 不要绕过规范树结构直接修改序列化输出。
2. Python 与 JavaScript 的 URL 归一化必须同步。
3. BookmarkHub 时间是毫秒，Netscape HTML 时间是秒。
4. 不要把包装层 `ToolbarFolder`、`其他收藏夹` 当成真实目录。
5. Gist 覆盖上传时要避免旧文件残留导致读取到过期格式。
6. 所有输出保持 UTF-8、LF、无 BOM。

## 验证

至少执行：

```bash
git diff --check
```

修改 `index.html` 后执行脚本语法检查：

```bash
node -e 'const fs=require("fs"); const html=fs.readFileSync("index.html","utf8"); const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]); new Function(scripts.join("\n")); console.log("syntax ok");'
```

涉及导出格式时，用真实浏览器导出的脱敏样例做一次手工验证。

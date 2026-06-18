# Bookmark Manager

一个纯前端浏览器书签管理工具，用于跨浏览器备份、格式转换和双向差异审核。

核心特点：

- 无后端、无数据库、无构建流程。
- 主工具只有一个 `index.html`，可直接本地打开。
- 书签内容在浏览器本地解析和处理。
- 只有主动使用 Gist 上传或下载时才访问 GitHub。
- 支持 Safari、Chrome、Edge、Firefox 导出的 Netscape Bookmark HTML，以及 BookmarkHub JSON。

## 功能

### Gist 云端备份

- 导入书签文件。
- 转换为 BookmarkHub.txt、Edge/Chrome HTML、Safari HTML 或 Tree JSON。
- 下载到本地，或上传到自己的 GitHub Gist。
- 从 Gist 下载后再次转换为目标格式。

### 双向对比审核

- 导入 A/B 两份书签。
- 按 URL 归一化后对比差异。
- 区分 A 独有、B 独有、同 URL 但标题或目录不同。
- 支持保留、删除、同步到对侧、按 A/B 覆盖。
- 导出审核决策或合并后的书签文件。

### Chrome/Edge 扩展

`extension/` 提供浏览器扩展，用于把 Gist 中的书签同步到 Chrome/Edge。

注意：同步会删除当前浏览器中的现有书签并导入 Gist 内容。使用前请先备份。

## 快速开始

### 本地使用

直接打开：

```bash
open index.html
```

需要 HTTP 服务时：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

### 部署使用

这是静态站点，可以部署到任意静态托管平台。

Cloudflare Pages 推荐配置：

| 配置项 | 值 |
| --- | --- |
| 框架预设 | 无 |
| 构建命令 | 留空 |
| 构建输出目录 | `/` |
| 生产分支 | `main` |
| 环境变量 | 留空 |

GitHub Pages 也可使用仓库内的 `.github/workflows/deploy.yml` 部署。

文档中的部署地址请替换为自己的地址，例如：

```text
https://<your-site-url>
https://<your-user>.github.io/bookmark-manager/
```

## 使用流程

### Gist 备份 / 转格式

1. 打开 `index.html`。
2. 选择“Gist 云端备份 / 转格式”。
3. 导入书签文件。
4. 选择导出格式。
5. 点击“下载”保存本地文件，或点击“上传到 Gist”备份到 GitHub。

上传到私有 Gist 需要 GitHub Personal Access Token，权限只勾选 `gist`。

Token 只保存在当前浏览器的 localStorage 中，不会写入项目文件。

### 从 Gist 下载

1. 粘贴 Gist 页面 URL 或 raw URL。
2. 点击“获取”。
3. 选择目标格式并下载，或继续上传到另一个 Gist。

如果要原样保留 Gist 文件内容，请选择“原始文件”相关导出项。

### 双向对比审核

1. 打开 `index.html`。
2. 选择“双向对比审核”。
3. 分别导入 A、B 两份书签。
4. 根据差异逐条选择保留、删除、同步或覆盖。
5. 选择导出格式。
6. 下载结果，或上传到 Gist。

## 支持格式

### 输入

- Netscape Bookmark HTML：Safari、Chrome、Edge、Firefox 常见导出格式。
- BookmarkHub JSON：通常使用 `.txt` 扩展名。
- Tree JSON：本项目的结构化中间格式。

### 输出

- `*.edge-chrome.html`：适合 Chromium 系浏览器和 Firefox。
- `*.safari.html`：适合 Safari，也可被多数浏览器导入。
- `*.tree.json`：结构化树形 JSON，适合自动化处理。
- `*.BookmarkHub.txt`：BookmarkHub 兼容 JSON。
- `bookmark-review-decisions.json`：审核决策记录。

## 辅助脚本

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

脚本输出：

- `bookmarks.edge-chrome.html`
- `bookmarks.safari.html`
- `bookmarks.tree.json`

## 浏览器扩展

安装方式：

1. 打开 `edge://extensions` 或 `chrome://extensions`。
2. 启用“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `extension/` 目录。

配置方式：

1. 打开扩展配置页。
2. 填写下载源 Gist URL。
3. 如需上传或读取私有 Gist，填写 GitHub Token。
4. 选择格式和同步策略。
5. 保存后在扩展弹窗中执行同步。

扩展只请求 GitHub Gist 和 raw 文件所需域名权限，不访问其他站点内容。

## 目录结构

```text
.
├── index.html                         # 主 Web 工具
├── README.md                          # 中文主文档
├── AGENT_GUIDE.md                     # AI 助手共享项目规则
├── AGENTS.md                          # Codex 入口
├── CLAUDE.md                          # Claude Code 入口
├── scripts/
│   ├── bookmark_writers.py
│   ├── convert_bookmarkhub_to_bookmarks_html.py
│   └── apply_bookmark_review_decisions.py
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── options.html
│   ├── options.js
│   ├── compare.html
│   ├── compare.js
│   ├── extract.html
│   ├── extract.js
│   └── icons/
└── .github/workflows/deploy.yml
```

## 脱敏与仓库卫生

不要提交以下内容：

- 真实书签导出文件。
- Gist raw 文件副本。
- GitHub Token 或任何密钥。
- 个人域名、私有 Gist URL、绝对本机路径。
- `.DS_Store`、`.codegraph/`、`.claude/`、`__pycache__/`。

示例文档中使用占位符：

```text
<your-user>
<your-site-url>
<gist-id>
<token-with-gist-scope>
```

## 验证

基础检查：

```bash
git diff --check
```

检查 `index.html` 中内联脚本语法：

```bash
node -e 'const fs=require("fs"); const html=fs.readFileSync("index.html","utf8"); const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]); new Function(scripts.join("\n")); console.log("syntax ok");'
```

涉及格式转换时，使用脱敏样例做一次手工导入和导出验证。

## 许可证

未声明许可证。发布或复用前请先补充明确的开源许可证。

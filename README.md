# Bookmark Manager

浏览器书签管理工具。支持两种模式：

1. **☁️ Gist 云端备份** — 导入书签，转换格式，上传到 GitHub Gist 或从 Gist 下载
2. **⚖️ 双向对比审核** — 对比两份书签文件，逐条审核差异，导出决策 JSON，可选脚本自动合并

---

## 目录

- [试用](#试用)
- [快速开始](QUICK_START.md) 🚀
- [浏览器扩展](#浏览器扩展) 🆕
- [自行部署](#自行部署)
  - [方案 A：Cloudflare Pages（推荐）](#方案-acloudflare-pages推荐)
  - [方案 B：GitHub Actions + GitHub Pages](#方案-bgithub-actions--github-pages)
- [使用](#使用)
  - [审核工具（主入口）](#审核工具主入口)
  - [辅助脚本](#辅助脚本)
- [导出格式（明确规格）](#导出格式明确规格)
  - [Chromium HTML 规格](#chromium-html-规格)
  - [Safari HTML 规格](#safari-html-规格)
  - [树形 JSON 规格](#树形-json-规格)
- [前端导出选项](#前端导出选项)
- [目录结构](#目录结构-1)
- [支持的输入格式](#支持的输入格式)
- [特性](#特性)
- [License](#license)

---

## 试用

**直接打开：https://bm.yangsen666.cloud**

无需注册、无需安装、无后端服务。所有书签数据只在你自己的浏览器里处理，不上传到任何服务器。可打开浏览器开发者工具的 Network 面板验证 —— 加载完 HTML 之后再无任何外部请求。

---

## 浏览器扩展

### Chrome/Edge 扩展：Bookmark Gist Sync 🆕

**从 Gist 自动同步书签到 Edge/Chrome 浏览器**

配合在线工具，实现 **Safari → Gist → Edge/Chrome** 的完整跨浏览器书签同步链路。

#### 主要功能

- ⚡ 一键从 GitHub Gist 下载书签
- 🔄 自动覆盖本地书签（删除现有 + 导入新的）
- 🔒 Token 本地存储，安全可靠
- 📦 支持 BookmarkHub JSON 和 Chromium HTML 格式

#### 快速开始

1. **安装扩展**：
   - 克隆本仓库：`git clone https://github.com/mumu-140/bookmark-manager.git`
   - 打开 `edge://extensions` 或 `chrome://extensions`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `extension/` 目录

2. **配置扩展**：
   - 点击扩展图标 → "⚙️ 配置"
   - 填写 Gist URL（从在线工具上传后获得）
   - 填写 GitHub Token（仅私有 Gist 需要）
   - 保存配置

3. **同步书签**：
   - 点击扩展图标
   - 点击"⚡ 立即同步"
   - 确认删除现有书签的警告
   - 等待同步完成

#### 完整同步流程

```
Safari 导出 → 在线工具审核/转换 → 上传到 Gist
                                        ↓
                            Edge/Chrome 扩展同步
```

**详细文档**：[extension/README.md](extension/README.md)

---

## 自行部署

工具是纯前端单页应用（仅 1 个 HTML 文件，零外部依赖），挂哪儿都能跑。下面两种**完全免费**的方案，任选其一。

### 方案 A：Cloudflare Pages（推荐）

**适合人群：** 完全新手。全程在浏览器里点几下，无需写代码、无需装命令行工具。

**优点：**
- 国内访问比 GitHub Pages 快很多（GitHub Pages 走 fastly.net，部分省份会丢包或慢）
- 自带 SSL 证书，可绑自定义域名
- 每次 `git push` 自动重新部署，从 push 到上线一般 30 秒内

**步骤：**

1. **Fork 本仓库到你自己的 GitHub 账号**
   - 打开 https://github.com/mumu-140/bookmark-manager
   - 点右上角 **Fork** 按钮 → **Create fork**（仓库名可保持默认 `bookmark-manager`）
   - 完成后你会有自己的 `https://github.com/<你的用户名>/bookmark-manager`

2. **注册并登录 Cloudflare（已有账号跳过）**
   - 打开 https://dash.cloudflare.com/sign-up 注册免费账号
   - 完成邮箱验证

3. **进入 Pages 控制台**
   - 登录后左侧栏 → **计算 (Workers 和 Pages)** → **Pages**
   - 点 **创建** → **导入现有 Git 存储库**

4. **授权 Cloudflare 访问你的 GitHub**
   - 首次会弹到 GitHub OAuth 授权页
   - 建议选 **Only select repositories** → 勾选刚 fork 的 `bookmark-manager` → **Install & Authorize**
   - （选 All repositories 也行，更省事但权限更大）

5. **回到 Cloudflare 页面，选刚授权的仓库，点"开始设置"**

6. **构建设置 —— 关键步骤，按下表逐项填**

   | 字段 | 该填什么 |
   |------|---------|
   | 项目名称 | 默认即可（决定你的 URL 前缀，例如 `bookmark-manager.pages.dev`） |
   | 生产分支 | `main` |
   | 框架预设 | **无** |
   | 构建命令 | **留空** |
   | 构建输出目录 | 手动输入 `/`（灰色占位符不是实际值，必须自己打一个斜杠） |
   | 根目录（高级） | **留空** |
   | 环境变量 | **留空** |

7. **点"保存并部署"，等约 30 秒**
   - 完成后给一个 `https://<项目名>.pages.dev` 域名
   - 打开即是工具，根 URL 直接就是 `index.html`

之后每次 `git push` 到你 fork 的 main 分支，CF Pages 都会自动重新部署。

**绑定自定义域名（可选）：**

1. 项目首页 → **自定义域** → **设置自定义域** → 填你的域名（例如 `bookmarks.yourdomain.com`）
2. 按指引去域名注册商处加一条 CNAME 记录指向 CF 给的目标
3. 如果你的域名已经在 Cloudflare 托管 DNS，这一步会自动完成

### 方案 B：GitHub Actions + GitHub Pages

**适合人群：** 不想再注册额外的 CF 账号，全部在 GitHub 生态内搞定。

**优点：**
- 不需要 Cloudflare 账号
- 部署日志、构建状态在仓库 **Actions** 标签页可查
- 本仓库已包含 `.github/workflows/deploy.yml`，fork 后自动带，无需手写

**缺点：**
- 中国大陆部分省份访问 `*.github.io` 比 `*.pages.dev` 慢
- 国内绑自定义域名需要域名走 GitHub Pages 的 DNS，国内常被解析慢

**步骤：**

1. **Fork 本仓库**（同方案 A 第 1 步）

2. **开启 fork 仓库的 Actions（重要，新手常踩坑）**
   - GitHub 出于安全考虑，fork 来的仓库默认会**禁用 workflow**
   - 在 fork 后的仓库页面点顶部 **Actions** 标签
   - 看到提示 "Workflows aren't being run on this forked repository" → 点蓝色按钮 **I understand my workflows, go ahead and enable them**
   - 启用后才能继续后面的部署步骤

3. **打开 fork 后仓库的 Settings → Pages**
   - URL：`https://github.com/<你的用户名>/bookmark-manager/settings/pages`

4. **在 "Build and deployment" → "Source" 下拉里选 `GitHub Actions`**
   - 这告诉 GitHub Pages 用 Actions workflow 来构建和部署
   - 不要选 `Deploy from a branch`（那是另一种更老的部署模式）

5. **触发首次部署**
   - 方法 1：在仓库页面顶部点 **Actions** 标签 → 左侧选 **Deploy to GitHub Pages** workflow → 右上角 **Run workflow** → 在弹出的小窗里 **Run workflow**（确认运行）
   - 方法 2：在本地随便改个文件然后 `git push`，workflow 会被 push 事件自动触发
   - 等约 1 分钟，Actions 页面看到绿色 ✓ 即部署完成

6. **拿到部署 URL**
   - 回到 **Settings → Pages**，页面顶部会显示 `Your site is live at https://<你的用户名>.github.io/bookmark-manager/`
   - 打开即用

之后每次 push 到 main，workflow 自动重跑。

---

## 使用

### 模式 1：Gist 云端备份（推荐）

用浏览器打开 `index.html`（本地）或访问 https://bm.yangsen666.cloud ，选择 **☁️ Gist 云端备份**。

#### 上传到 Gist
1. 导入书签文件（Safari / Chrome / Edge HTML 或 BookmarkHub JSON）
2. 选择导出格式（BookmarkHub.txt / Edge HTML / Safari HTML / 树形 JSON）
3. 点击 **☁️ 上传到 Gist**（首次需要输入 GitHub Personal Access Token）
4. 获得 Gist URL，可在其他设备下载

#### 从 Gist 下载
1. 输入 Gist URL 或原始文件 URL
2. 点击 **🔽 获取**
3. 选择目标格式并下载

#### 本地转换
1. 导入书签文件
2. 选择目标格式
3. 点击 **💾 下载**

### 模式 2：双向对比审核

用浏览器打开 `index.html` 或访问 https://bm.yangsen666.cloud ，选择 **⚖️ 双向对比审核**。

1. 分别导入 A、B 两份书签文件（支持 Netscape HTML 和 BookmarkHub JSON，自动识别）
2. 工具自动解析、归一化 URL、对比差异，生成三类审核项：
   - **A 独有** — 仅存在于 A 中的书签
   - **B 独有** — 仅存在于 B 中的书签
   - **共同差异** — 同一 URL 但标题或目录不同
3. 每条书签有四个对称操作：**保留** / **删除** / **→ A** / **→ B**
4. 支持搜索、按类型/状态筛选、批量操作
5. 审核完成后选择导出格式（见下节）
6. **可选功能**：上传到 GitHub Gist
   - 点击 **📤 Gist** 按钮
   - 首次使用需输入 GitHub Personal Access Token（权限：`gist`）
   - Token 获取地址：https://github.com/settings/tokens/new
   - Token 保存在浏览器 localStorage，仅本地使用
   - 支持所有导出格式上传（BookmarkHub.txt、HTML、JSON）

### 辅助脚本

```bash
# BookmarkHub JSON → 三种规范化输出
python3 scripts/convert_bookmarkhub_to_bookmarks_html.py \
  --source bookmarkhub.json \
  --output bookmarks

# 将审核决策应用到基准书签文件，生成合并后的三种规范化输出
python3 scripts/apply_bookmark_review_decisions.py \
  --base safari_bookmarks.html \
  --decisions bookmark-review-decisions.json \
  --output bookmarks_merged
```

两个脚本的 `--output` 参数都是**路径前缀**，每次运行都会同时写出三种规范化格式（见下节）。

---

## 导出格式（明确规格）

每次导出（脚本或前端工具）都基于同一棵规范化书签树，生成三个输出文件，分别面向不同的导入目标：

| 输出 | 文件名后缀 | 兼容浏览器 | 说明 |
|------|-----------|-----------|------|
| **Chromium HTML** | `.edge-chrome.html` | Edge / Chrome / Firefox / Brave 等 | 顶层 `个人收藏` 文件夹带 `PERSONAL_TOOLBAR_FOLDER="true"`，导入后**自动放入收藏夹栏** |
| **Safari HTML** | `.safari.html` | Safari（亦可用于上面所有浏览器） | 含 `<HTML>` 外层包裹；Safari 不识别 PERSONAL_TOOLBAR_FOLDER 故省略 |
| **树形 JSON** | `.tree.json` | 通用（机器可读、可再次导入或编程处理） | schema 固定为 `bookmark-tree/v1`，节点统一为 `folder` / `bookmark` 两种 |
| **BookmarkHub.txt** | `.BookmarkHub.txt` | [BookmarkHub](https://github.com/nicehash/BookmarkHub) 扩展导入 | 嵌套结构 JSON 格式，可直接导入 BookmarkHub 扩展或上传到 GitHub Gist |

### Chromium HTML 规格

```
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="..." LAST_MODIFIED="..." PERSONAL_TOOLBAR_FOLDER="true">个人收藏</H3>
    <DL><p>
        <DT><A HREF="https://example.com/" ADD_DATE="...">Example</A>
        ...
    </DL><p>
</DL><p>
```

- UTF-8 无 BOM、LF 换行、4 空格缩进
- 第一个名为 `个人收藏` / `收藏夹栏` / `Bookmarks Bar` / `Favorites` / `Favourites` 的顶层文件夹会被自动标记为收藏夹栏
- 每个 H3 和 A 都必须有 ADD_DATE，缺失时填生成时间

### Safari HTML 规格

```
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<HTML>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="..." LAST_MODIFIED="...">个人收藏</H3>
    ...
</DL><p>
</HTML>
```

- 与 Chromium HTML 唯一差异：含 `<HTML>` / `</HTML>` 包裹，且不带 `PERSONAL_TOOLBAR_FOLDER`
- Safari 导入后会全部放入 `已导入 [日期]` 文件夹（Apple 设计限制），需手动拖入"个人收藏"

### 树形 JSON 规格

```json
{
  "schema": "bookmark-tree/v1",
  "generatedAt": "2026-05-23T08:00:00Z",
  "title": "Bookmarks",
  "tree": [
    {
      "type": "folder",
      "title": "个人收藏",
      "isFavoritesBar": true,
      "addDate": 1716422400,
      "children": [
        { "type": "bookmark", "title": "Example", "url": "https://example.com/", "addDate": 1716422400 }
      ]
    }
  ]
}
```

- `schema` 固定为 `"bookmark-tree/v1"`
- 节点只有两种 `type`：`folder`（含 `children` 数组）或 `bookmark`（含 `url` 字符串）
- 缺省字段省略；UTF-8 无 BOM、缩进 2 空格

### BookmarkHub.txt 规格

```json
{
  "browser": "Mozilla/5.0 ...",
  "version": "0.0.6",
  "createDate": 1774428960959,
  "bookmarks": [
    {
      "children": [
        {
          "title": "文件夹名",
          "children": [
            {
              "syncing": true,
              "title": "书签标题",
              "url": "https://example.com/"
            }
          ]
        }
      ]
    }
  ]
}
```

- 嵌套结构，文件夹节点含 `title` 和 `children`，书签节点含 `syncing`、`title`、`url`
- 虽然扩展名是 `.txt`，实际是标准 JSON 格式
- 可直接导入 [BookmarkHub](https://github.com/nicehash/BookmarkHub) 浏览器扩展
- 适合上传到 GitHub Gist 进行云端备份

---

## 前端导出选项

`index.html` 的导出下拉菜单：

| 选项 | 输出文件 |
|------|---------|
| 决策 JSON | `bookmark-review-decisions.json` |
| A 侧 · 三种格式 | `bookmarks-A-merged.edge-chrome.html` + `.safari.html` + `.tree.json` |
| B 侧 · 三种格式 | `bookmarks-B-merged.edge-chrome.html` + `.safari.html` + `.tree.json` |
| 两侧 · 全部六个文件 | 上面 6 个文件 |
| A / B · 单种格式 | 单独下载某一格式（包括 BookmarkHub.txt） |

**上传到 GitHub Gist**：点击 **📤 Gist** 按钮可将选中的单个格式直接上传到 GitHub Gist（私有），适合云端备份或跨设备同步。

---

## 目录结构

```
index.html                                  ← 主入口，纯前端，打开即用
scripts/
  bookmark_writers.py                       ← 共享：Node 类 + 三种 writer + Netscape HTML 解析
  convert_bookmarkhub_to_bookmarks_html.py  ← BookmarkHub JSON 转三种规范化格式
  apply_bookmark_review_decisions.py        ← 审核决策 → 合并后输出三种规范化格式
.github/
  workflows/
    deploy.yml                              ← GitHub Actions 部署到 GitHub Pages
.gitignore
README.md
```

---

## 支持的输入格式

| 格式 | 来源 | 说明 |
|---|---|---|
| Netscape Bookmark HTML | Safari / Chrome / Edge / Firefox 导出 | `<!DOCTYPE NETSCAPE-Bookmark-file-1>` |
| BookmarkHub JSON | [BookmarkHub](https://github.com/nicehash/BookmarkHub) 扩展导出 | `{ "nodes": [...] }` |

---

## 特性

- 纯前端，无服务端，数据不离开浏览器
- URL 归一化：多层 decode + scheme/host 小写 + 去尾斜杠
- 自动跳过 `javascript:` bookmarklet 和可配置的排除文件夹（默认排除"小书签栏"）
- 双向对称设计：A 和 B 地位相同，任意一侧都可加入/删除
- 导出的决策 JSON 可供脚本自动化处理
- **支持四种规范化格式**（Edge/Chrome、Safari、树形 JSON、BookmarkHub.txt），覆盖全部主流导入场景
- **一键上传到 GitHub Gist**：支持所有格式直接上传云端备份，方便跨设备同步

---

## License

MIT

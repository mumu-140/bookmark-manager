# Bookmark Manager

浏览器书签双向对比审核工具。对比两份书签文件（Safari、Edge、Chrome、BookmarkHub 等），逐条审核差异，导出决策 JSON，可选脚本自动合并。

## 使用

### 审核工具（主入口）

用浏览器打开 `index.html`，无需安装任何依赖。也可访问在线版本（部署后填入实际 URL）。

1. 分别导入 A、B 两份书签文件（支持 Netscape HTML 和 BookmarkHub JSON，自动识别）
2. 工具自动解析、归一化 URL、对比差异，生成三类审核项：
   - **A 独有** — 仅存在于 A 中的书签
   - **B 独有** — 仅存在于 B 中的书签
   - **共同差异** — 同一 URL 但标题或目录不同
3. 每条书签有四个对称操作：**保留** / **删除** / **→ A** / **→ B**
4. 支持搜索、按类型/状态筛选、批量操作
5. 审核完成后选择导出格式（见下节）

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

## 导出格式（明确规格）

每次导出（脚本或前端工具）都基于同一棵规范化书签树，生成三个输出文件，分别面向不同的导入目标：

| 输出 | 文件名后缀 | 兼容浏览器 | 说明 |
|------|-----------|-----------|------|
| **Chromium HTML** | `.edge-chrome.html` | Edge / Chrome / Firefox / Brave 等 | 顶层 `个人收藏` 文件夹带 `PERSONAL_TOOLBAR_FOLDER="true"`，导入后**自动放入收藏夹栏** |
| **Safari HTML** | `.safari.html` | Safari（亦可用于上面所有浏览器） | 含 `<HTML>` 外层包裹；Safari 不识别 PERSONAL_TOOLBAR_FOLDER 故省略 |
| **树形 JSON** | `.tree.json` | 通用（机器可读、可再次导入或编程处理） | schema 固定为 `bookmark-tree/v1`，节点统一为 `folder` / `bookmark` 两种 |

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

## 前端导出选项

`index.html` 的导出下拉菜单：

| 选项 | 输出文件 |
|------|---------|
| 决策 JSON | `bookmark-review-decisions.json` |
| A 侧 · 三种格式 | `bookmarks-A-merged.edge-chrome.html` + `.safari.html` + `.tree.json` |
| B 侧 · 三种格式 | `bookmarks-B-merged.edge-chrome.html` + `.safari.html` + `.tree.json` |
| 两侧 · 全部六个文件 | 上面 6 个文件 |
| A / B · 单种格式 | 单独下载某一格式 |

## 目录结构

```
index.html                    ← 主入口，纯前端，打开即用
scripts/
  bookmark_writers.py                       ← 共享：Node 类 + 三种 writer + Netscape HTML 解析
  convert_bookmarkhub_to_bookmarks_html.py  ← BookmarkHub JSON 转三种规范化格式
  apply_bookmark_review_decisions.py        ← 审核决策 → 合并后输出三种规范化格式
.gitignore
README.md
```

## 支持的输入格式

| 格式 | 来源 | 说明 |
|---|---|---|
| Netscape Bookmark HTML | Safari / Chrome / Edge / Firefox 导出 | `<!DOCTYPE NETSCAPE-Bookmark-file-1>` |
| BookmarkHub JSON | [BookmarkHub](https://github.com/nicehash/BookmarkHub) 扩展导出 | `{ "nodes": [...] }` |

## 特性

- 纯前端，无服务端，数据不离开浏览器
- URL 归一化：多层 decode + scheme/host 小写 + 去尾斜杠
- 自动跳过 `javascript:` bookmarklet 和可配置的排除文件夹（默认排除"小书签栏"）
- 双向对称设计：A 和 B 地位相同，任意一侧都可加入/删除
- 导出的决策 JSON 可供脚本自动化处理
- **每次导出同时产出三种规范化格式**（Edge/Chrome、Safari、JSON），覆盖全部主流导入场景

## License

MIT

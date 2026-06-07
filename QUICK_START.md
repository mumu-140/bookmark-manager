# 快速开始指南

## 🚀 5 分钟上手

### 在线使用（推荐）

访问 **https://bms.yanggod.bond**，无需安装。

### 本地使用

直接在浏览器中打开 `index.html`。

---

## 📋 基本流程

### 1️⃣ 从 Safari 导出书签

Safari → 文件 → 导出书签 → 保存为 `bookmarks.html`

### 2️⃣ 导入并审核

1. 打开工具，拖入书签文件（支持 A、B 两侧对比）
2. 审核差异：
   - **保留** — 不做改动
   - **删除** — 从结果中移除
   - **→ A / → B** — 同步到另一侧

### 3️⃣ 导出或上传

#### 方式 A：下载到本地

选择导出格式 → 点击 **导出** 按钮：
- `BookmarkHub.txt` — 用于 BookmarkHub 扩展
- `Edge/Chrome HTML` — 导入 Edge/Chrome/Firefox
- `Safari HTML` — 导入 Safari
- `树形 JSON` — 编程处理

#### 方式 B：上传到 GitHub Gist（推荐）

1. 选择导出格式（如 `A · BookmarkHub.txt`）
2. 点击 **📤 Gist** 按钮
3. 首次使用：输入 GitHub Personal Access Token
   - 获取地址：https://github.com/settings/tokens/new
   - 权限：只勾选 `gist`
4. 上传成功后获得 Gist URL，可在其他设备下载

---

## 🎯 常见场景

### 场景 1：Safari 导出转换为 BookmarkHub 格式

```
Safari 导出 → 导入 A 侧 → 选择 "A · BookmarkHub.txt" → 导出
```

### 场景 2：两份书签合并去重

```
导入 A 侧（旧书签）+ B 侧（新书签）
→ 审核差异（删除重复，保留新增）
→ 选择 "A 侧 · 三种格式" → 导出
```

### 场景 3：云端备份并跨设备同步

```
Safari 导出 → 导入 → 选择 "A · BookmarkHub.txt"
→ 点击 📤 Gist → 上传成功
→ 在其他设备打开 Gist URL 下载
```

---

## 🔑 GitHub Token 快速设置

1. 访问 https://github.com/settings/tokens/new
2. **Note**: `Bookmark Manager`
3. **Scopes**: 只勾选 `gist`
4. **Expiration**: 推荐 90 days
5. 点击 **Generate token** 并复制
6. 在工具中点击 📤 Gist 时粘贴 Token

Token 保存在浏览器本地，可随时清除。

---

## 📚 更多帮助

- 详细部署指南：`README.md`
- Gist 上传指南：`GIST_UPLOAD_GUIDE.md`
- 版本更新日志：`CHANGELOG.md`

---

## ⚡ 一句话总结

**从 Safari 导出书签 → 导入工具审核 → 导出为 BookmarkHub.txt → 上传到 GitHub Gist 云端备份。**

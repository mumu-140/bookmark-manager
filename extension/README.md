# Bookmark Gist Sync 扩展

Chrome/Edge 扩展，用于从 GitHub Gist 下载书签并导入浏览器，也可将当前浏览器书签上传到 Gist。

## 功能

- 从 Gist 下载 BookmarkHub JSON、Chromium HTML 或 Tree JSON。
- 将下载结果导入 Chrome/Edge 书签。
- 将当前浏览器书签上传到新 Gist 或固定 Gist。
- 支持上传目标和下载源使用不同 Gist。
- 支持配置完整 Web 工具地址，用于跳转到主页面做高级对比。

## 安装

1. 克隆或下载项目：

   ```bash
   git clone https://github.com/<your-user>/bookmark-manager.git
   ```

2. 打开浏览器扩展页：

   ```text
   chrome://extensions
   edge://extensions
   ```

3. 启用“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择 `extension/` 目录。

## 配置

打开扩展配置页后填写：

- 上传模式：新建 Gist 或固定 Gist。
- 上传目标 Gist URL：固定 Gist 模式必填。
- 下载源 Gist URL：下载和同步时使用。
- GitHub Personal Access Token：上传必填，下载私有 Gist 时必填。
- 书签格式：通常选择自动检测。
- 完整网页版工具地址：可选，填写你自己的部署地址，例如 `https://<your-site-url>`。
- 自动移除顶层文件夹：适合 Safari 导出后只包含一个顶层收藏夹的情况。

Token 权限只需要 `gist`。

## 使用

### 从 Gist 同步到浏览器

1. 在配置页填写下载源 Gist URL。
2. 如是私有 Gist，填写 Token。
3. 点击“测试连接”确认可读取。
4. 回到扩展弹窗，点击“立即同步”。
5. 确认删除现有书签并导入新书签。

注意：同步会删除当前浏览器的现有书签。首次使用前请从浏览器书签管理器导出备份。

### 上传当前浏览器书签到 Gist

1. 在配置页填写 Token。
2. 选择新建 Gist 或固定 Gist。
3. 回到扩展弹窗，点击“上传书签”。

## 支持格式

- BookmarkHub JSON：常见扩展名为 `.txt`。
- Chromium HTML：Netscape Bookmark 格式。
- Tree JSON：`schema: "bookmark-tree/v1"`。

## 权限说明

Manifest 权限：

- `bookmarks`：读取、删除、创建本地书签。
- `storage`：保存配置。
- `alarms`：预留定时能力。

Host 权限：

- `https://api.github.com/*`
- `https://gist.githubusercontent.com/*`
- `https://raw.githubusercontent.com/*`

扩展不收集用户数据，不向 GitHub 以外的服务发送书签内容。

## 故障排查

### 测试连接失败

检查：

- Gist URL 是否正确。
- 私有 Gist 是否填写了 Token。
- Token 是否只具备 `gist` 权限且未过期。
- 当前网络是否能访问 GitHub。

### 同步失败 401/403

通常是 Token 无效、过期或权限不足。重新生成只包含 `gist` 权限的 Token 后再试。

### 导入后目录不符合预期

如书签文件包含单一顶层目录，可开启“自动移除顶层文件夹”。不同浏览器对收藏栏根目录命名不同，导入后可能需要手动调整位置。

## 本地调试

1. 修改扩展文件后，在扩展管理页点击“重新加载”。
2. Service Worker 日志在扩展详情页打开。
3. Popup / Options 日志可通过右键页面并选择“检查”查看。

调试时使用脱敏测试 Gist，避免影响真实书签。

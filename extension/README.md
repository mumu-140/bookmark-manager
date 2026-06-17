# Bookmark Gist Sync - Chrome/Edge 扩展

从 GitHub Gist 同步书签到 Edge/Chrome 浏览器的扩展工具。

## 功能特性

- ⚡ **手动触发同步**：点击扩展图标，一键从 Gist 下载并覆盖本地书签
- 🔄 **多格式支持**：BookmarkHub JSON (.txt)、Chromium HTML (.html)、树形 JSON
- 🔒 **安全可靠**：Token 仅存储在本地，不上传到任何服务器
- 🎯 **简单配置**：填写 Gist URL 和 Token，即可开始使用

## 使用场景

配合主项目的书签管理工具，实现 **Safari → Gist → Edge/Chrome** 的跨浏览器书签同步：

1. 在 Safari 导出书签 HTML
2. 使用主项目的 `index.html` 进行格式转换和审核
3. 上传到 GitHub Gist（BookmarkHub.txt 或 HTML 格式）
4. 在 Edge/Chrome 中使用本扩展同步书签

## 安装步骤

### 方法 1：本地加载（开发模式）

1. **克隆或下载项目**：
   ```bash
   git clone https://github.com/mumu-140/bookmark-manager.git
   cd bookmark-manager/extension
   ```

2. **在浏览器中加载扩展**：
   - **Edge**：访问 `edge://extensions`
   - **Chrome**：访问 `chrome://extensions`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `extension/` 目录

3. **配置扩展**：
   - 点击扩展图标
   - 点击"⚙️ 配置"按钮
   - 填写 Gist URL 和 GitHub Token（可选）

### 方法 2：从应用商店安装（TODO）

_即将发布到 Chrome Web Store 和 Edge Add-ons_

## 配置说明

### 1. 获取 Gist URL

有两种方式：

**方式 A：使用主项目工具上传**
1. 打开 https://bms.yanggod.bond
2. 导入书签并转换为 BookmarkHub.txt 或 HTML 格式
3. 点击"☁️ 上传到 Gist"
4. 复制返回的 Gist URL

**方式 B：手动创建 Gist**
1. 访问 https://gist.github.com/
2. 创建新 Gist，上传书签文件
3. 复制 Gist URL（如 `https://gist.github.com/username/abc123...`）

### 2. GitHub Personal Access Token（可选）

仅访问私有 Gist 时需要。

**获取步骤**：
1. 访问 https://github.com/settings/tokens/new
2. Note: `Bookmark Sync Extension`
3. Expiration: 选择过期时间（建议 90 days 或 No expiration）
4. Scopes: 只勾选 `gist`
5. 点击"Generate token"
6. 复制生成的 Token（只显示一次）

**权限说明**：
- Token 只需要 `gist` 权限
- 存储在浏览器本地（`chrome.storage.sync`）
- 不会上传到任何服务器

### 3. 书签格式选择

- **自动检测（推荐）**：根据文件名和内容自动识别
- **BookmarkHub JSON**：适合从 Safari 经主项目工具转换的书签
- **Chromium HTML**：标准 Netscape Bookmark 格式

## 使用流程

1. **配置扩展**：
   - 打开扩展选项页
   - 填写 Gist URL 和 Token
   - 点击"测试连接"验证配置
   - 保存配置

2. **执行同步**：
   - 点击扩展图标
   - 查看配置状态和上次同步时间
   - 点击"⚡ 立即同步"
   - 确认删除现有书签的警告
   - 等待同步完成

3. **查看结果**：
   - 同步成功后显示导入的书签数量
   - 刷新浏览器书签栏查看新书签

## 重要提示

⚠️ **数据安全警告**

- 同步操作将**删除所有现有书签**并导入 Gist 中的书签
- 此操作**不可撤销**
- 首次使用前请确保已备份重要书签

**建议备份方式**：
- Edge：设置 → 收藏夹 → 导出收藏夹
- Chrome：书签管理器 → 整理 → 将书签导出为 HTML 文件

## 故障排查

### 问题 1：提示"未配置"

**解决方案**：
- 点击"⚙️ 配置"按钮
- 填写有效的 Gist URL
- 保存配置后重试

### 问题 2：测试连接失败

**可能原因**：
- Gist URL 格式错误
- Gist 是私有的但未提供 Token
- Token 无效或过期
- 网络连接问题

**解决方案**：
- 检查 URL 格式（应包含 `gist.github.com` 或 `githubusercontent.com`）
- 私有 Gist 需要提供有效的 Token
- 重新生成 Token
- 检查网络连接

### 问题 3：同步失败 401/403

**原因**：Token 无效或权限不足

**解决方案**：
- 检查 Token 是否正确复制
- 确认 Token 权限包含 `gist`
- 访问 https://github.com/settings/tokens 检查 Token 状态
- 重新生成 Token

### 问题 4：解析书签失败

**原因**：文件格式不支持或损坏

**解决方案**：
- 确认文件是 BookmarkHub JSON 或 Chromium HTML 格式
- 使用主项目工具重新转换和上传
- 尝试切换"书签格式"选项

### 问题 5：导入后书签位置不对

**说明**：
- 所有书签会导入到"书签栏"（Bookmarks Bar）
- Edge/Chrome 不支持直接指定收藏夹栏
- 可手动拖动文件夹到收藏夹栏

## 技术细节

- **Manifest Version**: 3
- **最低浏览器版本**：Edge 88+、Chrome 88+、Brave 1.20+
- **权限**：`bookmarks`、`storage`、`alarms`
- **Host 权限**：`api.github.com`、`gist.githubusercontent.com`
- **架构**：Service Worker + Popup + Options Page

## 开发说明

### 项目结构

```
extension/
├── manifest.json       # Manifest V3 配置
├── background.js       # Service Worker（同步逻辑）
├── parser.js           # 书签解析器
├── popup.html          # 弹出窗口 UI
├── popup.js            # 弹出窗口逻辑
├── options.html        # 配置页面 UI
├── options.js          # 配置页面逻辑
├── icons/              # 扩展图标
└── README.md           # 说明文档
```

### 本地调试

1. 修改代码后，在扩展页面点击"重新加载"
2. 打开浏览器开发者工具查看日志
3. Service Worker 日志：扩展页面 → 点击"Service Worker"链接
4. Popup/Options 日志：右键扩展图标/选项页 → 检查

### 测试建议

- 使用测试 Gist，避免影响真实书签
- 首次测试前备份现有书签
- 测试多种格式（BookmarkHub、HTML）
- 测试错误场景（无效 URL、错误 Token）

## 隐私声明

- ✅ 扩展不收集任何用户数据
- ✅ GitHub Token 仅存储在本地浏览器
- ✅ 不向任何第三方服务器发送数据
- ✅ 仅与 GitHub API 通信（用户主动触发）
- ✅ 开源代码，可审计

## 相关链接

- [主项目仓库](https://github.com/mumu-140/bookmark-manager)
- [在线书签管理工具](https://bms.yanggod.bond)
- [GitHub Gist 文档](https://docs.github.com/en/rest/gists)
- [问题反馈](https://github.com/mumu-140/bookmark-manager/issues)

## 许可证

MIT License

---

**开发者**: mumu-140  
**版本**: 1.0.0  
**最后更新**: 2026-06-17

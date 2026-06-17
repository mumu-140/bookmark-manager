# GitHub Gist 上传功能使用指南

## 功能说明

从 Safari 导出书签后，可以在前端工具中审核、转换格式，然后一键上传到 GitHub Gist 进行云端备份，方便跨设备同步。

## 快速开始

### 1. 准备 GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens/new
2. 填写 Token 信息：
   - **Note**: `Bookmark Manager Gist Upload`（备注名称）
   - **Expiration**: 选择过期时间（建议 90 days 或 No expiration）
   - **Select scopes**: 只勾选 `gist`（创建和管理 Gist 的权限）
3. 点击 **Generate token**
4. **重要**：复制生成的 Token（只显示一次，请妥善保存）

### 2. 使用工具上传

#### 方式 A：从 Safari 直接导出并上传

1. 打开 https://bm.yangsen666.cloud （或本地 `index.html`）
2. 导入 Safari 导出的书签 HTML 文件
3. 进行审核（保留/删除/同步操作）
4. 在导出选项中选择：
   - `A · BookmarkHub.txt` - 如果 Safari 书签在 A 侧
   - `B · BookmarkHub.txt` - 如果 Safari 书签在 B 侧
5. 点击 **📤 Gist** 按钮
6. 首次使用：输入你的 GitHub Personal Access Token
7. Token 验证通过后，自动上传并返回 Gist URL

#### 方式 B：导出后再上传

1. 先点击 **导出** 按钮下载 `bookmarks-A-merged.BookmarkHub.txt`
2. 选择对应的导出选项（如 `A · BookmarkHub.txt`）
3. 点击 **📤 Gist** 按钮上传

### 3. 查看和管理 Gist

上传成功后会显示两个 URL：
- **Gist URL**: 网页查看地址（如 `https://gist.github.com/your-username/abc123...`）
- **原始文件 URL**: 直接下载地址（如 `https://gist.githubusercontent.com/...`）

你可以：
- 在 GitHub Gist 页面查看、编辑、删除
- 分享 URL 给其他设备
- 用原始文件 URL 直接导入到 BookmarkHub 扩展

### 4. Token 管理

- **查看状态**: 页面底部会显示"已保存 Token"
- **清除 Token**: 点击"已保存 Token（点击清除）"按钮
- **更换 Token**: 先清除旧 Token，再上传时输入新 Token

## 支持的导出格式

所有格式都支持上传到 Gist：

| 格式 | 文件名 | 适用场景 |
|------|--------|---------|
| BookmarkHub.txt | `BookmarkHub.txt` | 导入到 BookmarkHub 扩展，跨浏览器同步 |
| Edge/Chrome HTML | `bookmarks.edge-chrome.html` | 导入到 Edge/Chrome/Firefox/Brave |
| Safari HTML | `bookmarks.safari.html` | 导入到 Safari |
| 树形 JSON | `bookmarks.tree.json` | 编程处理、自动化脚本 |

## 隐私和安全

- ✅ **Token 本地存储**：保存在浏览器 localStorage，不会上传到任何服务器
- ✅ **私有 Gist**：默认创建私有 Gist（`public: false`），只有你能看到
- ✅ **最小权限**：Token 只需要 `gist` 权限，不能访问你的仓库或其他数据
- ⚠️ **Token 泄露风险**：不要分享你的 Token，定期更换 Token

## 常见问题

### Q: Token 无效或已过期？

**A**: 清除旧 Token 后重新生成。可能原因：
- Token 过期（检查 Expiration 设置）
- Token 被撤销（访问 https://github.com/settings/tokens 检查）
- 权限不足（确认勾选了 `gist` 权限）

### Q: 上传失败 403 Forbidden？

**A**: Token 权限不足或已被撤销。重新生成一个新的 Token。

### Q: 上传失败 422 Unprocessable Entity？

**A**: Gist 内容格式错误。通常不会遇到，除非文件内容损坏。

### Q: 可以上传"全部格式"吗？

**A**: 目前不支持。请选择具体的单个格式（如 `A · BookmarkHub.txt`），然后分别上传。

### Q: 如何下载 Gist 中的书签？

**A**: 
1. 打开 Gist URL
2. 点击 **Raw** 按钮获取原始文件 URL
3. 复制 URL 到 BookmarkHub 扩展的导入功能
4. 或直接下载文件到本地导入

### Q: Token 保存在哪里？安全吗？

**A**: 
- Token 保存在浏览器的 localStorage（本地存储）
- 只在你的浏览器中，不会上传到任何服务器
- 清除浏览器数据会一起清除 Token
- 不同浏览器的 Token 是独立的

## 工作流推荐

### 场景 1：定期备份

```
1. 每周/每月从 Safari 导出书签
2. 导入到工具，选择"仅 A 侧"
3. 导出 BookmarkHub.txt 格式
4. 上传到 Gist（覆盖旧版本或创建新 Gist）
```

### 场景 2：跨设备同步

```
1. Mac Safari 导出 → 上传到 Gist
2. Windows Edge 打开 Gist → 下载 BookmarkHub.txt
3. 用 BookmarkHub 扩展导入
4. 或转换为 Edge HTML 格式导入浏览器
```

### 场景 3：清理后备份

```
1. 导入两份书签（旧 A + 新 B）
2. 审核：删除过时书签，同步新书签
3. 导出清理后的版本
4. 上传到 Gist 作为干净的基准版本
```

## 技术细节

- API: GitHub REST API v3 (`https://api.github.com/gists`)
- 认证: `Authorization: token <YOUR_TOKEN>`
- Gist 类型: Private Gist（`public: false`）
- 文件编码: UTF-8
- 请求方法: POST（创建新 Gist）

## 开发者选项

如果你想自定义 Gist 创建逻辑，可以修改 `index.html` 中的 `btnGist` 点击事件：

```javascript
// 修改为公开 Gist
body: JSON.stringify({
  description,
  public: true,  // 改为 true
  files
})

// 添加多个文件到一个 Gist
const files = {
  'bookmarks.BookmarkHub.txt': { content: bookmarkHubContent },
  'bookmarks.tree.json': { content: treeJsonContent }
};
```

## 相关链接

- GitHub Gist 文档: https://docs.github.com/en/rest/gists
- Personal Access Token 文档: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- BookmarkHub 扩展: https://github.com/nicehash/BookmarkHub

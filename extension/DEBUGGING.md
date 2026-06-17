# 扩展调试指南

## 问题：测试连接和同步没有反应

### 第一步：检查扩展是否正确加载

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions` 或 `edge://extensions`
3. 开启右上角"开发者模式"开关
4. 点击"加载已解压的扩展程序"
5. 选择 `extension/` 目录
6. 检查扩展卡片：
   - ✓ 应该显示 "Bookmark Gist Sync"
   - ✓ 应该显示版本 1.0.0
   - ✓ 没有红色错误提示

### 第二步：检查 Service Worker 状态

1. 在扩展卡片中找到 "Service Worker" 链接
2. 点击链接（会打开 DevTools）
3. 查看控制台：
   - ❌ 如果有红色错误 → 记录错误信息
   - ✓ 如果没有错误 → 继续下一步

**常见错误**：
- `Uncaught SyntaxError` → 代码语法错误
- `importScripts failed` → parser.js 文件路径错误
- `chrome.xxx is not defined` → Manifest 权限配置错误

### 第三步：测试配置页面

1. 点击扩展卡片上的"扩展程序选项"
2. 应该打开配置页面（options.html）
3. 按 F12 打开 DevTools
4. 填写测试数据：
   - **Gist URL**: 使用下面的测试 URL
   - **Token**: 留空（测试公开 Gist）
   - **格式**: 选择"自动检测"

5. 点击"测试连接"按钮
6. 观察：
   - **Network 标签**：应该看到请求 `api.github.com/gists/...`
   - **Console 标签**：查看是否有错误
   - **页面提示**：应该显示成功或失败消息

### 第四步：调试测试连接功能

如果测试连接按钮点击后没反应：

1. **检查事件监听**：
   - 在配置页面的 Console 中输入：
     ```javascript
     document.getElementById('testBtn')
     ```
   - 应该返回按钮元素（不是 null）

2. **手动触发**：
   - 在配置页面的 Console 中输入：
     ```javascript
     chrome.runtime.sendMessage({ action: 'testConnection' }, (response) => {
       console.log('Response:', response);
     });
     ```
   - 查看响应

3. **检查 background.js**：
   - 切换到 Service Worker 的 DevTools
   - 在 Console 中输入：
     ```javascript
     chrome.runtime.onMessage.hasListeners()
     ```
   - 应该返回 `true`

### 第五步：手动测试 Gist API

在配置页面的 Console 中运行：

```javascript
// 测试公开 Gist
fetch('https://api.github.com/gists/你的gist_id')
  .then(r => r.json())
  .then(data => {
    console.log('Gist 数据:', data);
    const files = Object.values(data.files);
    console.log('文件列表:', files.map(f => f.filename));
    console.log('第一个文件内容:', files[0].content);
  })
  .catch(err => console.error('错误:', err));
```

### 测试用的 Gist 数据

如果你还没有测试 Gist，可以创建一个：

**方法 1：使用主项目工具**
1. 访问 https://bm.yangsen666.cloud
2. 点击"☁️ Gist 云端备份"
3. 导入一个简单的书签文件
4. 选择 BookmarkHub.txt 格式
5. 上传到 Gist（可以不填 Token，创建公开 Gist）
6. 复制返回的 Gist URL

**方法 2：手动创建测试 Gist**
1. 访问 https://gist.github.com/
2. 创建新 Gist
3. 文件名：`test-bookmarks.txt`
4. 内容：
```json
{
  "browser": "Mozilla/5.0",
  "version": "0.0.6",
  "createDate": 1718611200000,
  "bookmarks": [
    {
      "children": [
        {
          "title": "测试文件夹",
          "children": [
            {
              "syncing": true,
              "title": "Google",
              "url": "https://www.google.com/"
            },
            {
              "syncing": true,
              "title": "GitHub",
              "url": "https://github.com/"
            }
          ]
        }
      ]
    }
  ]
}
```
5. 点击"Create public gist"
6. 复制 Gist URL（如 `https://gist.github.com/username/abc123...`）

### 第六步：完整测试流程

1. **备份现有书签**：
   - Edge: 设置 → 收藏夹 → 导出收藏夹
   - Chrome: 书签管理器 → 整理 → 将书签导出为 HTML

2. **配置扩展**：
   - 打开扩展选项页
   - 填写 Gist URL
   - 点击"测试连接"
   - 等待成功提示
   - 点击"保存配置"

3. **执行同步**：
   - 点击扩展图标（打开 popup.html）
   - 按 F12 打开 DevTools
   - 点击"⚡ 立即同步"
   - 确认删除警告
   - 观察控制台输出和进度提示

### 常见问题排查

#### 问题 1: 测试连接按钮点击无反应

**可能原因**：
- JavaScript 事件监听器未绑定
- options.js 加载失败

**排查步骤**：
1. 在配置页面 Console 中检查：
   ```javascript
   typeof testConnection
   ```
   应该返回 `"function"`

2. 检查是否有 JavaScript 错误（Console 中红色文字）

#### 问题 2: 提示网络错误

**可能原因**：
- Gist URL 格式错误
- 网络连接问题
- CORS 问题（不应该发生，因为已配置 host_permissions）

**排查步骤**：
1. 检查 Network 标签，查看请求状态码
2. 验证 Gist URL 能在浏览器中正常打开
3. 检查 manifest.json 中的 `host_permissions`

#### 问题 3: 解析书签失败

**可能原因**：
- 文件格式不支持
- parser.js 中的解析逻辑错误

**排查步骤**：
1. 在 Service Worker Console 中测试解析器：
   ```javascript
   // 应该有 parseBookmarks 函数
   typeof parseBookmarks
   ```

2. 手动测试解析：
   ```javascript
   const testData = '{"bookmarks":[{"children":[{"title":"Test","url":"https://test.com"}]}]}';
   const result = parseBookmarks(testData, 'test.txt', 'bookmarkhub');
   console.log(result);
   ```

### 获取帮助

如果以上步骤都无法解决问题，请提供以下信息：

1. **浏览器信息**：Chrome/Edge 版本号
2. **错误截图**：
   - 扩展管理页面的错误提示
   - Service Worker Console 的错误信息
   - 配置页面 Console 的错误信息
3. **测试步骤**：你执行了哪些操作
4. **Gist URL**：你使用的测试 Gist（如果是公开的）

---

**提示**：大多数问题都可以通过查看浏览器 DevTools 的 Console 和 Network 标签找到原因。

# 扩展与网页端互通方案

## 架构设计

```
┌─────────────────────────────────────────────────────┐
│                   网页端                              │
│  https://bm.yangsen666.cloud                        │
│  - 对比、审核、转换、Gist                            │
│  - 完全独立运行                                      │
│  - 新增：检测扩展 + 发送数据到扩展                    │
└─────────────────────────────────────────────────────┘
                     ↕ (消息通信)
┌─────────────────────────────────────────────────────┐
│                  扩展端                               │
│  - 现有：Gist → 浏览器同步                           │
│  - 新增 1：内嵌对比工具                              │
│  - 新增 2：提取浏览器书签                            │
│  - 新增 3：接收网页端数据                            │
└─────────────────────────────────────────────────────┘
```

## 技术方案

### 方案 A：网页 → 扩展通信

使用 `chrome.runtime.sendMessage` (需要扩展 ID)

**网页端检测扩展**：
```javascript
// 检测扩展是否安装
const EXTENSION_ID = 'abcdefghijklmnop'; // 扩展安装后获得

chrome.runtime.sendMessage(
  EXTENSION_ID,
  { action: 'ping' },
  (response) => {
    if (chrome.runtime.lastError) {
      console.log('扩展未安装');
    } else {
      console.log('扩展已安装:', response);
    }
  }
);
```

**网页端发送数据**：
```javascript
chrome.runtime.sendMessage(
  EXTENSION_ID,
  { 
    action: 'importDecisions',
    data: decisionData
  },
  (response) => {
    if (response.success) {
      alert('已发送到扩展！');
    }
  }
);
```

**扩展接收**：
```javascript
// manifest.json 添加
"externally_connectable": {
  "matches": ["https://bm.yangsen666.cloud/*"]
}

// background.js
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === 'ping') {
      sendResponse({ installed: true });
    }
    if (request.action === 'importDecisions') {
      // 处理数据
      sendResponse({ success: true });
    }
  }
);
```

### 方案 B：扩展提取浏览器书签

**基础提取**：
```javascript
// 提取所有书签
async function extractAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  return convertTreeToFormat(tree[0]);
}

// 提取指定文件夹
async function extractFolder(folderId) {
  const subtree = await chrome.bookmarks.getSubTree(folderId);
  return convertTreeToFormat(subtree[0]);
}
```

**UI 选择器**：
```javascript
// 显示书签树供用户选择
async function showBookmarkPicker() {
  const tree = await chrome.bookmarks.getTree();
  // 渲染成可选择的树形结构
  return selectedFolders;
}
```

## 实现步骤

### 第一步：扩展添加对比工具
1. 创建 `compare.html` - 内嵌对比页面
2. 添加提取浏览器书签按钮
3. 实现书签选择器

### 第二步：网页端检测扩展
1. 添加扩展检测代码
2. 显示"发送到扩展"按钮
3. 实现数据传递

### 第三步：联调测试
1. 网页 → 扩展发送
2. 扩展接收并应用
3. 扩展提取 → 导出

## 目录结构

```
extension/
├── manifest.json           # 添加 externally_connectable
├── compare.html           # 新增：对比工具页面
├── compare.js             # 新增：对比逻辑
├── extract.js             # 新增：提取书签逻辑
├── picker.html            # 新增：书签选择器
├── background.js          # 更新：接收外部消息
├── popup.html             # 更新：添加入口按钮
└── popup.js               # 更新：打开对比页面

index.html (网页端)
└── 新增：扩展检测 + 发送按钮
```

## 用户流程

### 流程 1：扩展内对比
```
1. 点击扩展图标
2. 选择"对比书签"
3. 来源 A：选择"浏览器书签" → 选择文件夹
4. 来源 B：上传文件 / 从 Gist 获取
5. 对比审核
6. 点击"应用到浏览器"
```

### 流程 2：网页发送到扩展
```
1. 访问网页端
2. 对比审核完成
3. 看到"发送到扩展"按钮（绿色，检测到扩展）
4. 点击发送
5. 扩展接收并应用
```

### 流程 3：扩展提取导出
```
1. 扩展中选择"提取书签"
2. 选择文件夹（支持多选）
3. 导出为 JSON/HTML
4. 可选：上传到 Gist
```

---

需要我开始实现吗？从哪个部分开始？

1. **扩展内嵌对比工具** + 浏览器书签提取
2. **网页端检测扩展** + 数据发送
3. **两者都做**

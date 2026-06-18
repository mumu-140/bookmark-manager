# Changelog

## [1.7.0] - 2026-06-17

### Added
- **层级选择器**：手动选择从第 1/2/3 层开始导入
- **智能深度检测**：自动检测书签结构深度（最多 3 层）
- **文件夹多选**：当选中层级有多个文件夹时，可勾选要导入的文件夹
- **层级标记**：结构预览显示 [1] [2] [3] 层级标记

### Changed
- **导入逻辑优化**：从固定「展平一层」改为可选层级导入
- **默认推荐**：默认「从第 2 层导入」（最常用场景）
- **智能展平**：最终只有 1 个节点时自动展平

### Fixed
- **多层嵌套问题**：解决 BookmarkHub 等格式的额外容器层级
- **Gist 结构问题**：正确处理 `bookmarks[0] → 书签栏` 的嵌套

### Improved
- 用户完全控制导入层级
- 支持选择性导入（多选文件夹）
- 可视化层级，更直观

### Example
原始结构：
```
└─ [1] bookmarks[0]
    ├─ [2] 书签栏 (12个)
    │   ├─ [3] 小书签栏
    │   └─ ...
    └─ [2] 其他书签
```

选择「从第 2 层导入」→ 提取：书签栏、其他书签  
选择「从第 3 层导入」→ 提取：小书签栏等子文件夹

## [1.6.1] - 2026-06-17

### Fixed
- **弹窗数据传递问题**：解决 URL 参数传递书签数据时的长度限制导致解析失败

### Changed
- **实现方案重构**：从独立弹窗改为 popup 内嵌界面
- **数据传递方式**：从 URL 参数改为内存消息传递
- **用户体验优化**：无需额外窗口，界面切换更流畅

### Removed
- 删除 import-options.html（独立弹窗页面）
- 删除 import-options.js（弹窗逻辑）
- 减少包体积

### Technical
- popup 内两个视图切换（mainView ⇄ importOptionsView）
- 通过 chrome.runtime.sendMessage 传递书签数据
- 数据存储在 pendingBookmarksData 变量
- 紧凑样式适配 popup 尺寸

## [1.6.0] - 2026-06-17

### Added
- **导入选项对话框**：下载前弹出选择界面，解决浏览器顶层目录问题
- **三种导入模式**：
  - 保持原结构（完整保留所有层级）
  - 展平一层（推荐，移除顶层文件夹）
  - 只导入指定文件夹（选择单个文件夹）
- **结构预览**：可视化显示书签树形结构和书签数量
- **智能默认**：根据结构自动推荐最佳导入方式

### Changed
- 下载流程：从「直接导入」改为「预览 → 选择 → 导入」
- 移除配置页的「自动移除顶层文件夹」选项（改为导入时选择）

### Improved
- 用户可见书签结构后再决定导入方式
- 支持选择性导入（只导入某个文件夹的内容）
- 更清晰的用户控制权

### Technical
- 新增 import-options.html/js（选项对话框）
- background.js：拆分 syncBookmarks 和 performImport
- 通过 chrome.windows.create 打开弹窗
- 消息机制：confirmImport / cancelImport

## [1.5.0] - 2026-06-17

### Changed
- **配置界面重构**：分离上传和下载配置，逻辑更清晰
- **配置顺序优化**：上传模式 → 下载配置 → Token → 书签格式
- **字段重命名**：
  - `gistUrl` 拆分为 `uploadGistUrl`（上传目标）和 `downloadGistUrl`（下载源）
  - 移除 `gistId`，从 `uploadGistUrl` 自动提取
- **默认值调整**：上传模式默认为「新建 Gist」（更友好）

### Added
- 固定模式：填写「上传目标 Gist URL」而非 Gist ID
- 自动提取：从 URL 自动提取 Gist ID
- 双向同步支持：上传和下载可使用相同或不同的 Gist URL

### Improved
- 更清晰的配置说明文字
- 更合理的验证逻辑
- 更友好的默认设置（新用户推荐「新建 Gist」模式）

### Technical
- 新增 `extractGistId(url)` 函数
- 配置存储结构优化
- 更清晰的配置分类

## [1.4.0] - 2026-06-17

### Added
- **主界面双向同步**：新增上传和覆盖下载两个独立按钮
- **上传模式选择**：
  - 固定 Gist ID 模式：更新现有 Gist，适合日常备份
  - 新建 Gist 模式：每次创建新 Gist，适合存档备份
- **配置页面增强**：新增上传模式和 Gist ID 配置项
- **智能按钮状态**：根据配置自动启用/禁用上传和下载按钮

### Changed
- 主界面：将「立即同步」拆分为「📤 上传书签」和「📥 覆盖下载」
- 配置验证：固定模式下必须填写 Gist ID
- 进度提示：上传和下载使用独立的进度消息

### Technical
- Background：导入 extract.js，新增 uploadBookmarks、updateGist、createGist 函数
- API 集成：支持 PATCH /gists/{id}（更新）和 POST /gists（创建）
- 消息机制：新增 uploadProgress 和 downloadProgress 两种消息类型

### Workflow
- 完整同步链路：Safari → 提取页 → Gist（上传）→ Edge/Chrome（下载）
- 双向操作：既可从 Gist 下载书签，也可上传书签到 Gist

## [1.3.0] - 2026-06-17

### Added
- 内嵌文件夹选择器：提取页面新增右侧面板，无需弹窗选择文件夹
- 文件夹选择层级联动：取消父目录自动取消所有子孙目录
- 折叠/展开功能：文件夹树支持折叠展开，便于管理大量书签
- 智能提取逻辑：仅选中子目录时自动保留父目录层级结构

### Changed
- 重构提取页面布局：左右分栏设计，主操作区和选择器并列显示
- 优化文件夹选择器 UI：更清晰的视觉反馈和交互体验
- 改进状态管理：选中状态和折叠状态独立持久化

### Fixed
- 修复弹窗模式 window.opener 为 null 导致无法通信的问题
- 修复提取页面 DOM 加载时机导致功能失效的问题
- 修复折叠状态在选择目录时丢失的问题
- 修复选中信息未显示的问题

### Removed
- 移除独立弹窗选择器（picker.html/picker.js）
- 移除调试脚本（debug.js）
- 移除测试文件（test-*.js, test.sh, test-bookmarks.txt）
- 清理生产环境不需要的 console.log

### Documentation
- 文档重组：安装、调试和集成说明已收敛到扩展 README

## [1.2.0] - 2026-06-17

### 新增功能

- ✨ **浏览器书签提取功能**
  - 提取所有书签或自定义选择文件夹（支持多选）
  - 树形可视化文件夹选择器
  - 实时显示选中数量和书签总数
  - 快捷操作：全选、取消全选、仅书签栏
- ✨ **多格式导出**
  - BookmarkHub JSON (.txt)
  - Chromium HTML (.html)
  - 树形 JSON (.json)
- ✨ **导出方式**
  - 下载到本地
  - 上传到 Gist（需配置 Token）
- ✨ **对比工具（简化版）**
  - 从浏览器、文件或 Gist 加载书签
  - 统计数量差异
  - 引导至完整网页版工具
- ✨ **Popup 新增按钮**
  - 📊 对比书签
  - 📤 提取书签

### 技术实现

- chrome.bookmarks API - 读取浏览器书签
- 树形遍历算法 - 递归提取和转换
- window.postMessage - 跨窗口通信
- chrome.windows.create - 弹出选择器窗口
- Blob + URL.createObjectURL - 文件下载

## [1.1.0] - 2026-06-17

### 新增功能

- ✨ 新增"自动移除顶层文件夹"选项（默认开启）
  - 自动识别并展平顶层"个人收藏"/"Bookmarks Bar"等文件夹
  - 适合 Safari 导出的书签（Safari 会自动包裹一层"个人收藏"）
  - 可在配置页面关闭此选项以保留原始结构

### 修复问题

- 🐛 修复 Service Worker 中 DOMParser 不可用的问题
  - HTML 解析改为正则表达式实现
  - 完全兼容 Service Worker 环境
- 🐛 修复 parser.js 中的语法错误（catch 语句缺少参数）

## [1.0.0] - 2026-06-17

### 新增功能

- ✨ 首次发布
- 🔄 从 GitHub Gist 同步书签到 Edge/Chrome
- 📦 支持 BookmarkHub JSON (.txt) 格式
- 📄 支持 Chromium HTML 格式
- 🔍 自动格式检测
- ⚙️ 扩展选项页配置（Gist URL + Token）
- 🔒 Token 本地安全存储
- 🧪 测试连接功能
- 📊 同步状态和进度显示
- ⏰ 上次同步时间显示

### 技术实现

- Manifest V3 架构
- Service Worker 后台同步
- chrome.bookmarks API 书签管理
- chrome.storage.sync 配置存储
- GitHub Gists API 集成
- 支持 Edge 88+、Chrome 88+、Brave 1.20+

### 已知限制

- 仅支持手动触发同步（无自动定时）
- 同步会删除所有现有书签（不可撤销）
- 书签导入到书签栏（无法指定其他位置）

### 安全说明

- Token 仅存储在本地浏览器
- 不收集任何用户数据
- 不向第三方服务器发送数据
- 仅与 GitHub API 通信（用户主动触发）

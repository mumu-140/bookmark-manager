# Changelog

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

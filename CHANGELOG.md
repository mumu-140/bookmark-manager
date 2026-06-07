# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **对比模式新增"原始文件导出"选项**
  - 用户反馈：不做任何审核修改，想直接导出/上传 A 或 B 的完整内容
  - 新增选项组"原始文件（未经审核）"，包含 A/B 四种格式各自的原始导出
  - 导出文件名标记为 `bookmarks-{A|B}-original.*`
  - 支持下载和上传到 Gist
  - 与"审核后的合并结果"选项清晰分组，避免混淆

### Fixed
- **重要修复**：BookmarkHub.txt 格式与 Safari 官方保持一致
  - 修正为双顶层节点结构：`ToolbarFolder` (bookmarks-bar) + `其他收藏夹` (other)
  - 修复前：只有一个 ToolbarFolder，导致从 GitHub 导入和工具导出的路径前缀不匹配
  - 修复后：完全匹配 Safari 导出的 BookmarkHub 扩展官方格式

### Added
- **全新首页设计**：双功能入口选择
  - ☁️ Gist 云端备份模式（单文件转换与上传/下载）
  - ⚖️ 双向对比审核模式（原有功能）
- **Gist 模式新功能**：
  - 导入单个书签文件，转换为任意格式
  - 直接下载到本地或上传到 GitHub Gist
  - 从 Gist URL 下载书签并转换格式
  - 独立的 Token 管理界面
- BookmarkHub.txt 格式导出支持
- GitHub Gist 一键上传功能（对比模式保留）

### Changed
- **重大重构**：首页从单一对比入口改为功能选择界面
- 优化 BookmarkHub 序列化函数，直接转换树形结构，移除中间扁平化步骤
- 更新 README 文档，补充 Gist 模式使用说明
- 三个独立屏幕：首页 / Gist 模式 / 对比模式，导航更清晰

### Fixed
- 修复 BookmarkHub.txt 输出格式，完全匹配 BookmarkHub 扩展规范

## [1.0.0] - 2026-05-23

### Added
- 初始版本发布
- 双向书签对比审核功能
- 支持 Netscape HTML 和 BookmarkHub JSON 输入
- 三种规范化格式导出（Chromium HTML、Safari HTML、树形 JSON）
- URL 归一化与差异检测
- 审核决策 JSON 导出
- Python 辅助脚本（格式转换、决策应用）
- GitHub Pages 和 Cloudflare Pages 部署支持

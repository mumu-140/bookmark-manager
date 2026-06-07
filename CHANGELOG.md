# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- BookmarkHub.txt 格式导出支持
- GitHub Gist 一键上传功能
  - 支持所有导出格式（Edge/Chrome HTML、Safari HTML、树形 JSON、BookmarkHub.txt）
  - Token 管理：保存、查看状态、清除
  - 自动创建私有 Gist
- 导出选项新增 A/B 侧的 BookmarkHub.txt 单独导出

### Changed
- 更新 README 文档，补充 BookmarkHub 格式规格说明
- 优化 .gitignore，自动排除临时数据目录

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

# Chrome/Edge 扩展快速安装指南

## 安装步骤（5 分钟）

### 1. 下载扩展文件

**方法 A：克隆整个项目**
```bash
git clone https://github.com/mumu-140/bookmark-manager.git
cd bookmark-manager/extension
```

**方法 B：仅下载 extension 文件夹**
- 访问 https://github.com/mumu-140/bookmark-manager
- 点击 Code → Download ZIP
- 解压后进入 `bookmark-manager-main/extension/` 目录

### 2. 在浏览器中加载扩展

#### Edge 浏览器
1. 打开 `edge://extensions`
2. 开启右上角"开发人员模式"开关
3. 点击"加载解压缩的扩展"
4. 选择 `extension` 文件夹
5. 扩展图标出现在工具栏

#### Chrome 浏览器
1. 打开 `chrome://extensions`
2. 开启右上角"开发者模式"开关
3. 点击"加载已解压的扩展程序"
4. 选择 `extension` 文件夹
5. 扩展图标出现在工具栏

### 3. 配置扩展

1. **获取 Gist URL**：
   - 访问 https://bms.yanggod.bond
   - 导入 Safari 书签 → 选择格式 → 上传到 Gist
   - 复制返回的 Gist URL

2. **配置扩展**：
   - 点击扩展图标
   - 点击"⚙️ 配置"
   - 粘贴 Gist URL
   - （可选）填写 GitHub Token（仅私有 Gist 需要）
   - 点击"测试连接"验证
   - 点击"保存配置"

### 4. 首次同步

⚠️ **重要提示**：同步会删除所有现有书签，请先备份！

**备份方法**：
- Edge：设置 → 收藏夹 → 导出收藏夹
- Chrome：书签管理器 → 整理 → 将书签导出为 HTML 文件

**执行同步**：
1. 点击扩展图标
2. 点击"⚡ 立即同步"
3. 确认警告对话框
4. 等待同步完成（显示成功消息）
5. 刷新书签栏查看新书签

## 常见问题

### Q: 为什么需要"开发者模式"？

A: 扩展未发布到应用商店，需要通过开发者模式手动加载。功能完全正常，不影响使用。

### Q: 扩展会自动更新吗？

A: 不会。需要手动下载新版本并重新加载。

### Q: Token 是否必需？

A: 仅访问私有 Gist 时需要。公开 Gist 可直接同步。

### Q: 同步会删除收藏夹栏吗？

A: 会删除所有书签，然后导入 Gist 中的书签到书签栏。

### Q: 支持定时自动同步吗？

A: 当前版本仅支持手动同步。未来可能添加定时功能。

## 获取帮助

- [完整文档](README.md)
- [问题反馈](https://github.com/mumu-140/bookmark-manager/issues)
- [主项目说明](https://github.com/mumu-140/bookmark-manager)

---

**首次使用建议**：先用测试书签验证流程，确认无误后再同步重要书签。

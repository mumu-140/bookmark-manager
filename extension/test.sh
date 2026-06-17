#!/bin/bash

# 扩展快速测试脚本
# 使用 Playwright Chromium 加载扩展

CHROMIUM_PATH="/Users/mumu/playwright-browsers/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
EXTENSION_PATH="$(pwd)"

echo "=== Bookmark Gist Sync 扩展测试 ==="
echo ""
echo "扩展路径: $EXTENSION_PATH"
echo "Chromium: $CHROMIUM_PATH"
echo ""

# 检查文件是否存在
if [ ! -f "$CHROMIUM_PATH" ]; then
    echo "❌ 错误: Chromium 可执行文件不存在"
    exit 1
fi

if [ ! -f "manifest.json" ]; then
    echo "❌ 错误: 请在 extension/ 目录下运行此脚本"
    exit 1
fi

echo "✓ 所有文件检查通过"
echo ""
echo "正在启动 Chromium..."
echo ""

# 启动 Chromium 并加载扩展
"$CHROMIUM_PATH" \
    --disable-extensions-except="$EXTENSION_PATH" \
    --load-extension="$EXTENSION_PATH" \
    --no-first-run \
    --no-default-browser-check \
    "chrome://extensions" &

CHROMIUM_PID=$!

echo "✓ Chromium 已启动 (PID: $CHROMIUM_PID)"
echo ""
echo "=== 测试指南 ==="
echo ""
echo "1. 检查扩展是否已加载"
echo "   - 在扩展管理页面中应该看到 'Bookmark Gist Sync'"
echo "   - 检查是否有错误提示（红色文字）"
echo ""
echo "2. 点击 'Service Worker' 链接"
echo "   - 查看控制台是否有错误"
echo "   - 应该看到 'importScripts' 加载了 parser.js"
echo ""
echo "3. 点击 '扩展程序选项'"
echo "   - 打开配置页面"
echo "   - 按 F12 打开开发者工具"
echo "   - 填写测试 Gist URL"
echo "   - 点击 '测试连接' 按钮"
echo ""
echo "4. 点击扩展图标"
echo "   - 查看弹出窗口状态"
echo "   - 按 F12 打开开发者工具"
echo "   - 尝试点击 '立即同步'"
echo ""
echo "=== 测试用 Gist URL ==="
echo ""
echo "如果你还没有测试 Gist，可以："
echo "1. 访问 https://bms.yanggod.bond"
echo "2. 上传一个简单的书签文件"
echo "3. 复制返回的 Gist URL"
echo ""
echo "或者创建一个包含以下内容的公开 Gist："
echo "文件名: test-bookmarks.txt"
echo "内容: 见 DEBUGGING.md 中的示例"
echo ""
echo "按 Ctrl+C 关闭浏览器"
echo ""

# 等待用户关闭
wait $CHROMIUM_PID
echo ""
echo "浏览器已关闭"

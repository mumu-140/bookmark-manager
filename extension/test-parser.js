#!/usr/bin/env node

/**
 * 扩展功能测试脚本
 * 在 Node.js 环境中测试解析器逻辑
 */

const fs = require('fs');
const path = require('path');

// 模拟浏览器环境
global.self = {};

// 加载解析器
eval(fs.readFileSync(path.join(__dirname, 'parser.js'), 'utf8'));

console.log('=== 测试书签解析器 ===\n');

// 测试 1: BookmarkHub JSON 格式
console.log('测试 1: BookmarkHub JSON 格式');
const bookmarkHubJson = {
  "bookmarks": [{
    "children": [
      {
        "title": "技术文档",
        "children": [
          {
            "title": "Google",
            "url": "https://google.com",
            "syncing": true
          },
          {
            "title": "GitHub",
            "url": "https://github.com",
            "syncing": true
          }
        ]
      }
    ]
  }]
};

try {
  const content = JSON.stringify(bookmarkHubJson);
  const result = parseBookmarks(content, 'test.txt', 'bookmarkhub');
  const count = countBookmarks(result);
  console.log(`✓ 解析成功: ${count} 个书签`);
  console.log('  结构:', JSON.stringify(result, null, 2));
} catch (e) {
  console.error('✗ 解析失败:', e.message);
}

// 测试 2: Chromium HTML 格式
console.log('\n测试 2: Chromium HTML 格式');
const chromiumHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1234567890" LAST_MODIFIED="1234567890">个人收藏</H3>
    <DL><p>
        <DT><A HREF="https://example.com/" ADD_DATE="1234567890">Example</A>
        <DT><H3 ADD_DATE="1234567890">子文件夹</H3>
        <DL><p>
            <DT><A HREF="https://test.com/" ADD_DATE="1234567890">Test Site</A>
        </DL><p>
    </DL><p>
</DL><p>`;

try {
  const result = parseBookmarks(chromiumHtml, 'test.html', 'html');
  const count = countBookmarks(result);
  console.log(`✓ 解析成功: ${count} 个书签`);
  console.log('  结构:', JSON.stringify(result, null, 2));
} catch (e) {
  console.error('✗ 解析失败:', e.message);
}

// 测试 3: 自动格式检测
console.log('\n测试 3: 自动格式检测');
try {
  const format1 = detectFormat(JSON.stringify(bookmarkHubJson), 'bookmarks.txt');
  console.log(`✓ BookmarkHub 检测: ${format1}`);

  const format2 = detectFormat(chromiumHtml, 'bookmarks.html');
  console.log(`✓ Chromium HTML 检测: ${format2}`);
} catch (e) {
  console.error('✗ 格式检测失败:', e.message);
}

// 测试 4: 错误处理
console.log('\n测试 4: 错误处理');
try {
  parseBookmarks('invalid json', 'test.txt', 'bookmarkhub');
  console.error('✗ 应该抛出错误但没有');
} catch (e) {
  console.log(`✓ 正确捕获错误: ${e.message}`);
}

console.log('\n=== 所有测试完成 ===');

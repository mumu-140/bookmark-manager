/**
 * 简单的扩展调试工具
 * 检查文件语法和常见错误
 */

const fs = require('fs');
const path = require('path');

console.log('=== 扩展代码检查 ===\n');

// 检查 1: manifest.json
console.log('1. 检查 manifest.json');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  console.log('   ✓ JSON 格式正确');
  console.log('   ✓ background:', manifest.background.service_worker);
  console.log('   ✓ permissions:', manifest.permissions.join(', '));

  // 检查文件是否存在
  const files = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    manifest.options_page
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✓ ${file} 存在`);
    } else {
      console.log(`   ✗ ${file} 不存在`);
    }
  });
} catch (e) {
  console.log('   ✗ 错误:', e.message);
}

// 检查 2: background.js 语法
console.log('\n2. 检查 background.js');
try {
  const content = fs.readFileSync('background.js', 'utf8');

  // 检查是否有 importScripts
  if (content.includes('importScripts')) {
    const match = content.match(/importScripts\(['"]([^'"]+)['"]\)/);
    if (match) {
      const importedFile = match[1];
      if (fs.existsSync(importedFile)) {
        console.log(`   ✓ importScripts('${importedFile}') - 文件存在`);
      } else {
        console.log(`   ✗ importScripts('${importedFile}') - 文件不存在`);
      }
    }
  }

  // 检查是否有语法错误（简单检查）
  const lines = content.split('\n');
  let hasError = false;

  lines.forEach((line, i) => {
    // 检查未闭合的 try-catch
    if (line.includes('} catch') && !line.includes('(')) {
      console.log(`   ⚠ 第 ${i + 1} 行: catch 语句可能缺少参数`);
      hasError = true;
    }
  });

  if (!hasError) {
    console.log('   ✓ 未发现明显的语法错误');
  }
} catch (e) {
  console.log('   ✗ 错误:', e.message);
}

// 检查 3: parser.js 语法
console.log('\n3. 检查 parser.js');
try {
  const content = fs.readFileSync('parser.js', 'utf8');

  // 检查 catch 语句
  const catchMatches = content.match(/}\s*catch(?!\s*\()/g);
  if (catchMatches && catchMatches.length > 0) {
    console.log(`   ✗ 发现 ${catchMatches.length} 个 catch 语句缺少参数`);
  } else {
    console.log('   ✓ catch 语句正确');
  }

  // 检查是否导出函数
  if (content.includes('self.parseBookmarks')) {
    console.log('   ✓ 已导出 parseBookmarks 函数');
  } else {
    console.log('   ⚠ 未找到函数导出');
  }
} catch (e) {
  console.log('   ✗ 错误:', e.message);
}

// 检查 4: 消息监听器
console.log('\n4. 检查消息处理');
try {
  const bgContent = fs.readFileSync('background.js', 'utf8');

  const hasListener = bgContent.includes('chrome.runtime.onMessage.addListener');
  const hasSync = bgContent.includes("action === 'sync'");
  const hasTestConnection = bgContent.includes("action === 'testConnection'");
  const hasGetConfig = bgContent.includes("action === 'getConfig'");

  console.log(`   ${hasListener ? '✓' : '✗'} 有消息监听器`);
  console.log(`   ${hasSync ? '✓' : '✗'} 处理 'sync' 动作`);
  console.log(`   ${hasTestConnection ? '✓' : '✗'} 处理 'testConnection' 动作`);
  console.log(`   ${hasGetConfig ? '✓' : '✗'} 处理 'getConfig' 动作`);
} catch (e) {
  console.log('   ✗ 错误:', e.message);
}

// 检查 5: options.js 和 popup.js
console.log('\n5. 检查前端脚本');
['options.js', 'popup.js'].forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');

    const hasSendMessage = content.includes('chrome.runtime.sendMessage');
    const hasStorageGet = content.includes('chrome.storage.sync.get');

    console.log(`   ${file}:`);
    console.log(`     ${hasSendMessage ? '✓' : '⚠'} 使用 chrome.runtime.sendMessage`);
    console.log(`     ${hasStorageGet ? '✓' : '⚠'} 使用 chrome.storage.sync`);
  } catch (e) {
    console.log(`   ✗ ${file}: ${e.message}`);
  }
});

console.log('\n=== 检查完成 ===');
console.log('\n建议：');
console.log('1. 在浏览器中打开 chrome://extensions');
console.log('2. 开启开发者模式');
console.log('3. 加载扩展后，点击"Service Worker"链接查看日志');
console.log('4. 打开配置页面，按 F12 查看控制台错误');
console.log('5. 点击"测试连接"按钮，观察网络请求和错误信息');

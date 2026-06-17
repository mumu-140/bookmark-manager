/**
 * 使用 Playwright 测试扩展功能
 */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('=== 启动 Chromium 并加载扩展 ===\n');

  const extensionPath = path.join(__dirname);

  // 启动带扩展的浏览器
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  console.log('✓ 浏览器已启动');
  console.log('✓ 扩展已加载');

  // 获取扩展 ID
  let extensionId;
  for (const page of context.pages()) {
    if (page.url().startsWith('chrome-extension://')) {
      extensionId = new URL(page.url()).host;
      break;
    }
  }

  if (!extensionId) {
    // 打开扩展管理页面获取 ID
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(2000);

    console.log('\n请在浏览器中：');
    console.log('1. 检查扩展是否已加载');
    console.log('2. 查看是否有错误信息');
    console.log('3. 复制扩展 ID（一串字母）');
    console.log('\n按 Enter 继续测试，或 Ctrl+C 退出');

    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // 手动输入扩展 ID
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    extensionId = await new Promise(resolve => {
      readline.question('请输入扩展 ID: ', (answer) => {
        readline.close();
        resolve(answer.trim());
      });
    });
  }

  console.log(`\n✓ 扩展 ID: ${extensionId}`);

  // 测试配置页面
  console.log('\n=== 测试配置页面 ===');
  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
  await optionsPage.waitForTimeout(1000);

  console.log('✓ 配置页面已打开');
  console.log('  - 检查页面是否正常显示');
  console.log('  - 尝试填写 Gist URL');

  // 测试弹出窗口
  console.log('\n=== 测试弹出窗口 ===');
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await popupPage.waitForTimeout(1000);

  console.log('✓ 弹出窗口已打开');
  console.log('  - 检查状态显示');
  console.log('  - 检查按钮是否正常');

  // 检查后台脚本错误
  console.log('\n=== 检查后台脚本 ===');
  context.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[Console Error] ${msg.text()}`);
    }
  });

  console.log('\n扩展已加载，窗口保持打开状态');
  console.log('请手动测试以下功能：');
  console.log('1. 在配置页填写测试 Gist URL');
  console.log('2. 点击"测试连接"按钮');
  console.log('3. 在弹出窗口点击"立即同步"');
  console.log('4. 观察控制台输出');
  console.log('\n按 Ctrl+C 退出');

  // 保持运行
  await new Promise(() => {});

})().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});

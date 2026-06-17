/**
 * Popup Script - 弹出窗口逻辑
 */

const syncBtn = document.getElementById('syncBtn');
const syncBtnText = document.getElementById('syncBtnText');
const configStatusEl = document.getElementById('configStatus');
const lastSyncEl = document.getElementById('lastSync');
const messageEl = document.getElementById('message');
const optionsBtn = document.getElementById('optionsBtn');
const helpBtn = document.getElementById('helpBtn');
const compareBtn = document.getElementById('compareBtn');
const extractBtn = document.getElementById('extractBtn');

let isSyncing = false;

/**
 * 显示消息
 */
function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = `message message-${type} show`;
}

/**
 * 隐藏消息
 */
function hideMessage() {
  messageEl.classList.remove('show');
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  if (!timestamp) return '从未同步';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 少于 1 分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 少于 1 小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} 分钟前`;
  }

  // 少于 24 小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} 小时前`;
  }

  // 显示日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`;
  }

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 加载配置状态
 */
function loadStatus() {
  chrome.storage.sync.get(['gistUrl', 'lastSync'], (result) => {
    // 配置状态
    if (result.gistUrl) {
      configStatusEl.innerHTML = '<span class="status status-configured">✓ 已配置</span>';
      syncBtn.disabled = false;
    } else {
      configStatusEl.innerHTML = '<span class="status status-not-configured">未配置</span>';
      syncBtn.disabled = true;
      showMessage('请先点击"⚙️ 配置"按钮设置 Gist URL', 'info');
    }

    // 上次同步时间
    lastSyncEl.textContent = formatTime(result.lastSync);
  });
}

/**
 * 执行同步
 */
function performSync() {
  if (isSyncing) return;

  // 二次确认
  const confirmed = confirm(
    '⚠️ 重要提示\n\n' +
    '同步操作将：\n' +
    '1. 删除所有现有书签\n' +
    '2. 从 Gist 导入新书签\n\n' +
    '此操作不可撤销，请确保已备份重要书签！\n\n' +
    '确定要继续吗？'
  );

  if (!confirmed) return;

  isSyncing = true;
  syncBtn.disabled = true;
  syncBtnText.innerHTML = '<span class="spinner"></span> 同步中...';
  hideMessage();

  // 发送同步请求到 background
  chrome.runtime.sendMessage({ action: 'sync' }, (response) => {
    // 同步请求已发送，等待进度更新
  });
}

/**
 * 监听来自 background 的进度更新
 */
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'syncProgress') {
    const { status, message, count, timestamp } = request.data;

    if (status === 'loading') {
      // 同步进行中
      syncBtnText.innerHTML = `<span class="spinner"></span> ${message}`;
    } else if (status === 'success') {
      // 同步成功
      isSyncing = false;
      syncBtn.disabled = false;
      syncBtnText.textContent = '✓ 同步成功';

      showMessage(message, 'success');

      // 更新上次同步时间
      if (timestamp) {
        lastSyncEl.textContent = formatTime(timestamp);
      }

      // 3 秒后恢复按钮文本
      setTimeout(() => {
        syncBtnText.textContent = '⚡ 立即同步';
      }, 3000);
    } else if (status === 'error') {
      // 同步失败
      isSyncing = false;
      syncBtn.disabled = false;
      syncBtnText.textContent = '✗ 同步失败';

      showMessage(`同步失败：${message}`, 'error');

      // 3 秒后恢复按钮文本
      setTimeout(() => {
        syncBtnText.textContent = '⚡ 立即同步';
        loadStatus(); // 重新检查配置
      }, 3000);
    }
  }
});

/**
 * 打开对比页面
 */
function openCompare() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('compare.html')
  });
  window.close();
}

/**
 * 打开提取书签页面
 */
function openExtract() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('extract.html')
  });
  window.close();
}

/**
 * 打开配置页
 */
function openOptions() {
  chrome.runtime.openOptionsPage();
}

/**
 * 打开帮助页
 */
function openHelp() {
  chrome.tabs.create({
    url: 'https://github.com/mumu-140/bookmark-manager#readme'
  });
}

// 事件监听
syncBtn.addEventListener('click', performSync);
compareBtn.addEventListener('click', openCompare);
extractBtn.addEventListener('click', openExtract);
optionsBtn.addEventListener('click', openOptions);
helpBtn.addEventListener('click', openHelp);

// 页面加载时加载状态
loadStatus();

// 定期更新上次同步时间显示（每分钟）
setInterval(() => {
  chrome.storage.sync.get(['lastSync'], (result) => {
    if (result.lastSync) {
      lastSyncEl.textContent = formatTime(result.lastSync);
    }
  });
}, 60000);

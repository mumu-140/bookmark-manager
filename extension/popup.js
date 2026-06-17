/**
 * Popup Script - 弹出窗口逻辑
 */

const mainView = document.getElementById('mainView');
const importOptionsView = document.getElementById('importOptionsView');
const uploadBtn = document.getElementById('uploadBtn');
const uploadBtnText = document.getElementById('uploadBtnText');
const downloadBtn = document.getElementById('downloadBtn');
const downloadBtnText = document.getElementById('downloadBtnText');
const configStatusEl = document.getElementById('configStatus');
const lastSyncEl = document.getElementById('lastSync');
const messageEl = document.getElementById('message');
const optionsBtn = document.getElementById('optionsBtn');
const helpBtn = document.getElementById('helpBtn');
const compareBtn = document.getElementById('compareBtn');
const extractBtn = document.getElementById('extractBtn');

// 导入选项界面元素
const structurePreview = document.getElementById('structurePreview');
const totalCountEl = document.getElementById('totalCount');
const folderSelectCompact = document.getElementById('folderSelectCompact');
const targetFolderCompact = document.getElementById('targetFolderCompact');
const confirmImportBtn = document.getElementById('confirmImportBtn');
const cancelImportBtn = document.getElementById('cancelImportBtn');

let isUploading = false;
let isDownloading = false;
let pendingBookmarksData = null; // 存储待导入的书签数据

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

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

/**
 * 统计书签数量
 */
function countBookmarks(nodes) {
  let count = 0;
  function walk(node) {
    if (node.url) {
      count++;
    } else if (node.children) {
      node.children.forEach(walk);
    }
  }
  if (Array.isArray(nodes)) {
    nodes.forEach(walk);
  } else {
    walk(nodes);
  }
  return count;
}

/**
 * 生成结构预览
 */
function generateStructurePreview(nodes, indent = 0) {
  let html = '';
  const prefix = '  '.repeat(indent);

  for (const node of nodes) {
    if (node.children) {
      const count = countBookmarks(node.children);
      html += `<div class="structure-item folder">${prefix}└─ ${node.title} <span class="count">(${count} 个)</span></div>`;
      if (indent === 0) {
        html += generateStructurePreview(node.children, indent + 1);
      }
    }
  }

  return html;
}

/**
 * 填充文件夹选择器
 */
function populateFolderSelect(nodes) {
  targetFolderCompact.innerHTML = '';

  function addOptions(nodes, indent = 0) {
    const prefix = '  '.repeat(indent);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.children) {
        const count = countBookmarks(node.children);
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${prefix}${node.title} (${count} 个)`;
        targetFolderCompact.appendChild(option);
      }
    }
  }

  addOptions(nodes);
}

/**
 * 显示导入选项界面
 */
function showImportOptions(bookmarks) {
  pendingBookmarksData = bookmarks;

  // 生成结构预览
  structurePreview.innerHTML = generateStructurePreview(bookmarks);

  // 统计总数
  const totalCount = countBookmarks(bookmarks);
  totalCountEl.textContent = totalCount;

  // 填充文件夹选择器
  populateFolderSelect(bookmarks);

  // 智能默认选择
  if (bookmarks.length === 1 && bookmarks[0].children) {
    document.querySelector('input[value="flatten"]').checked = true;
  } else {
    document.querySelector('input[value="keep"]').checked = true;
  }

  updateRadioStyles();

  // 切换界面
  mainView.classList.add('hide');
  importOptionsView.classList.add('show');
}

/**
 * 隐藏导入选项界面
 */
function hideImportOptions() {
  mainView.classList.remove('hide');
  importOptionsView.classList.remove('show');
  pendingBookmarksData = null;
}

/**
 * 更新单选框样式
 */
function updateRadioStyles() {
  document.querySelectorAll('.radio-option-compact').forEach(option => {
    const radio = option.querySelector('input[type="radio"]');
    if (radio.checked) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });

  const selectedMode = document.querySelector('input[name="importMode"]:checked').value;
  if (selectedMode === 'specific') {
    folderSelectCompact.classList.add('show');
  } else {
    folderSelectCompact.classList.remove('show');
  }
}

/**
 * 确认导入
 */
function confirmImport() {
  const importMode = document.querySelector('input[name="importMode"]:checked').value;
  const selectedFolderIndex = targetFolderCompact.value;

  let processedBookmarks = pendingBookmarksData;

  // 根据选择处理书签
  if (importMode === 'flatten') {
    if (pendingBookmarksData.length === 1 && pendingBookmarksData[0].children) {
      processedBookmarks = pendingBookmarksData[0].children;
    }
  } else if (importMode === 'specific') {
    const selectedFolder = pendingBookmarksData[parseInt(selectedFolderIndex)];
    if (selectedFolder && selectedFolder.children) {
      processedBookmarks = selectedFolder.children;
    }
  }

  // 隐藏选项界面
  hideImportOptions();

  // 发送确认导入消息
  chrome.runtime.sendMessage({
    action: 'confirmImport',
    data: {
      bookmarks: processedBookmarks,
      mode: importMode
    }
  });
}

/**
 * 取消导入
 */
function cancelImport() {
  hideImportOptions();
  chrome.runtime.sendMessage({ action: 'cancelImport' });
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
  chrome.storage.sync.get(['uploadGistUrl', 'downloadGistUrl', 'githubToken', 'lastSync', 'uploadMode'], (result) => {
    // 配置状态
    const hasDownloadConfig = !!result.downloadGistUrl;
    const hasUploadConfig = !!result.githubToken && (result.uploadMode !== 'fixed' || !!result.uploadGistUrl);

    if (hasDownloadConfig || hasUploadConfig) {
      configStatusEl.innerHTML = '<span class="status status-configured">✓ 已配置</span>';
    } else {
      configStatusEl.innerHTML = '<span class="status status-not-configured">未配置</span>';
    }

    // 按钮状态
    downloadBtn.disabled = !hasDownloadConfig;
    uploadBtn.disabled = !hasUploadConfig;

    // 提示信息
    if (!hasDownloadConfig && !hasUploadConfig) {
      showMessage('请先点击"⚙️ 配置"按钮进行配置', 'info');
    } else if (!hasDownloadConfig) {
      showMessage('请先配置下载源 Gist URL 以使用下载功能', 'info');
    } else if (!hasUploadConfig) {
      const msg = result.uploadMode === 'fixed'
        ? '请先配置 GitHub Token 和上传目标 Gist URL'
        : '请先配置 GitHub Token 以使用上传功能';
      showMessage(msg, 'info');
    }

    // 上次同步时间
    lastSyncEl.textContent = formatTime(result.lastSync);
  });
}

/**
 * 执行上传
 */
function performUpload() {
  if (isUploading) return;

  // 二次确认
  const confirmed = confirm(
    '⚠️ 上传确认\n\n' +
    '即将上传当前浏览器的所有书签到 Gist\n\n' +
    '确定要继续吗？'
  );

  if (!confirmed) return;

  isUploading = true;
  uploadBtn.disabled = true;
  uploadBtnText.innerHTML = '<span class="spinner"></span> 上传中...';
  hideMessage();

  // 发送上传请求到 background
  chrome.runtime.sendMessage({ action: 'upload' }, (response) => {
    // 上传请求已发送，等待进度更新
  });
}

/**
 * 执行下载（原 performSync）
 */
function performDownload() {
  if (isDownloading) return;

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

  isDownloading = true;
  downloadBtn.disabled = true;
  downloadBtnText.innerHTML = '<span class="spinner"></span> 下载中...';
  hideMessage();

  // 发送下载请求到 background
  chrome.runtime.sendMessage({ action: 'download' }, (response) => {
    // 下载请求已发送，等待进度更新
  });
}

/**
 * 监听来自 background 的进度更新
 */
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'showImportOptions') {
    // 显示导入选项界面
    const { bookmarks } = request.data;
    showImportOptions(bookmarks);
  } else if (request.action === 'uploadProgress') {
    const { status, message, count, gistUrl, timestamp } = request.data;

    if (status === 'loading') {
      // 上传进行中
      uploadBtnText.innerHTML = `<span class="spinner"></span> ${message}`;
    } else if (status === 'success') {
      // 上传成功
      isUploading = false;
      uploadBtn.disabled = false;
      uploadBtnText.textContent = '✓ 上传成功';

      let msg = message;
      if (gistUrl) {
        msg += `\n\nGist URL: ${gistUrl}`;
      }
      showMessage(msg, 'success');

      // 3 秒后恢复按钮文本
      setTimeout(() => {
        uploadBtnText.textContent = '📤 上传书签';
      }, 3000);
    } else if (status === 'error') {
      // 上传失败
      isUploading = false;
      uploadBtn.disabled = false;
      uploadBtnText.textContent = '✗ 上传失败';

      showMessage(`上传失败：${message}`, 'error');

      // 3 秒后恢复按钮文本
      setTimeout(() => {
        uploadBtnText.textContent = '📤 上传书签';
        loadStatus(); // 重新检查配置
      }, 3000);
    }
  } else if (request.action === 'downloadProgress' || request.action === 'syncProgress') {
    const { status, message, count, timestamp } = request.data;

    if (status === 'loading') {
      // 下载进行中
      downloadBtnText.innerHTML = `<span class="spinner"></span> ${message}`;
    } else if (status === 'success') {
      // 下载成功
      isDownloading = false;
      downloadBtn.disabled = false;
      downloadBtnText.textContent = '✓ 下载成功';

      showMessage(message, 'success');

      // 更新上次同步时间
      if (timestamp) {
        lastSyncEl.textContent = formatTime(timestamp);
      }

      // 3 秒后恢复按钮文本
      setTimeout(() => {
        downloadBtnText.textContent = '📥 覆盖下载';
      }, 3000);
    } else if (status === 'error') {
      // 下载失败
      isDownloading = false;
      downloadBtn.disabled = false;
      downloadBtnText.textContent = '✗ 下载失败';

      showMessage(`下载失败：${message}`, 'error');

      // 3 秒后恢复按钮文本
      setTimeout(() => {
        downloadBtnText.textContent = '📥 覆盖下载';
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
uploadBtn.addEventListener('click', performUpload);
downloadBtn.addEventListener('click', performDownload);
compareBtn.addEventListener('click', openCompare);
extractBtn.addEventListener('click', openExtract);
optionsBtn.addEventListener('click', openOptions);
helpBtn.addEventListener('click', openHelp);

// 导入选项界面事件监听
document.querySelectorAll('input[name="importMode"]').forEach(radio => {
  radio.addEventListener('change', updateRadioStyles);
});

document.querySelectorAll('.radio-option-compact').forEach(option => {
  option.addEventListener('click', () => {
    const radio = option.querySelector('input[type="radio"]');
    radio.checked = true;
    updateRadioStyles();
  });
});

confirmImportBtn.addEventListener('click', confirmImport);
cancelImportBtn.addEventListener('click', cancelImport);

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

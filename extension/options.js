/**
 * Options Page Script - 配置页逻辑
 */

const form = document.getElementById('configForm');
const uploadGistUrlInput = document.getElementById('uploadGistUrl');
const downloadGistUrlInput = document.getElementById('downloadGistUrl');
const uploadGistUrlGroup = document.getElementById('uploadGistUrlGroup');
const githubTokenInput = document.getElementById('githubToken');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const alertBox = document.getElementById('alert');

/**
 * 显示提示消息
 */
function showAlert(message, type = 'info') {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type} show`;

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      alertBox.classList.remove('show');
    }, 5000);
  }
}

/**
 * 根据上传模式更新上传目标 Gist URL 输入框的可见性
 */
function updateUploadGistUrlVisibility() {
  const uploadMode = document.querySelector('input[name="uploadMode"]:checked')?.value;
  if (uploadMode === 'fixed') {
    uploadGistUrlGroup.style.display = 'block';
  } else {
    uploadGistUrlGroup.style.display = 'none';
  }
}

/**
 * 加载已保存的配置
 */
function loadConfig() {
  chrome.storage.sync.get(['uploadGistUrl', 'downloadGistUrl', 'githubToken', 'preferredFormat', 'flattenTopFolder', 'uploadMode'], (result) => {
    // 加载上传目标 Gist URL
    if (result.uploadGistUrl) {
      uploadGistUrlInput.value = result.uploadGistUrl;
    }

    // 加载下载源 Gist URL
    if (result.downloadGistUrl) {
      downloadGistUrlInput.value = result.downloadGistUrl;
    }

    // 加载 Token
    if (result.githubToken) {
      githubTokenInput.value = result.githubToken;
    }

    // 加载书签格式
    if (result.preferredFormat) {
      const radio = document.querySelector(`input[name="format"][value="${result.preferredFormat}"]`);
      if (radio) {
        radio.checked = true;
      }
    }

    // 加载展平选项（默认为 true）
    const flattenCheckbox = document.getElementById('flattenTopFolder');
    if (flattenCheckbox) {
      flattenCheckbox.checked = result.flattenTopFolder !== false;
    }

    // 加载上传模式（默认为 new）
    const uploadMode = result.uploadMode || 'new';
    const uploadModeRadio = document.querySelector(`input[name="uploadMode"][value="${uploadMode}"]`);
    if (uploadModeRadio) {
      uploadModeRadio.checked = true;
    }

    // 根据上传模式显示/隐藏上传目标 URL 输入框
    updateUploadGistUrlVisibility();
  });
}

/**
 * 保存配置
 */
function saveConfig(e) {
  e.preventDefault();

  const uploadGistUrl = uploadGistUrlInput.value.trim();
  const downloadGistUrl = downloadGistUrlInput.value.trim();
  const githubToken = githubTokenInput.value.trim();
  const preferredFormat = document.querySelector('input[name="format"]:checked').value;
  const flattenTopFolder = document.getElementById('flattenTopFolder').checked;
  const uploadMode = document.querySelector('input[name="uploadMode"]:checked').value;

  // 验证：固定模式需要上传目标 URL
  if (uploadMode === 'fixed' && !uploadGistUrl) {
    showAlert('固定模式需要填写上传目标 Gist URL', 'error');
    uploadGistUrlInput.focus();
    return;
  }

  // 验证：固定模式的 URL 格式
  if (uploadMode === 'fixed' && uploadGistUrl) {
    if (!uploadGistUrl.includes('gist.github.com') && !uploadGistUrl.includes('githubusercontent.com')) {
      showAlert('无效的 Gist URL。请使用 gist.github.com 或 raw.githubusercontent.com 域名', 'error');
      return;
    }
  }

  // 验证：下载源 URL 格式（如果填写了）
  if (downloadGistUrl && !downloadGistUrl.includes('gist.github.com') && !downloadGistUrl.includes('githubusercontent.com')) {
    showAlert('无效的下载源 Gist URL。请使用 gist.github.com 或 raw.githubusercontent.com 域名', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = '保存中...';

  chrome.storage.sync.set(
    {
      uploadGistUrl: uploadGistUrl,
      downloadGistUrl: downloadGistUrl,
      githubToken: githubToken,
      preferredFormat: preferredFormat,
      flattenTopFolder: flattenTopFolder,
      uploadMode: uploadMode
    },
    () => {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 保存配置';
      showAlert('✅ 配置已保存！现在可以关闭此页面，在扩展弹窗中点击"立即同步"', 'success');
    }
  );
}

/**
 * 测试连接
 */
function testConnection() {
  const downloadGistUrl = downloadGistUrlInput.value.trim();

  if (!downloadGistUrl) {
    showAlert('请先输入下载源 Gist URL', 'error');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  showAlert('正在连接 GitHub...', 'info');

  // 临时保存配置用于测试
  const githubToken = githubTokenInput.value.trim();
  const preferredFormat = document.querySelector('input[name="format"]:checked').value;
  const flattenTopFolder = document.getElementById('flattenTopFolder').checked;

  chrome.storage.sync.set(
    {
      downloadGistUrl: downloadGistUrl,
      githubToken: githubToken,
      preferredFormat: preferredFormat,
      flattenTopFolder: flattenTopFolder
    },
    () => {
      // 向 background 发送测试请求
      chrome.runtime.sendMessage(
        { action: 'testConnection' },
        (response) => {
          testBtn.disabled = false;
          testBtn.textContent = '🔍 测试连接';

          if (response.success) {
            showAlert(
              `✅ ${response.message}\n文件名: ${response.filename}`,
              'success'
            );
          } else {
            showAlert(`❌ 连接失败: ${response.message}`, 'error');
          }
        }
      );
    }
  );
}

// 事件监听
form.addEventListener('submit', saveConfig);
testBtn.addEventListener('click', testConnection);

// 监听上传模式变化
document.querySelectorAll('input[name="uploadMode"]').forEach(radio => {
  radio.addEventListener('change', updateUploadGistUrlVisibility);
});

// 页面加载时加载配置
loadConfig();

// 添加快捷键支持
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S 保存
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

/**
 * Options Page Script - 配置页逻辑
 */

const form = document.getElementById('configForm');
const gistUrlInput = document.getElementById('gistUrl');
const githubTokenInput = document.getElementById('githubToken');
const gistIdInput = document.getElementById('gistId');
const gistIdGroup = document.getElementById('gistIdGroup');
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
 * 根据上传模式更新 Gist ID 输入框的可见性
 */
function updateGistIdVisibility() {
  const uploadMode = document.querySelector('input[name="uploadMode"]:checked')?.value;
  if (uploadMode === 'fixed') {
    gistIdGroup.classList.remove('hidden');
  } else {
    gistIdGroup.classList.add('hidden');
  }
}

/**
 * 加载已保存的配置
 */
function loadConfig() {
  chrome.storage.sync.get(['gistUrl', 'githubToken', 'preferredFormat', 'flattenTopFolder', 'uploadMode', 'gistId'], (result) => {
    if (result.gistUrl) {
      gistUrlInput.value = result.gistUrl;
    }
    if (result.githubToken) {
      githubTokenInput.value = result.githubToken;
    }
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

    // 加载上传模式（默认为 fixed）
    const uploadMode = result.uploadMode || 'fixed';
    const uploadModeRadio = document.querySelector(`input[name="uploadMode"][value="${uploadMode}"]`);
    if (uploadModeRadio) {
      uploadModeRadio.checked = true;
    }

    // 加载 Gist ID
    if (result.gistId) {
      gistIdInput.value = result.gistId;
    }

    // 根据上传模式显示/隐藏 Gist ID 输入框
    updateGistIdVisibility();
  });
}

/**
 * 保存配置
 */
function saveConfig(e) {
  e.preventDefault();

  const gistUrl = gistUrlInput.value.trim();
  const githubToken = githubTokenInput.value.trim();
  const preferredFormat = document.querySelector('input[name="format"]:checked').value;
  const flattenTopFolder = document.getElementById('flattenTopFolder').checked;
  const uploadMode = document.querySelector('input[name="uploadMode"]:checked').value;
  const gistId = gistIdInput.value.trim();

  if (!gistUrl) {
    showAlert('请输入 Gist URL', 'error');
    return;
  }

  // 验证 URL 格式
  if (!gistUrl.includes('gist.github.com') && !gistUrl.includes('githubusercontent.com')) {
    showAlert('无效的 Gist URL。请使用 gist.github.com 或 raw.githubusercontent.com 域名', 'error');
    return;
  }

  // 如果是固定模式，验证 Gist ID
  if (uploadMode === 'fixed' && !gistId) {
    showAlert('固定模式需要填写 Gist ID', 'error');
    gistIdInput.focus();
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = '保存中...';

  chrome.storage.sync.set(
    {
      gistUrl: gistUrl,
      githubToken: githubToken,
      preferredFormat: preferredFormat,
      flattenTopFolder: flattenTopFolder,
      uploadMode: uploadMode,
      gistId: gistId
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
  const gistUrl = gistUrlInput.value.trim();

  if (!gistUrl) {
    showAlert('请先输入 Gist URL', 'error');
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
      gistUrl: gistUrl,
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
  radio.addEventListener('change', updateGistIdVisibility);
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

/**
 * 提取书签页面逻辑
 */

let selectedFolders = null;
let selectedFormat = 'bookmarkhub';

const rangeRadios = document.querySelectorAll('input[name="range"]');
const selectFoldersBtn = document.getElementById('selectFoldersBtn');
const selectedInfo = document.getElementById('selectedInfo');
const formatBtns = document.querySelectorAll('.format-btn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadGistBtn = document.getElementById('uploadGistBtn');

/**
 * 初始化
 */
function init() {
  // 监听范围选择
  rangeRadios.forEach(radio => {
    radio.addEventListener('change', handleRangeChange);
  });

  // 监听格式选择
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatBtns.forEach(b => b.style.background = 'white');
      btn.style.background = '#e8f5ee';
      btn.style.borderColor = '#1d7a50';
      selectedFormat = btn.dataset.format;
    });
  });

  // 默认选中第一个格式
  formatBtns[0].click();

  // 选择文件夹
  selectFoldersBtn.addEventListener('click', openFolderPicker);

  // 下载
  downloadBtn.addEventListener('click', handleDownload);

  // 上传到 Gist
  uploadGistBtn.addEventListener('click', handleUploadGist);

  // 监听来自选择器的消息
  window.addEventListener('message', handlePickerMessage);
}

/**
 * 处理范围选择变化
 */
function handleRangeChange(e) {
  const value = e.target.value;

  if (value === 'select') {
    selectFoldersBtn.style.display = 'block';
    selectedInfo.classList.remove('show');
    selectedFolders = null;
  } else {
    selectFoldersBtn.style.display = 'none';
    selectedInfo.classList.remove('show');
    selectedFolders = null;
  }
}

/**
 * 打开文件夹选择器
 */
function openFolderPicker() {
  chrome.windows.create({
    url: chrome.runtime.getURL('picker.html'),
    type: 'popup',
    width: 600,
    height: 600
  });
}

/**
 * 处理选择器返回的消息
 */
function handlePickerMessage(event) {
  if (event.data.action === 'bookmarksSelected') {
    selectedFolders = event.data.folders;

    if (!selectedFolders || selectedFolders.length === 0) {
      selectedInfo.textContent = '未选择任何文件夹';
      selectedInfo.classList.remove('show');
      return;
    }

    // 计算总书签数
    const totalBookmarks = selectedFolders.reduce((sum, folder) => {
      return sum + countBookmarksInTree(folder);
    }, 0);

    selectedInfo.textContent = `✓ 已选择 ${selectedFolders.length} 个文件夹，共 ${totalBookmarks} 个书签`;
    selectedInfo.classList.add('show');

    console.log('Selected folders:', selectedFolders.length, 'Total bookmarks:', totalBookmarks);
  }
}

    // 计算总书签数
    const totalBookmarks = selectedFolders.reduce((sum, folder) => {
      return sum + countBookmarksInTree(folder);
    }, 0);

    selectedInfo.textContent = `已选择: ${selectedFolders.length} 个文件夹，共 ${totalBookmarks} 个书签`;
    selectedInfo.classList.add('show');
  }
}

/**
 * 获取要导出的书签
 */
async function getBookmarksToExport() {
  const rangeValue = document.querySelector('input[name="range"]:checked').value;

  if (rangeValue === 'all') {
    // 提取所有书签
    return await extractAllBookmarks();
  } else {
    // 使用选中的文件夹
    if (!selectedFolders || selectedFolders.length === 0) {
      throw new Error('请先选择要提取的文件夹');
    }
    return selectedFolders;
  }
}

/**
 * 处理下载
 */
async function handleDownload() {
  downloadBtn.disabled = true;
  downloadBtn.textContent = '提取中...';

  try {
    const folders = await getBookmarksToExport();

    let content, filename, mimeType;

    switch (selectedFormat) {
      case 'bookmarkhub':
        content = JSON.stringify(exportToBookmarkHub(folders), null, 2);
        filename = `bookmarks-${Date.now()}.BookmarkHub.txt`;
        mimeType = 'application/json';
        break;

      case 'html':
        content = exportToChromiumHtml(folders);
        filename = `bookmarks-${Date.now()}.html`;
        mimeType = 'text/html';
        break;

      case 'json':
        content = JSON.stringify({
          schema: 'bookmark-tree/v1',
          exportDate: new Date().toISOString(),
          tree: folders
        }, null, 2);
        filename = `bookmarks-${Date.now()}.tree.json`;
        mimeType = 'application/json';
        break;
    }

    // 下载文件
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    downloadBtn.textContent = '✓ 下载成功';
    setTimeout(() => {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '💾 下载到本地';
    }, 2000);

  } catch (error) {
    alert('提取失败: ' + error.message);
    downloadBtn.disabled = false;
    downloadBtn.textContent = '💾 下载到本地';
  }
}

/**
 * 处理上传到 Gist
 */
async function handleUploadGist() {
  uploadGistBtn.disabled = true;
  uploadGistBtn.textContent = '提取中...';

  try {
    const folders = await getBookmarksToExport();

    // 获取配置
    const config = await new Promise(resolve => {
      chrome.storage.sync.get(['githubToken'], resolve);
    });

    if (!config.githubToken) {
      throw new Error('请先在配置页面设置 GitHub Token');
    }

    let content, filename;

    switch (selectedFormat) {
      case 'bookmarkhub':
        content = JSON.stringify(exportToBookmarkHub(folders), null, 2);
        filename = `bookmarks-${Date.now()}.BookmarkHub.txt`;
        break;

      case 'html':
        content = exportToChromiumHtml(folders);
        filename = `bookmarks-${Date.now()}.html`;
        break;

      case 'json':
        content = JSON.stringify({
          schema: 'bookmark-tree/v1',
          exportDate: new Date().toISOString(),
          tree: folders
        }, null, 2);
        filename = `bookmarks-${Date.now()}.tree.json`;
        break;
    }

    // 上传到 Gist
    uploadGistBtn.textContent = '上传中...';

    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: `Bookmarks exported from browser on ${new Date().toLocaleString()}`,
        public: false,
        files: {
          [filename]: {
            content: content
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }

    const gist = await response.json();

    uploadGistBtn.textContent = '✓ 上传成功';

    // 显示 Gist URL
    alert(`上传成功！\n\nGist URL: ${gist.html_url}\n\n已复制到剪贴板`);

    // 复制到剪贴板
    navigator.clipboard.writeText(gist.html_url);

    setTimeout(() => {
      uploadGistBtn.disabled = false;
      uploadGistBtn.textContent = '☁️ 上传到 Gist';
    }, 2000);

  } catch (error) {
    alert('操作失败: ' + error.message);
    uploadGistBtn.disabled = false;
    uploadGistBtn.textContent = '☁️ 上传到 Gist';
  }
}

// 初始化
init();

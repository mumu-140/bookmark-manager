/**
 * 提取书签页面逻辑（内嵌文件夹选择器）
 */

let selectedFolders = null;
let selectedFormat = 'bookmarkhub';
let bookmarkTree = null;
let selectedIds = new Set();
let collapsedIds = new Set();

// DOM 元素（延迟获取，确保 DOM 已加载）
let rangeRadios, pickerPanel, selectedInfo, formatBtns, downloadBtn, uploadGistBtn;
let closePicker, selectAllBtn, deselectAllBtn, selectBarBtn, expandAllBtn, collapseAllBtn;
let bookmarkTreeContainer, pickerInfo, confirmBtn;

/**
 * 初始化
 */
function init() {
  // 获取 DOM 元素
  rangeRadios = document.querySelectorAll('input[name="range"]');
  pickerPanel = document.getElementById('pickerPanel');
  selectedInfo = document.getElementById('selectedInfo');
  formatBtns = document.querySelectorAll('.format-btn');
  downloadBtn = document.getElementById('downloadBtn');
  uploadGistBtn = document.getElementById('uploadGistBtn');

  // 选择器元素
  closePicker = document.getElementById('closePicker');
  selectAllBtn = document.getElementById('selectAllBtn');
  deselectAllBtn = document.getElementById('deselectAllBtn');
  selectBarBtn = document.getElementById('selectBarBtn');
  expandAllBtn = document.getElementById('expandAllBtn');
  collapseAllBtn = document.getElementById('collapseAllBtn');
  bookmarkTreeContainer = document.getElementById('bookmarkTree');
  pickerInfo = document.getElementById('pickerInfo');
  confirmBtn = document.getElementById('confirmBtn');

  if (!pickerPanel || !downloadBtn || !uploadGistBtn || formatBtns.length === 0) {
    console.error('Failed to find required DOM elements:', {
      pickerPanel: !!pickerPanel,
      downloadBtn: !!downloadBtn,
      uploadGistBtn: !!uploadGistBtn,
      formatBtns: formatBtns.length
    });
    return;
  }
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

  // 选择器按钮
  closePicker.addEventListener('click', hidePickerPanel);
  selectAllBtn.addEventListener('click', selectAll);
  deselectAllBtn.addEventListener('click', deselectAll);
  selectBarBtn.addEventListener('click', selectBookmarksBar);
  expandAllBtn.addEventListener('click', expandAll);
  collapseAllBtn.addEventListener('click', collapseAll);
  confirmBtn.addEventListener('click', confirmSelection);

  // 下载
  downloadBtn.addEventListener('click', handleDownload);

  // 上传到 Gist
  uploadGistBtn.addEventListener('click', handleUploadGist);
}

/**
 * 处理范围选择变化
 */
function handleRangeChange(e) {
  const value = e.target.value;

  if (value === 'select') {
    showPickerPanel();
  } else {
    hidePickerPanel();
    selectedFolders = null;
    selectedIds.clear();
  }
}

/**
 * 显示选择器面板
 */
async function showPickerPanel() {
  pickerPanel.style.display = 'flex';

  if (!bookmarkTree) {
    bookmarkTreeContainer.textContent = '加载中...';
    try {
      bookmarkTree = await getBookmarkTree();
      renderTree();
    } catch (error) {
      bookmarkTreeContainer.textContent = '加载失败: ' + error.message;
    }
  }
}

/**
 * 隐藏选择器面板
 */
function hidePickerPanel() {
  pickerPanel.style.display = 'none';
}

/**
 * 打开文件夹选择器（旧方法，已废弃）
 */
function openFolderPicker() {
  // 不再使用弹窗，直接显示右侧面板
  showPickerPanel();
}

/**
 * 处理选择器返回的消息（旧方法，已废弃）
 */
function handlePickerMessage(event) {
  // 不再需要，直接在页面内处理
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

      default:
        throw new Error('未知的导出格式: ' + selectedFormat);
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
    console.error('Download error:', error);
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

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM 已经加载完成
  init();
}

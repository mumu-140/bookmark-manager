/**
 * 对比工具逻辑
 */

let sourceAData = null;
let sourceBData = null;

// DOM 元素
const sourceACard = document.getElementById('sourceA');
const sourceBCard = document.getElementById('sourceB');

const btnBrowserA = document.getElementById('btnBrowserA');
const btnFileA = document.getElementById('btnFileA');
const btnGistA = document.getElementById('btnGistA');
const fileInputA = document.getElementById('fileInputA');
const fileNameA = document.getElementById('fileNameA');

const btnBrowserB = document.getElementById('btnBrowserB');
const btnFileB = document.getElementById('btnFileB');
const btnGistB = document.getElementById('btnGistB');
const fileInputB = document.getElementById('fileInputB');
const fileNameB = document.getElementById('fileNameB');

const compareBtn = document.getElementById('compareBtn');
const openWebBtn = document.getElementById('openWebBtn');
const status = document.getElementById('status');

/**
 * 初始化
 */
function init() {
  // 来源 A
  btnBrowserA.addEventListener('click', () => extractFromBrowser('A'));
  btnFileA.addEventListener('click', () => fileInputA.click());
  btnGistA.addEventListener('click', () => fetchFromGist('A'));
  fileInputA.addEventListener('change', (e) => handleFileUpload(e, 'A'));

  // 来源 B
  btnBrowserB.addEventListener('click', () => extractFromBrowser('B'));
  btnFileB.addEventListener('click', () => fileInputB.click());
  btnGistB.addEventListener('click', () => fetchFromGist('B'));
  fileInputB.addEventListener('change', (e) => handleFileUpload(e, 'B'));

  // 对比按钮
  compareBtn.addEventListener('click', performCompare);

  // 打开网页版
  openWebBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://bm.yangsen666.cloud'
    });
  });
}

/**
 * 从浏览器提取
 */
async function extractFromBrowser(source) {
  showStatus('提取中...', 'loading');

  try {
    const bookmarks = await extractAllBookmarks();

    if (source === 'A') {
      sourceAData = bookmarks;
      fileNameA.textContent = `✓ 已加载浏览器书签 (${countAllBookmarks(bookmarks)} 个)`;
      sourceACard.classList.add('active');
    } else {
      sourceBData = bookmarks;
      fileNameB.textContent = `✓ 已加载浏览器书签 (${countAllBookmarks(bookmarks)} 个)`;
      sourceBCard.classList.add('active');
    }

    updateCompareBtn();
    hideStatus();
  } catch (error) {
    showStatus('提取失败: ' + error.message, 'error');
  }
}

/**
 * 处理文件上传
 */
async function handleFileUpload(event, source) {
  const file = event.target.files[0];
  if (!file) return;

  showStatus('解析中...', 'loading');

  try {
    const content = await file.text();
    const bookmarks = parseBookmarks(content, file.name, 'auto');

    if (source === 'A') {
      sourceAData = bookmarks;
      fileNameA.textContent = `✓ ${file.name} (${countAllBookmarks(bookmarks)} 个书签)`;
      sourceACard.classList.add('active');
    } else {
      sourceBData = bookmarks;
      fileNameB.textContent = `✓ ${file.name} (${countAllBookmarks(bookmarks)} 个书签)`;
      sourceBCard.classList.add('active');
    }

    updateCompareBtn();
    hideStatus();
  } catch (error) {
    showStatus('解析失败: ' + error.message, 'error');
  }
}

/**
 * 从 Gist 获取
 */
async function fetchFromGist(source) {
  const url = prompt('请输入 Gist URL:');
  if (!url) return;

  showStatus('下载中...', 'loading');

  try {
    // 获取配置
    const config = await new Promise(resolve => {
      chrome.storage.sync.get(['githubToken'], resolve);
    });

    // 解析 URL
    let rawUrl = url;
    if (url.includes('gist.github.com') && !url.includes('raw')) {
      const gistId = url.split('/').pop().split('#')[0];
      const headers = {};
      if (config.githubToken) {
        headers['Authorization'] = `token ${config.githubToken}`;
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
      if (!response.ok) {
        throw new Error(`获取失败: ${response.status}`);
      }

      const gist = await response.json();
      const files = Object.values(gist.files);
      if (files.length === 0) {
        throw new Error('Gist 中没有文件');
      }

      rawUrl = files[0].raw_url;
    }

    // 下载文件
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

    const content = await response.text();
    const filename = rawUrl.split('/').pop();
    const bookmarks = parseBookmarks(content, filename, 'auto');

    if (source === 'A') {
      sourceAData = bookmarks;
      fileNameA.textContent = `✓ 来自 Gist (${countAllBookmarks(bookmarks)} 个书签)`;
      sourceACard.classList.add('active');
    } else {
      sourceBData = bookmarks;
      fileNameB.textContent = `✓ 来自 Gist (${countAllBookmarks(bookmarks)} 个书签)`;
      sourceBCard.classList.add('active');
    }

    updateCompareBtn();
    hideStatus();
  } catch (error) {
    showStatus('获取失败: ' + error.message, 'error');
  }
}

/**
 * 执行对比
 */
function performCompare() {
  if (!sourceAData || !sourceBData) {
    alert('请先加载两个来源的书签');
    return;
  }

  showStatus('对比中...', 'loading');

  // 简化版对比：只统计数量差异
  setTimeout(() => {
    const countA = countAllBookmarks(sourceAData);
    const countB = countAllBookmarks(sourceBData);
    const diff = Math.abs(countA - countB);

    const message = `
对比完成！

来源 A: ${countA} 个书签
来源 B: ${countB} 个书签
差异: ${diff} 个

💡 提示：此为简化版对比，仅显示数量统计。

要进行详细的逐条对比和审核，请使用完整网页版工具：
https://bm.yangsen666.cloud

点击"确定"打开网页版？
    `;

    if (confirm(message.trim())) {
      chrome.tabs.create({
        url: 'https://bm.yangsen666.cloud'
      });
    }

    hideStatus();
  }, 500);
}

/**
 * 统计所有书签数量
 */
function countAllBookmarks(folders) {
  let total = 0;
  folders.forEach(folder => {
    total += countBookmarksInTree(folder);
  });
  return total;
}

/**
 * 更新对比按钮状态
 */
function updateCompareBtn() {
  compareBtn.disabled = !(sourceAData && sourceBData);
}

/**
 * 显示状态
 */
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status show ${type}`;
}

/**
 * 隐藏状态
 */
function hideStatus() {
  status.className = 'status';
}

// 初始化
init();
